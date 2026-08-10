// C02 · The Ship of Theseus.
// The site's wave mark, built out of about two thousand tiles, each of which is
// eventually replaced by a freshly generated one. The picture never changes.

import { createRuntime, type Runtime } from './piece-runtime';
import { button, readout } from './controls';

const TARGET_TILES = 2000;
const BASE_RATE = 9; // tiles replaced per second
const FAST_RATE = 900;

interface Tile {
  ink: boolean;
  grain: number;
  replaced: boolean;
}

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '').trim();
  const f = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}

function shade([r, g, b]: [number, number, number], amount: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${clamp(r + amount)},${clamp(g + amount)},${clamp(b + amount)})`;
}

export default function mount(host: HTMLElement, opts: { reducedMotion: boolean }) {
  let cols = 0;
  let rows = 0;
  let tileW = 0;
  let tileH = 0;
  let originX = 0;
  let originY = 0;
  let tiles: Tile[] = [];
  let order: number[] = [];
  let cursor = 0;
  let carry = 0;
  let fast = false;

  const counter = readout('');

  /** Mask the wave mark into the tile grid: which tiles are picture, which are ground. */
  function maskWaveMark(): boolean[] {
    const mask = document.createElement('canvas');
    mask.width = cols;
    mask.height = rows;
    const mctx = mask.getContext('2d');
    if (!mctx) return new Array(cols * rows).fill(false);
    mctx.clearRect(0, 0, cols, rows);
    // The mark's own viewBox is 64 x 28; fit it with a margin.
    const scale = Math.min((cols * 0.86) / 64, (rows * 0.86) / 28);
    const offX = (cols - 64 * scale) / 2;
    const offY = (rows - 28 * scale) / 2;
    mctx.save();
    mctx.translate(offX, offY);
    mctx.scale(scale, scale);
    mctx.strokeStyle = '#fff';
    mctx.lineWidth = 2.6;
    mctx.lineCap = 'round';
    const path = new Path2D(
      'M0 14 C4 2 12 2 16 14 C20 26 28 26 32 14 C36 2 44 2 48 14 C52 26 60 26 64 14'
    );
    mctx.stroke(path);
    mctx.fillStyle = '#fff';
    for (const x of [16, 32, 48]) {
      mctx.beginPath();
      mctx.arc(x, 14, 2.4, 0, Math.PI * 2);
      mctx.fill();
    }
    mctx.restore();
    const data = mctx.getImageData(0, 0, cols, rows).data;
    const mask2: boolean[] = new Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) mask2[i] = data[i * 4 + 3] > 90;
    return mask2;
  }

  function build(rt: Runtime) {
    const aspect = rt.width / Math.max(1, rt.height);
    rows = Math.max(18, Math.round(Math.sqrt(TARGET_TILES / aspect)));
    cols = Math.max(18, Math.round(TARGET_TILES / rows));
    tileW = rt.width / cols;
    tileH = rt.height / rows;
    originX = 0;
    originY = 0;

    const mask = maskWaveMark();
    tiles = new Array(cols * rows);
    for (let i = 0; i < tiles.length; i++) {
      tiles[i] = { ink: mask[i], grain: Math.random(), replaced: false };
    }
    order = tiles.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    cursor = 0;
    carry = 0;
  }

  function drawTile(rt: Runtime, index: number) {
    const tile = tiles[index];
    const x = index % cols;
    const y = Math.floor(index / cols);
    const ink = hexToRgb(rt.palette.accent);
    const ground = hexToRgb(rt.palette.bgRaised);
    const spread = tile.ink ? 34 : 12;
    const amount = (tile.grain - 0.5) * spread * 2;
    rt.ctx.fillStyle = shade(tile.ink ? ink : ground, amount);
    rt.ctx.fillRect(
      originX + x * tileW,
      originY + y * tileH,
      Math.ceil(tileW) + 0.5,
      Math.ceil(tileH) + 0.5
    );
  }

  function drawAll(rt: Runtime) {
    rt.ctx.fillStyle = rt.palette.bgRaised;
    rt.ctx.fillRect(0, 0, rt.width, rt.height);
    for (let i = 0; i < tiles.length; i++) drawTile(rt, i);
  }

  function updateCounter() {
    const total = tiles.length;
    const done = cursor;
    counter.textContent =
      done >= total
        ? `${total} replaced · nothing original remains · the picture is unchanged`
        : `replaced ${done} of ${total} · ${total - done} original`;
  }

  function replaceSome(rt: Runtime, count: number) {
    for (let n = 0; n < count && cursor < order.length; n++) {
      const index = order[cursor++];
      const tile = tiles[index];
      tile.grain = Math.random();
      tile.replaced = true;
      drawTile(rt, index);
    }
    updateCounter();
  }

  const rt = createRuntime(host, opts, {
    resize(rt) {
      build(rt);
      drawAll(rt);
      updateCounter();
    },
    theme(rt) {
      drawAll(rt);
    },
    frame(dt, rt) {
      carry += dt * (fast ? FAST_RATE : BASE_RATE);
      const count = Math.floor(carry);
      if (count > 0) {
        carry -= count;
        replaceSome(rt, count);
      }
    },
  });

  const holdButton = button('hold to hurry', () => {});
  const startFast = () => {
    fast = true;
    holdButton.setAttribute('aria-pressed', 'true');
  };
  const stopFast = () => {
    fast = false;
    holdButton.setAttribute('aria-pressed', 'false');
  };
  holdButton.addEventListener('pointerdown', startFast);
  holdButton.addEventListener('pointerup', stopFast);
  holdButton.addEventListener('pointerleave', stopFast);
  holdButton.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') startFast();
  });
  holdButton.addEventListener('keyup', stopFast);
  holdButton.addEventListener('blur', stopFast);

  rt.canvas.addEventListener('pointerdown', startFast);
  window.addEventListener('pointerup', stopFast);

  rt.controls.append(
    holdButton,
    button('start over', () => {
      build(rt);
      drawAll(rt);
      updateCounter();
    }),
    counter
  );

  updateCounter();
}
