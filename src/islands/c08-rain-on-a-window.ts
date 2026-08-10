// C08 · Rain on a window.
// Nothing here means anything. A city that does not exist, out of focus, behind water.

import { createRuntime, type Runtime } from './piece-runtime';
import { button } from './controls';

interface Drop {
  x: number;
  y: number;
  r: number;
  vy: number;
  runner: boolean;
  life: number;
}

export default function mount(host: HTMLElement, opts: { reducedMotion: boolean }) {
  let sharp: HTMLCanvasElement | null = null;
  let blurred: HTMLCanvasElement | null = null;
  let drops: Drop[] = [];
  let audio: { ctx: AudioContext; gain: GainNode } | null = null;
  let soundOn = false;

  function buildCity(rt: Runtime) {
    const w = Math.max(1, Math.round(rt.width));
    const h = Math.max(1, Math.round(rt.height));
    sharp = document.createElement('canvas');
    sharp.width = w;
    sharp.height = h;
    const ctx = sharp.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = rt.palette.dark ? '#05080c' : '#cfd6dd';
    ctx.fillRect(0, 0, w, h);

    // Blocks of building, darker than the sky, with windows lit at random.
    const horizon = h * 0.62;
    const buildings = Math.max(6, Math.round(w / 90));
    for (let i = 0; i < buildings; i++) {
      const bw = (w / buildings) * (0.7 + Math.random() * 0.7);
      const bx = (i * w) / buildings + Math.random() * 12;
      const bh = h * (0.18 + Math.random() * 0.42);
      ctx.fillStyle = rt.palette.dark ? '#0a0f16' : '#b7c0c9';
      ctx.fillRect(bx, horizon - bh, bw, bh + h * 0.3);

      const cols = Math.max(2, Math.floor(bw / 14));
      const rows = Math.max(3, Math.floor(bh / 18));
      for (let cx = 0; cx < cols; cx++) {
        for (let cy = 0; cy < rows; cy++) {
          if (Math.random() > 0.34) continue;
          const lx = bx + 6 + cx * 14;
          const ly = horizon - bh + 8 + cy * 18;
          const warm = Math.random();
          const colour =
            warm > 0.75
              ? 'rgba(120, 220, 210, 0.85)'
              : warm > 0.4
                ? 'rgba(240, 205, 140, 0.85)'
                : 'rgba(230, 235, 240, 0.6)';
          const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 16);
          glow.addColorStop(0, colour);
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glow;
          ctx.fillRect(lx - 16, ly - 16, 32, 32);
        }
      }
    }

    // Street level: a few big soft lights.
    for (let i = 0; i < Math.round(w / 120); i++) {
      const lx = Math.random() * w;
      const ly = horizon + Math.random() * (h - horizon) * 0.7;
      const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 60);
      glow.addColorStop(0, 'rgba(250, 210, 150, 0.5)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(lx - 60, ly - 60, 120, 120);
    }

    // Out of focus: draw small, draw back big. Cheaper and softer than a filter.
    blurred = document.createElement('canvas');
    blurred.width = Math.max(1, Math.round(w / 14));
    blurred.height = Math.max(1, Math.round(h / 14));
    const bctx = blurred.getContext('2d');
    if (bctx) {
      bctx.imageSmoothingEnabled = true;
      bctx.drawImage(sharp, 0, 0, blurred.width, blurred.height);
    }
  }

  function seedDrops(rt: Runtime) {
    drops = [];
    const count = Math.round((rt.width * rt.height) / 5200);
    for (let i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * rt.width,
        y: Math.random() * rt.height,
        r: 1.5 + Math.random() * 4,
        vy: 0,
        runner: false,
        life: 1,
      });
    }
  }

  function spawnRunner(rt: Runtime) {
    drops.push({
      x: Math.random() * rt.width,
      y: -12,
      r: 6 + Math.random() * 9,
      vy: 40 + Math.random() * 70,
      runner: true,
      life: 1,
    });
  }

  function render(rt: Runtime) {
    const ctx = rt.ctx;
    if (!sharp || !blurred) return;

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(blurred, 0, 0, rt.width, rt.height);
    // Fog on the glass: everything except the drops is dimmed, so what you see
    // through the water is brighter and sharper than what you see around it.
    ctx.fillStyle = rt.palette.dark ? 'rgba(8, 12, 18, 0.55)' : 'rgba(226, 231, 236, 0.5)';
    ctx.fillRect(0, 0, rt.width, rt.height);

    // A drop is a lens: it shows the sharp city, upside down and shrunk.
    for (const drop of drops) {
      const r = drop.r;
      ctx.save();
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, r, 0, Math.PI * 2);
      ctx.clip();
      const zoom = 3.2;
      const sw = (r * 2) / zoom;
      const sh = (r * 2) / zoom;
      const sx = Math.max(0, Math.min(sharp.width - sw, drop.x - sw / 2));
      const sy = Math.max(0, Math.min(sharp.height - sh, drop.y - sh / 2 + r * 1.2));
      ctx.translate(drop.x, drop.y);
      ctx.scale(1, -1);
      ctx.translate(-drop.x, -drop.y);
      ctx.drawImage(sharp, sx, sy, sw, sh, drop.x - r, drop.y - r, r * 2, r * 2);
      ctx.restore();

      ctx.strokeStyle = rt.palette.dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(drop.x - r * 0.22, drop.y - r * 0.22, r * 0.82, Math.PI * 0.9, Math.PI * 1.9);
      ctx.stroke();
    }
  }

  function step(dt: number, rt: Runtime) {
    if (Math.random() < dt * 12) spawnRunner(rt);

    for (const drop of drops) {
      if (!drop.runner) continue;
      drop.vy += dt * 26 * (drop.r / 6);
      drop.y += drop.vy * dt;

      // Running drops absorb what they pass over and leave a thin trail behind.
      for (const other of drops) {
        if (other === drop || other.life <= 0) continue;
        const dx = other.x - drop.x;
        const dy = other.y - drop.y;
        if (Math.abs(dx) < drop.r && Math.abs(dy) < drop.r * 1.4) {
          drop.r = Math.min(14, Math.sqrt(drop.r * drop.r + other.r * other.r * 0.55));
          other.life = 0;
        }
      }
      if (Math.random() < dt * 14 && drop.r > 3) {
        drops.push({
          x: drop.x + (Math.random() - 0.5) * 2,
          y: drop.y - drop.r,
          r: 1 + Math.random() * 1.6,
          vy: 0,
          runner: false,
          life: 1,
        });
        drop.r *= 0.985;
      }
    }

    drops = drops.filter((d) => d.life > 0 && d.y - d.r < rt.height + 20);

    // Keep the glass populated.
    if (Math.random() < dt * 26) {
      drops.push({
        x: Math.random() * rt.width,
        y: Math.random() * rt.height,
        r: 1.2 + Math.random() * 3,
        vy: 0,
        runner: false,
        life: 1,
      });
    }
  }

  const rt = createRuntime(host, opts, {
    resize(rt) {
      buildCity(rt);
      seedDrops(rt);
      render(rt);
    },
    theme(rt) {
      buildCity(rt);
      render(rt);
    },
    frame(dt, rt) {
      step(dt, rt);
      render(rt);
    },
  });

  function toggleSound(btn: HTMLButtonElement) {
    if (soundOn) {
      audio?.gain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.2);
      soundOn = false;
      btn.textContent = 'sound off';
      btn.setAttribute('aria-pressed', 'false');
      return;
    }
    if (!audio) {
      const Ctx = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      // Two seconds of noise, looped, rolled off: rain is mostly filtered hiss.
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let previous = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        previous = (previous + 0.02 * white) / 1.02;
        data[i] = previous * 3.5 + white * 0.35;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1100;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start();
      audio = { ctx, gain };
    }
    void audio.ctx.resume();
    audio.gain.gain.setTargetAtTime(0.09, audio.ctx.currentTime, 0.4);
    soundOn = true;
    btn.textContent = 'sound on';
    btn.setAttribute('aria-pressed', 'true');
  }

  const soundButton = button('sound off', () => toggleSound(soundButton));
  soundButton.setAttribute('aria-pressed', 'false');
  rt.controls.append(soundButton);
}
