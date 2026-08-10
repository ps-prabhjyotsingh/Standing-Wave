// C05 · The weasel.
// The same random letters, with and without cumulative selection, side by side.
// The counters make the argument.

import { createRuntime, type Runtime } from './piece-runtime';
import { textField, button, readout } from './controls';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
const CHILDREN = 120;
const MUTATION = 0.05;
const BLIND_TRIES_PER_FRAME = 4000;

function randomChar() {
  return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
}

function randomString(length: number) {
  let out = '';
  for (let i = 0; i < length; i++) out += randomChar();
  return out;
}

function score(candidate: string, target: string) {
  let hits = 0;
  for (let i = 0; i < target.length; i++) if (candidate[i] === target[i]) hits++;
  return hits;
}

export default function mount(host: HTMLElement, opts: { reducedMotion: boolean }) {
  let target = 'METHINKS IT IS LIKE A WEASEL';
  let best = randomString(target.length);
  let generations = 0;
  let blindBest = randomString(target.length);
  let blindBestScore = score(blindBest, target);
  let blindCurrent = blindBest;
  let blindTries = 0;
  let solved = false;
  let sinceStep = 0;

  const status = readout('');

  function reset() {
    best = randomString(target.length);
    generations = 0;
    blindBest = randomString(target.length);
    blindBestScore = score(blindBest, target);
    blindCurrent = blindBest;
    blindTries = 0;
    solved = false;
    sinceStep = 0;
  }

  function breed() {
    if (solved) return;
    generations++;
    let winner = best;
    let winnerScore = score(best, target);
    for (let c = 0; c < CHILDREN; c++) {
      let child = '';
      for (let i = 0; i < target.length; i++) {
        child += Math.random() < MUTATION ? randomChar() : best[i];
      }
      const s = score(child, target);
      if (s > winnerScore) {
        winner = child;
        winnerScore = s;
      }
    }
    best = winner;
    if (winnerScore === target.length) solved = true;
  }

  function blindStep() {
    for (let i = 0; i < BLIND_TRIES_PER_FRAME; i++) {
      const candidate = randomString(target.length);
      blindTries++;
      const s = score(candidate, target);
      if (s > blindBestScore) {
        blindBestScore = s;
        blindBest = candidate;
      }
      if (i === BLIND_TRIES_PER_FRAME - 1) blindCurrent = candidate;
    }
  }

  function drawColumn(
    rt: Runtime,
    x: number,
    y0: number,
    width: number,
    gap: number,
    title: string,
    subtitle: string,
    lines: { label: string; text: string; compare: boolean }[]
  ) {
    const ctx = rt.ctx;
    const mono = (size: number, weight = 400) =>
      `${weight} ${size}px "IBM Plex Mono", ui-monospace, monospace`;

    ctx.textBaseline = 'top';
    ctx.fillStyle = rt.palette.inkSoft;
    ctx.font = mono(11);
    ctx.fillText(title.toUpperCase(), x, y0);
    ctx.fillStyle = rt.palette.ink;
    ctx.font = mono(13);
    ctx.fillText(subtitle, x, y0 + 20);

    const charWidth = Math.min(15, (width - 4) / (target.length || 1));
    const fontSize = Math.max(9, Math.min(20, Math.floor(charWidth * 1.35)));
    let y = y0 + 56;
    for (const line of lines) {
      ctx.fillStyle = rt.palette.inkSoft;
      ctx.font = mono(10);
      ctx.fillText(line.label.toUpperCase(), x, y);
      y += 16;
      ctx.font = mono(fontSize, 500);
      for (let i = 0; i < line.text.length; i++) {
        const hit = line.compare && line.text[i] === target[i];
        ctx.fillStyle = hit ? rt.palette.accent : rt.palette.ink;
        ctx.fillText(line.text[i], x + i * charWidth, y);
      }
      y += fontSize + gap;
    }
  }

  function render(rt: Runtime) {
    const ctx = rt.ctx;
    ctx.fillStyle = rt.palette.bgRaised;
    ctx.fillRect(0, 0, rt.width, rt.height);

    const stacked = rt.width < 760;
    const margin = stacked ? 20 : 48;
    const gutter = stacked ? 0 : 32;
    // The control bar sits at the foot of the stage and wraps on narrow screens.
    const reserved = stacked ? 104 : 56;
    const usable = rt.height - 24 - reserved;
    const columnWidth = stacked ? rt.width - margin * 2 : (rt.width - margin * 2 - gutter) / 2;
    const left = margin;
    const right = stacked ? margin : left + columnWidth + gutter;
    const gap = stacked ? Math.max(8, Math.min(26, usable / 2 - 108)) : 26;

    drawColumn(rt, left, 24, columnWidth, gap, 'cumulative selection', `${generations} generations`, [
      { label: 'target', text: target, compare: false },
      { label: solved ? 'arrived' : 'best so far', text: best, compare: true },
    ]);

    drawColumn(
      rt,
      right,
      stacked ? 24 + usable / 2 : 24,
      columnWidth,
      gap,
      'pure chance',
      `${blindTries.toLocaleString('en-GB')} attempts`,
      [
        { label: 'latest attempt', text: blindCurrent, compare: true },
        { label: `best ever (${blindBestScore}/${target.length})`, text: blindBest, compare: true },
      ]
    );

    ctx.strokeStyle = rt.palette.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (stacked) {
      ctx.moveTo(margin, 12 + usable / 2);
      ctx.lineTo(rt.width - margin, 12 + usable / 2);
    } else {
      ctx.moveTo(left + columnWidth + gutter / 2, 24);
      ctx.lineTo(left + columnWidth + gutter / 2, rt.height - reserved);
    }
    ctx.stroke();
  }

  function updateStatus() {
    const odds = Math.pow(ALPHABET.length, target.length);
    status.textContent = solved
      ? `arrived in ${generations} generations · blind search would need about ${odds.toExponential(1)} tries`
      : `${target.length} characters · ${ALPHABET.length}^${target.length} ≈ ${odds.toExponential(1)} possible strings`;
  }

  const rt = createRuntime(host, opts, {
    resize(rt) {
      render(rt);
    },
    theme(rt) {
      render(rt);
    },
    frame(dt, rt) {
      sinceStep += dt;
      if (sinceStep > 0.08) {
        sinceStep = 0;
        breed();
      }
      blindStep();
      render(rt);
      updateStatus();
    },
  });

  rt.controls.append(
    textField('target', target, (value) => {
      const cleaned = value
        .toUpperCase()
        .replace(/[^A-Z ]/g, '')
        .slice(0, 40)
        .trim();
      if (cleaned.length > 0) {
        target = cleaned;
        reset();
        updateStatus();
        render(rt);
      }
    }),
    button('start over', () => {
      reset();
      updateStatus();
      render(rt);
    }),
    status
  );

  updateStatus();
}
