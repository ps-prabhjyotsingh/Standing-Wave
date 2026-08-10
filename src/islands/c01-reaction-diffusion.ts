// C01 · Reaction–diffusion (Gray–Scott).
// Two chemicals on a grid. One feeds, one kills, both spread. Nothing else.

import { createRuntime, type Runtime } from './piece-runtime';
import { slider, select, button, pointerPos } from './controls';

const PRESETS: Record<string, { f: number; k: number }> = {
  coral: { f: 0.0545, k: 0.062 },
  fingerprints: { f: 0.037, k: 0.06 },
  mitosis: { f: 0.0367, k: 0.0649 },
};

const DA = 1.0;
const DB = 0.5;
const STEPS_PER_FRAME = 8;
const CELL = 4; // CSS pixels per cell

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export default function mount(host: HTMLElement, opts: { reducedMotion: boolean }) {
  let cols = 0;
  let rows = 0;
  let a = new Float32Array(0);
  let b = new Float32Array(0);
  let a2 = new Float32Array(0);
  let b2 = new Float32Array(0);
  let image: ImageData | null = null;
  let buffer: HTMLCanvasElement | null = null;
  let bufferCtx: CanvasRenderingContext2D | null = null;

  let feed = PRESETS.coral.f;
  let kill = PRESETS.coral.k;

  function seed(cx: number, cy: number, radius: number) {
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y > radius * radius) continue;
        const gx = (cx + x + cols) % cols;
        const gy = (cy + y + rows) % rows;
        b[gy * cols + gx] = 1;
      }
    }
  }

  function reset() {
    a.fill(1);
    b.fill(0);
    const blobs = 5;
    for (let i = 0; i < blobs; i++) {
      seed(
        Math.floor(Math.random() * cols),
        Math.floor(Math.random() * rows),
        Math.max(3, Math.round(Math.min(cols, rows) * 0.04))
      );
    }
  }

  function allocate(rt: Runtime) {
    cols = Math.max(40, Math.floor(rt.width / CELL));
    rows = Math.max(40, Math.floor(rt.height / CELL));
    const n = cols * rows;
    a = new Float32Array(n);
    b = new Float32Array(n);
    a2 = new Float32Array(n);
    b2 = new Float32Array(n);
    buffer = document.createElement('canvas');
    buffer.width = cols;
    buffer.height = rows;
    bufferCtx = buffer.getContext('2d');
    image = bufferCtx ? bufferCtx.createImageData(cols, rows) : null;
    reset();
  }

  function step() {
    for (let y = 0; y < rows; y++) {
      const yUp = ((y - 1 + rows) % rows) * cols;
      const yDown = ((y + 1) % rows) * cols;
      const yHere = y * cols;
      for (let x = 0; x < cols; x++) {
        const xLeft = (x - 1 + cols) % cols;
        const xRight = (x + 1) % cols;
        const i = yHere + x;

        const lapA =
          a[yUp + x] * 0.2 +
          a[yDown + x] * 0.2 +
          a[yHere + xLeft] * 0.2 +
          a[yHere + xRight] * 0.2 +
          (a[yUp + xLeft] + a[yUp + xRight] + a[yDown + xLeft] + a[yDown + xRight]) * 0.05 -
          a[i];
        const lapB =
          b[yUp + x] * 0.2 +
          b[yDown + x] * 0.2 +
          b[yHere + xLeft] * 0.2 +
          b[yHere + xRight] * 0.2 +
          (b[yUp + xLeft] + b[yUp + xRight] + b[yDown + xLeft] + b[yDown + xRight]) * 0.05 -
          b[i];

        const av = a[i];
        const bv = b[i];
        const reaction = av * bv * bv;
        a2[i] = Math.min(1, Math.max(0, av + DA * lapA - reaction + feed * (1 - av)));
        b2[i] = Math.min(1, Math.max(0, bv + DB * lapB + reaction - (kill + feed) * bv));
      }
    }
    [a, a2] = [a2, a];
    [b, b2] = [b2, b];
  }

  function render(rt: Runtime) {
    if (!image || !buffer || !bufferCtx) return;
    const low = hexToRgb(rt.palette.bgRaised);
    const high = hexToRgb(rt.palette.accent);
    const mid = hexToRgb(rt.palette.ink);
    const data = image.data;
    for (let i = 0, p = 0; i < b.length; i++, p += 4) {
      const v = Math.min(1, Math.max(0, b[i] * 3.2));
      // Two-stop ramp: background to ink to accent, so both themes keep contrast.
      let r: number;
      let g: number;
      let bl: number;
      if (v < 0.5) {
        const t = v * 2;
        r = low[0] + (mid[0] - low[0]) * t;
        g = low[1] + (mid[1] - low[1]) * t;
        bl = low[2] + (mid[2] - low[2]) * t;
      } else {
        const t = (v - 0.5) * 2;
        r = mid[0] + (high[0] - mid[0]) * t;
        g = mid[1] + (high[1] - mid[1]) * t;
        bl = mid[2] + (high[2] - mid[2]) * t;
      }
      data[p] = r;
      data[p + 1] = g;
      data[p + 2] = bl;
      data[p + 3] = 255;
    }
    bufferCtx.putImageData(image, 0, 0);
    rt.ctx.imageSmoothingEnabled = true;
    rt.ctx.drawImage(buffer, 0, 0, rt.width, rt.height);
  }

  const rt = createRuntime(host, opts, {
    resize(rt) {
      allocate(rt);
      render(rt);
    },
    theme(rt) {
      render(rt);
    },
    frame(_dt, rt) {
      for (let i = 0; i < STEPS_PER_FRAME; i++) step();
      render(rt);
    },
  });

  const feedSlider = slider(
    'feed',
    { min: 0.01, max: 0.08, step: 0.0005, value: feed, format: (v) => v.toFixed(4) },
    (v) => {
      feed = v;
    }
  );
  const killSlider = slider(
    'kill',
    { min: 0.045, max: 0.07, step: 0.0005, value: kill, format: (v) => v.toFixed(4) },
    (v) => {
      kill = v;
    }
  );

  function setPreset(name: string) {
    const preset = PRESETS[name];
    if (!preset) return;
    feed = preset.f;
    kill = preset.k;
    const inputs = [feedSlider, killSlider].map((l) => l.querySelector('input'));
    const outs = [feedSlider, killSlider].map((l) => l.querySelector('.readout'));
    if (inputs[0] && outs[0]) {
      inputs[0].value = String(feed);
      outs[0].textContent = feed.toFixed(4);
    }
    if (inputs[1] && outs[1]) {
      inputs[1].value = String(kill);
      outs[1].textContent = kill.toFixed(4);
    }
    reset();
  }

  rt.controls.append(
    select('pattern', Object.keys(PRESETS), 'coral', setPreset),
    feedSlider,
    killSlider,
    button('reseed', () => {
      reset();
      render(rt);
    })
  );

  rt.canvas.addEventListener('pointerdown', (event) => {
    const { x, y } = pointerPos(rt.canvas, event);
    seed(
      Math.floor((x / rt.width) * cols),
      Math.floor((y / rt.height) * rows),
      Math.max(3, Math.round(Math.min(cols, rows) * 0.03))
    );
    if (!rt.running) render(rt);
  });
}
