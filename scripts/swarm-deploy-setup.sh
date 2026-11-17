#!/bin/sh
# Server-side setup for the GitHub Actions deploy key. Run ONCE, as root, on the
# swarm manager. Idempotent: re-running it reinstalls the forced command, which is
# how you pick up a change to it.
#
#   scp scripts/swarm-deploy-setup.sh root@swarm:/tmp/
#   ssh root@swarm 'sh /tmp/swarm-deploy-setup.sh "<contents of ~/.ssh/swarm-deploy.pub>"'
#
# What it does, and why it is shaped this way: the workflow needs to run exactly
# one command on this host, so the key is pinned to a forced command that takes a
# single argument and validates it as a 40-character hex SHA. A leaked deploy key
# can redeploy this one service at some commit. It cannot get a shell, forward a
# port, touch another service, or run anything else. That is the whole point —
# an unrestricted root key living in a third-party CI system is a much larger
# blast radius than the job needs.
#
# The user is a dedicated `sw-deploy` rather than a generic `deploy`, so the
# account holding this key holds nothing else and can't collide with another
# project's deploy user on the same swarm.
set -e

PUBKEY="$1"
[ -n "$PUBKEY" ] || { echo "usage: $0 '<ssh public key>'" >&2; exit 1; }

DEPLOY_USER=sw-deploy
SERVICE=standing-wave_web
IMAGE=ghcr.io/ps-prabhjyotsingh/standing-wave

# 1. An unprivileged user that can talk to the Docker socket and nothing else.
#    The login shell must be a real shell: sshd runs the forced command through
#    it, and /usr/sbin/nologin would refuse the forced command too. The key
#    options below are what deny an interactive session.
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/sh "$DEPLOY_USER"
  passwd -l "$DEPLOY_USER" >/dev/null
  echo "created user $DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

# 2. The only command that key may run. It waits for the rolling update to
#    converge and then checks every running task is on the requested image, so
#    its exit code means "this commit is live", not "the update was accepted".
cat > /usr/local/bin/deploy-standing-wave <<SCRIPT
#!/bin/sh
set -eu
sha="\${SSH_ORIGINAL_COMMAND:-}"
case "\$sha" in
  ''|*[!0-9a-f]*) echo "refused: not a hex sha" >&2; exit 1 ;;
esac
[ "\${#sha}" -eq 40 ] || { echo "refused: sha must be 40 chars" >&2; exit 1; }

want="$IMAGE:\$sha"
echo "deploying \$want"
docker service update --image "\$want" --update-order start-first \\
  --detach=false --quiet $SERVICE

replicas=\$(docker service inspect $SERVICE --format '{{.Spec.Mode.Replicated.Replicas}}')
live=\$(docker service ps $SERVICE --filter desired-state=running \\
  --format '{{.Image}} {{.CurrentState}}' | grep -c "^\$want\\(@[^ ]*\\)\\? Running" || true)
if [ "\$live" -ne "\$replicas" ]; then
  echo "FAILED: \$live of \$replicas replicas running \$want" >&2
  docker service ps $SERVICE --no-trunc >&2
  exit 1
fi
echo "live: \$replicas of \$replicas replicas on \$want"
SCRIPT
chmod 755 /usr/local/bin/deploy-standing-wave

# 3. The key, restricted to that command and stripped of every other capability.
HOME_DIR=$(getent passwd "$DEPLOY_USER" | cut -d: -f6)
mkdir -p "$HOME_DIR/.ssh"
OPTS='command="/usr/local/bin/deploy-standing-wave",restrict'
touch "$HOME_DIR/.ssh/authorized_keys"
grep -qF "$PUBKEY" "$HOME_DIR/.ssh/authorized_keys" 2>/dev/null \
  || echo "$OPTS $PUBKEY" >> "$HOME_DIR/.ssh/authorized_keys"
chmod 700 "$HOME_DIR/.ssh"
chmod 600 "$HOME_DIR/.ssh/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$HOME_DIR/.ssh"

echo "done. verify from your mac with:"
echo "  ssh -i ~/.ssh/swarm-deploy $DEPLOY_USER@<host> \$(git rev-parse HEAD)"
echo "and confirm anything else is refused:"
echo "  ssh -i ~/.ssh/swarm-deploy $DEPLOY_USER@<host> id    # refused: not a hex sha"
