#!/bin/sh
# Server-side setup for the GitHub Actions deploy key. Run ONCE, as root, on the
# swarm manager. Idempotent.
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
set -e

PUBKEY="$1"
[ -n "$PUBKEY" ] || { echo "usage: $0 '<ssh public key>'" >&2; exit 1; }

DEPLOY_USER=deploy
SERVICE=standing-wave_web
IMAGE=ghcr.io/ps-prabhjyotsingh/standing-wave

# 1. An unprivileged user that can talk to the Docker socket and nothing else.
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /usr/sbin/nologin "$DEPLOY_USER"
  echo "created user $DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

# 2. The only command that key may run.
cat > /usr/local/bin/deploy-standing-wave <<SCRIPT
#!/bin/sh
set -e
sha="\$SSH_ORIGINAL_COMMAND"
case "\$sha" in
  ''|*[!0-9a-f]*) echo "refused: not a hex sha" >&2; exit 1 ;;
esac
[ "\${#sha}" -eq 40 ] || { echo "refused: sha must be 40 chars" >&2; exit 1; }
echo "deploying $IMAGE:\$sha"
exec docker service update --image "$IMAGE:\$sha" --update-order start-first $SERVICE
SCRIPT
chmod 755 /usr/local/bin/deploy-standing-wave

# 3. The key, restricted to that command and stripped of every other capability.
HOME_DIR=$(getent passwd "$DEPLOY_USER" | cut -d: -f6)
mkdir -p "$HOME_DIR/.ssh"
OPTS='command="/usr/local/bin/deploy-standing-wave",no-agent-forwarding,no-port-forwarding,no-pty,no-user-rc,no-X11-forwarding'
touch "$HOME_DIR/.ssh/authorized_keys"
grep -qF "$PUBKEY" "$HOME_DIR/.ssh/authorized_keys" 2>/dev/null \
  || echo "$OPTS $PUBKEY" >> "$HOME_DIR/.ssh/authorized_keys"
chmod 700 "$HOME_DIR/.ssh"
chmod 600 "$HOME_DIR/.ssh/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$HOME_DIR/.ssh"

echo "done. verify from your mac with:"
echo "  ssh -i ~/.ssh/swarm-deploy $DEPLOY_USER@swarm \$(git rev-parse HEAD)"
echo "and confirm a shell is refused:"
echo "  ssh -i ~/.ssh/swarm-deploy $DEPLOY_USER@swarm    # should not give a prompt"
