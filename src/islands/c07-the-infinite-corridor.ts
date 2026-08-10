// C07 · The infinite corridor.
// Doors are numbered; every number already has its room. Nothing is stored, nothing
// is invented twice: the room is a pure function of the number on the door.

import { createRuntime, type Runtime } from './piece-runtime';
import { button, textField, readout } from './controls';

/** Small deterministic PRNG, seeded from the door number. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIZES = ['narrow', 'low', 'tall', 'square', 'long', 'small', 'wide', 'shallow'];
const LIGHTS = [
  'lit by one bulb',
  'lit from a window you cannot see',
  'lit the colour of a screen at night',
  'unlit, except for what comes under the door',
  'lit by something on the floor',
  'lit evenly and from nowhere',
];
const CONTENTS = [
  'a table with nothing on it',
  'a chair facing the wrong way',
  'shelves, all of them empty',
  'a bed made too neatly',
  'a lamp, still warm',
  'a rug rolled against one wall',
  'a desk with one drawer open',
  'a mirror, covered',
  'a stack of paper, face down',
  'a bench along one side',
];
const CODAS = [
  'The air is cooler than the corridor.',
  'Someone has swept it recently.',
  'The floor slopes very slightly north.',
  'There is dust on everything but one shelf.',
  'It smells faintly of paper.',
  'A clock somewhere is not running.',
  'The door closes behind you without help.',
  'It is quieter than the corridor by a lot.',
];

interface Furniture {
  kind: 'box' | 'round' | 'tall' | 'flat';
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export default function mount(host: HTMLElement, opts: { reducedMotion: boolean }) {
  let door = 1;
  let inside = false;
  let walk = 0; // animated corridor offset, 0..1
  let target = 0;
  const status = readout('');

  function describe(n: number) {
    const rand = mulberry32(n * 2654435761);
    const size = SIZES[Math.floor(rand() * SIZES.length)];
    const light = LIGHTS[Math.floor(rand() * LIGHTS.length)];
    const contents = CONTENTS[Math.floor(rand() * CONTENTS.length)];
    const coda = CODAS[Math.floor(rand() * CODAS.length)];
    return `A ${size} room, ${light}, with ${contents}. ${coda}`;
  }

  function furnish(n: number, width: number, height: number): Furniture[] {
    const rand = mulberry32(n * 40503 + 7);
    const count = 3 + Math.floor(rand() * 3);
    const kinds: Furniture['kind'][] = ['box', 'round', 'tall', 'flat'];
    const labels = ['table', 'chair', 'lamp', 'shelf', 'bed', 'desk', 'bench', 'case'];
    // Draw labels without replacement, so a room never holds two of the same thing.
    for (let i = labels.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [labels[i], labels[j]] = [labels[j], labels[i]];
    }
    const items: Furniture[] = [];
    const used: number[] = [];
    for (let i = 0; i < count; i++) {
      const kind = kinds[Math.floor(rand() * kinds.length)];
      const w = width * (0.07 + rand() * 0.12);
      const h = height * (0.06 + rand() * 0.13);
      // Spread items across the floor band rather than letting them pile up.
      let x = width * (0.14 + rand() * 0.7);
      for (let attempt = 0; attempt < 6; attempt++) {
        if (used.every((u) => Math.abs(u - x) > width * 0.13)) break;
        x = width * (0.14 + rand() * 0.7);
      }
      used.push(x);
      items.push({
        kind,
        x,
        y: height * (0.44 + rand() * 0.2),
        w,
        h,
        label: labels[i % labels.length],
      });
    }
    return items;
  }

  function drawCorridor(rt: Runtime) {
    const ctx = rt.ctx;
    const w = rt.width;
    const h = rt.height;
    const vx = w / 2;
    const vy = h * 0.5;

    ctx.fillStyle = rt.palette.bgRaised;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = rt.palette.rule;
    ctx.lineWidth = 1;

    // Floor and ceiling lines running to the vanishing point.
    for (const y of [h * 0.06, h * 0.94]) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(vx, vy);
      ctx.moveTo(w, y);
      ctx.lineTo(vx, vy);
      ctx.stroke();
    }

    const depths = 9;
    for (let i = 0; i < depths; i++) {
      // Perspective: each step back scales by a constant factor.
      const t = (i + walk) / depths;
      const scale = Math.pow(0.62, (i + walk) * 0.9);
      const halfW = (w / 2) * scale;
      const halfH = (h * 0.44) * scale;
      const alpha = Math.max(0, 1 - t * 0.9);
      ctx.globalAlpha = alpha;

      // Wall ribs.
      ctx.strokeStyle = rt.palette.rule;
      ctx.strokeRect(vx - halfW, vy - halfH, halfW * 2, halfH * 2);

      // Doors alternate sides, the way corridors number them: evens left, odds right.
      const doorH = halfH * 1.05;
      const doorW = halfW * 0.22;
      for (const side of [-1, 1]) {
        const number = door + i * 2 + (side === 1 ? 1 : 0);
        const dx = vx + side * halfW - (side * doorW) / 2 - side * halfW * 0.02;
        const isCurrent = i === 0 && side === -1;
        ctx.strokeStyle = isCurrent ? rt.palette.accent : rt.palette.rule;
        ctx.lineWidth = isCurrent ? 2 : 1;
        ctx.strokeRect(dx - doorW / 2, vy - doorH / 2, doorW, doorH);
        if (halfH > 40) {
          ctx.fillStyle = isCurrent ? rt.palette.accent : rt.palette.inkSoft;
          ctx.font = `${Math.max(9, Math.min(15, halfH * 0.09))}px "IBM Plex Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(String(number), dx, vy + doorH / 2 + 16);
          ctx.textAlign = 'left';
        }
      }
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = rt.palette.inkSoft;
    ctx.font = '400 13px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText(`door ${door}`, 24, 34);
  }

  function drawRoom(rt: Runtime) {
    const ctx = rt.ctx;
    const w = rt.width;
    const h = rt.height;

    ctx.fillStyle = rt.palette.bgRaised;
    ctx.fillRect(0, 0, w, h);

    const rand = mulberry32(door * 991 + 13);
    const inset = Math.min(w, h) * 0.07;
    const floorY = h * 0.74;
    const backW = w * (0.36 + rand() * 0.22);
    const backH = h * (0.24 + rand() * 0.14);
    const backX = (w - backW) / 2;
    const backY = h * 0.14;

    // Back wall and the floor running to it.
    ctx.strokeStyle = rt.palette.rule;
    ctx.lineWidth = 1;
    ctx.strokeRect(backX, backY, backW, backH);
    ctx.beginPath();
    ctx.moveTo(inset, floorY);
    ctx.lineTo(backX, backY + backH);
    ctx.moveTo(w - inset, floorY);
    ctx.lineTo(backX + backW, backY + backH);
    ctx.moveTo(inset, floorY);
    ctx.lineTo(w - inset, floorY);
    ctx.stroke();

    for (const item of furnish(door, w, h)) {
      ctx.strokeStyle = rt.palette.inkSoft;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      if (item.kind === 'round') {
        ctx.ellipse(item.x, item.y, item.w / 2, item.h / 3, 0, 0, Math.PI * 2);
      } else if (item.kind === 'tall') {
        ctx.rect(item.x - item.w / 4, item.y - item.h, item.w / 2, item.h);
      } else if (item.kind === 'flat') {
        ctx.rect(item.x - item.w / 2, item.y - item.h / 6, item.w, item.h / 3);
      } else {
        ctx.rect(item.x - item.w / 2, item.y - item.h / 2, item.w, item.h);
      }
      ctx.stroke();
      ctx.fillStyle = rt.palette.inkSoft;
      ctx.font = '400 10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, item.x, item.y + item.h / 2 + 16);
      ctx.textAlign = 'left';
    }

    ctx.fillStyle = rt.palette.accent;
    ctx.font = '500 13px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText(`room ${door}`, 24, 34);

    ctx.fillStyle = rt.palette.ink;
    ctx.font = '400 15px "IBM Plex Mono", ui-monospace, monospace';
    const text = describe(door);
    const maxWidth = Math.min(w - 48, 820);
    const words = text.split(' ');
    let line = '';
    let y = 0;
    const lines: string[] = [];
    for (const word of words) {
      const attempt = line ? line + ' ' + word : word;
      if (ctx.measureText(attempt).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = attempt;
      }
    }
    lines.push(line);
    // Clear of the control bar at the foot of the stage.
    y = h - 76 - (lines.length - 1) * 22;
    for (const l of lines) {
      ctx.fillText(l, 24, y);
      y += 22;
    }
  }

  function render(rt: Runtime) {
    if (inside) drawRoom(rt);
    else drawCorridor(rt);
    status.textContent = inside ? `inside room ${door}` : `outside door ${door}`;
  }

  const rt = createRuntime(host, opts, {
    resize: render,
    theme: render,
    frame(dt, rt) {
      if (!inside && walk !== target) {
        const delta = target - walk;
        const step = Math.sign(delta) * Math.min(Math.abs(delta), dt * 3.2);
        walk += step;
        if (Math.abs(target - walk) < 0.001) {
          walk = 0;
          target = 0;
        }
      }
      render(rt);
    },
  });

  function go(delta: number) {
    inside = false;
    door = Math.max(1, door + delta);
    walk = delta > 0 ? -0.9 : 0.9;
    target = 0;
    render(rt);
  }

  rt.controls.append(
    button('back', () => go(-2)),
    button('walk on', () => go(2)),
    button('open the door', () => {
      inside = !inside;
      render(rt);
    }),
    textField('go to door', '1', (value) => {
      const n = Math.max(1, Math.min(999999999, Math.floor(Number(value) || 1)));
      door = n;
      inside = true;
      render(rt);
    }),
    status
  );

  render(rt);
}
