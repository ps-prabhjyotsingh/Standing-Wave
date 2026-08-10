// C06 · Constellations.
// Your pointer leaves stars. Stop, and the piece joins them up and names the result.
// The name is a function of the star positions, so a given sky always has one name.

import { createRuntime, type Runtime } from './piece-runtime';
import { button, readout, pointerPos } from './controls';

const SETTLE_MS = 700;
const MIN_GAP = 26;
const MAX_STARS = 140;

interface Star {
  x: number;
  y: number;
  born: number;
  size: number;
}

const ONSETS = [
  'al', 'ar', 'be', 'cas', 'cor', 'dra', 'el', 'fen', 'gar', 'hy', 'ker', 'lyr', 'mer',
  'nox', 'or', 'pyx', 'quel', 'ras', 'sar', 'tel', 'ur', 'vel', 'wyn', 'xan', 'zeph',
];
const MIDDLES = ['a', 'e', 'i', 'o', 'u', 'ae', 'ia', 'io', 'ou', 'y'];
const CODAS = [
  'ra', 'nis', 'mir', 'the', 'don', 'sar', 'lux', 'via', 'cor', 'ten', 'phos', 'mara',
  'nex', 'stra', 'vel',
];
const EPITHETS = [
  'Major', 'Minor', 'Australis', 'Borealis', 'Nova', 'Vetus', 'Secunda', 'Tertia',
  'Profunda', 'Serena', 'Obscura', 'Lenta',
];

function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export default function mount(host: HTMLElement, opts: { reducedMotion: boolean }) {
  let stars: Star[] = [];
  let edges: [number, number][] = [];
  let lastMove = 0;
  let settled = false;
  let name = '';
  const status = readout('drag across the sky to make stars');

  function starName(): string {
    const key = stars
      .map((s) => `${Math.round(s.x)},${Math.round(s.y)}`)
      .sort()
      .join(';');
    const h = hash(key);
    const word =
      ONSETS[h % ONSETS.length] +
      MIDDLES[(h >>> 5) % MIDDLES.length] +
      CODAS[(h >>> 11) % CODAS.length];
    const epithet = EPITHETS[(h >>> 19) % EPITHETS.length];
    return word.charAt(0).toUpperCase() + word.slice(1) + ' ' + epithet;
  }

  /** Prim's algorithm: the shortest set of lines that joins every star exactly once. */
  function link() {
    edges = [];
    if (stars.length < 2) return;
    const inTree = new Array(stars.length).fill(false);
    const best = new Array(stars.length).fill(Infinity);
    const from = new Array(stars.length).fill(-1);
    best[0] = 0;
    for (let n = 0; n < stars.length; n++) {
      let pick = -1;
      for (let i = 0; i < stars.length; i++) {
        if (!inTree[i] && (pick === -1 || best[i] < best[pick])) pick = i;
      }
      if (pick === -1) break;
      inTree[pick] = true;
      if (from[pick] >= 0) edges.push([from[pick], pick]);
      for (let i = 0; i < stars.length; i++) {
        if (inTree[i]) continue;
        const d = Math.hypot(stars[i].x - stars[pick].x, stars[i].y - stars[pick].y);
        if (d < best[i]) {
          best[i] = d;
          from[i] = pick;
        }
      }
    }
  }

  function settle() {
    if (stars.length < 3) return;
    link();
    name = starName();
    settled = true;
    status.textContent = `${name} · ${stars.length} stars`;
  }

  function addStar(x: number, y: number) {
    const last = stars[stars.length - 1];
    if (last && Math.hypot(x - last.x, y - last.y) < MIN_GAP) return;
    stars.push({ x, y, born: performance.now(), size: 1 + Math.random() * 1.8 });
    if (stars.length > MAX_STARS) stars.shift();
    settled = false;
    edges = [];
    name = '';
    lastMove = performance.now();
    status.textContent = `${stars.length} stars · stop moving to draw the lines`;
  }

  function render(rt: Runtime) {
    const ctx = rt.ctx;
    const now = performance.now();
    ctx.fillStyle = rt.palette.bgRaised;
    ctx.fillRect(0, 0, rt.width, rt.height);

    if (settled && edges.length > 0) {
      const age = Math.min(1, (now - lastMove - SETTLE_MS) / 600);
      ctx.strokeStyle = rt.palette.rule;
      ctx.lineWidth = 1;
      ctx.globalAlpha = age;
      ctx.beginPath();
      for (const [a, b] of edges) {
        ctx.moveTo(stars[a].x, stars[a].y);
        ctx.lineTo(stars[b].x, stars[b].y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = rt.palette.inkSoft;
      ctx.font = '500 13px "IBM Plex Mono", ui-monospace, monospace';
      ctx.globalAlpha = age;
      ctx.fillText(name.toUpperCase(), 24, rt.height - 68);
      ctx.globalAlpha = 1;
    }

    for (const star of stars) {
      const age = Math.min(1, (now - star.born) / 420);
      ctx.globalAlpha = age;
      ctx.fillStyle = rt.palette.ink;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = age * 0.22;
      ctx.fillStyle = rt.palette.accent;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (stars.length === 0) {
      ctx.fillStyle = rt.palette.inkSoft;
      ctx.font = '400 13px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText('drag across the sky', 24, rt.height - 68);
    }
  }

  const rt = createRuntime(host, opts, {
    resize(rt) {
      render(rt);
    },
    theme(rt) {
      render(rt);
    },
    frame(_dt, rt) {
      if (!settled && stars.length >= 3 && performance.now() - lastMove > SETTLE_MS) settle();
      render(rt);
    },
  });

  rt.controls.append(
    button('clear the sky', () => {
      stars = [];
      edges = [];
      settled = false;
      name = '';
      status.textContent = 'drag across the sky to make stars';
      render(rt);
    }),
    status
  );

  rt.canvas.style.cursor = 'crosshair';
  let drawing = false;
  rt.canvas.addEventListener('pointerdown', (event) => {
    drawing = true;
    rt.canvas.setPointerCapture(event.pointerId);
    const { x, y } = pointerPos(rt.canvas, event);
    addStar(x, y);
  });
  rt.canvas.addEventListener('pointermove', (event) => {
    const { x, y } = pointerPos(rt.canvas, event);
    if (drawing || event.pointerType === 'mouse') addStar(x, y);
  });
  const stop = () => {
    drawing = false;
  };
  rt.canvas.addEventListener('pointerup', stop);
  rt.canvas.addEventListener('pointercancel', stop);
  rt.canvas.addEventListener('pointerleave', stop);
}
