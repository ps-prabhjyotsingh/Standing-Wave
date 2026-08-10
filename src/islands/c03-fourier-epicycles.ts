// C03 · Fourier epicycles.
// Any closed path is a sum of rotations. Draw one and watch the circles find it.

import { createRuntime, type Runtime } from './piece-runtime';
import { slider, button, pointerPos } from './controls';

const SAMPLES = 256;

interface Term {
  re: number;
  im: number;
  freq: number;
  amp: number;
  phase: number;
}

export default function mount(host: HTMLElement, opts: { reducedMotion: boolean }) {
  let terms: Term[] = [];
  let trace: { x: number; y: number }[] = [];
  let drawing = false;
  let raw: { x: number; y: number }[] = [];
  let time = 0;
  let visibleTerms = 41;
  let source: { x: number; y: number }[] = [];

  /** A smooth closed curve with the site's wave in it, so the piece is never blank. */
  function defaultShape(rt: Runtime): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const radius = Math.min(rt.width * 0.3, rt.height * 0.36, 320);
    const cx = rt.width / 2;
    const cy = rt.height / 2;
    const steps = 240;
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      points.push({
        x: cx + radius * 1.5 * Math.cos(t),
        y: cy + radius * 0.5 * Math.sin(t) + radius * 0.28 * Math.sin(4 * t),
      });
    }
    return points;
  }

  function resample(points: { x: number; y: number }[], n: number) {
    if (points.length < 2) return [];
    const closed = points.concat([points[0]]);
    const lengths: number[] = [0];
    let total = 0;
    for (let i = 1; i < closed.length; i++) {
      total += Math.hypot(closed[i].x - closed[i - 1].x, closed[i].y - closed[i - 1].y);
      lengths.push(total);
    }
    if (total === 0) return [];
    const out: { x: number; y: number }[] = [];
    let j = 1;
    for (let i = 0; i < n; i++) {
      const target = (i / n) * total;
      while (j < lengths.length - 1 && lengths[j] < target) j++;
      const span = lengths[j] - lengths[j - 1] || 1;
      const t = (target - lengths[j - 1]) / span;
      out.push({
        x: closed[j - 1].x + (closed[j].x - closed[j - 1].x) * t,
        y: closed[j - 1].y + (closed[j].y - closed[j - 1].y) * t,
      });
    }
    return out;
  }

  function transform(points: { x: number; y: number }[]) {
    const n = points.length;
    const out: Term[] = [];
    for (let k = 0; k < n; k++) {
      let re = 0;
      let im = 0;
      for (let i = 0; i < n; i++) {
        const angle = (-2 * Math.PI * k * i) / n;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        re += points[i].x * cos - points[i].y * sin;
        im += points[i].x * sin + points[i].y * cos;
      }
      re /= n;
      im /= n;
      // Frequencies above n/2 are the negative ones.
      const freq = k <= n / 2 ? k : k - n;
      out.push({ re, im, freq, amp: Math.hypot(re, im), phase: Math.atan2(im, re) });
    }
    out.sort((a, b) => b.amp - a.amp);
    return out;
  }

  function setShape(points: { x: number; y: number }[]) {
    source = points;
    const resampled = resample(points, SAMPLES);
    if (resampled.length < 8) return;
    terms = transform(resampled);
    trace = [];
    time = 0;
  }

  function render(rt: Runtime) {
    const ctx = rt.ctx;
    ctx.fillStyle = rt.palette.bgRaised;
    ctx.fillRect(0, 0, rt.width, rt.height);

    if (drawing && raw.length > 1) {
      ctx.strokeStyle = rt.palette.inkSoft;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(raw[0].x, raw[0].y);
      for (const p of raw) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      return;
    }

    if (terms.length === 0) return;

    // The original path, faintly, so you can see the approximation close in on it.
    if (source.length > 1) {
      ctx.strokeStyle = rt.palette.rule;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(source[0].x, source[0].y);
      for (const p of source) ctx.lineTo(p.x, p.y);
      ctx.closePath();
      ctx.stroke();
    }

    let x = 0;
    let y = 0;
    const count = Math.min(visibleTerms, terms.length);
    ctx.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      const term = terms[i];
      const prevX = x;
      const prevY = y;
      const angle = term.freq * time + term.phase;
      x += term.amp * Math.cos(angle);
      y += term.amp * Math.sin(angle);
      // The zero-frequency term is just the centre of the drawing; drawing a circle
      // for it would mean a line from the canvas origin to nowhere meaningful.
      if (term.freq !== 0 && term.amp > 1.5) {
        ctx.strokeStyle = rt.palette.rule;
        ctx.beginPath();
        ctx.arc(prevX, prevY, term.amp, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = rt.palette.inkSoft;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    trace.unshift({ x, y });
    // Long enough to hold a full turn of the slowest circle at any frame rate.
    if (trace.length > 2400) trace.pop();

    ctx.strokeStyle = rt.palette.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < trace.length; i++) {
      const p = trace[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    ctx.fillStyle = rt.palette.accent;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const rt = createRuntime(host, opts, {
    resize(rt) {
      if (terms.length === 0) setShape(defaultShape(rt));
      render(rt);
    },
    theme(rt) {
      render(rt);
    },
    frame(dt, rt) {
      time += dt * 1.1;
      if (time > Math.PI * 2) time -= Math.PI * 2;
      render(rt);
    },
  });

  const circles = slider(
    'circles',
    { min: 1, max: 121, step: 2, value: visibleTerms, format: (v) => String(v) },
    (v) => {
      visibleTerms = v;
      trace = [];
    }
  );

  rt.controls.append(
    circles,
    button('clear and draw your own', () => {
      raw = [];
      terms = [];
      source = [];
      trace = [];
      render(rt);
    })
  );

  rt.canvas.style.cursor = 'crosshair';
  rt.canvas.addEventListener('pointerdown', (event) => {
    rt.canvas.setPointerCapture(event.pointerId);
    drawing = true;
    raw = [pointerPos(rt.canvas, event)];
  });
  rt.canvas.addEventListener('pointermove', (event) => {
    if (!drawing) return;
    const p = pointerPos(rt.canvas, event);
    const last = raw[raw.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 3) raw.push(p);
    if (!rt.running) render(rt);
  });
  const finish = () => {
    if (!drawing) return;
    drawing = false;
    if (raw.length > 8) setShape(raw);
    if (!rt.running) render(rt);
  };
  rt.canvas.addEventListener('pointerup', finish);
  rt.canvas.addEventListener('pointercancel', finish);
}
