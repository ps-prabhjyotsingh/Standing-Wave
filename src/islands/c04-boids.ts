// C04 · Boids.
// Three local rules, no leader, no plan. The flock is not in any bird.

import { createRuntime, type Runtime } from './piece-runtime';
import { slider, button, pointerPos } from './controls';

const COUNT = 170;
const VIEW = 64;
const SEPARATION_RANGE = 24;
const MAX_SPEED = 132;
const MIN_SPEED = 58;

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function mount(host: HTMLElement, opts: { reducedMotion: boolean }) {
  let boids: Boid[] = [];
  let separation = 1.0;
  let alignment = 1.0;
  let cohesion = 1.0;
  let predator: { x: number; y: number; life: number } | null = null;

  function populate(rt: Runtime) {
    boids = [];
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
      boids.push({
        x: Math.random() * rt.width,
        y: Math.random() * rt.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }
  }

  function stepFlock(dt: number, rt: Runtime) {
    const w = rt.width;
    const h = rt.height;
    for (const boid of boids) {
      let ax = 0;
      let ay = 0;
      let avgVX = 0;
      let avgVY = 0;
      let cx = 0;
      let cy = 0;
      let neighbours = 0;

      for (const other of boids) {
        if (other === boid) continue;
        const dx = other.x - boid.x;
        const dy = other.y - boid.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > VIEW * VIEW || distSq === 0) continue;
        const dist = Math.sqrt(distSq);
        neighbours++;
        avgVX += other.vx;
        avgVY += other.vy;
        cx += other.x;
        cy += other.y;
        if (dist < SEPARATION_RANGE) {
          ax -= (dx / dist) * (SEPARATION_RANGE - dist) * 9 * separation;
          ay -= (dy / dist) * (SEPARATION_RANGE - dist) * 9 * separation;
        }
      }

      if (neighbours > 0) {
        avgVX /= neighbours;
        avgVY /= neighbours;
        ax += (avgVX - boid.vx) * 1.4 * alignment;
        ay += (avgVY - boid.vy) * 1.4 * alignment;
        cx /= neighbours;
        cy /= neighbours;
        ax += (cx - boid.x) * 0.9 * cohesion;
        ay += (cy - boid.y) * 0.9 * cohesion;
      }

      if (predator) {
        const dx = boid.x - predator.x;
        const dy = boid.y - predator.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 190 && dist > 0.001) {
          const push = ((190 - dist) / 190) * 900 * predator.life;
          ax += (dx / dist) * push;
          ay += (dy / dist) * push;
        }
      }

      boid.vx += ax * dt;
      boid.vy += ay * dt;

      const speed = Math.hypot(boid.vx, boid.vy) || 1;
      const clamped = Math.min(MAX_SPEED, Math.max(MIN_SPEED, speed));
      boid.vx = (boid.vx / speed) * clamped;
      boid.vy = (boid.vy / speed) * clamped;

      boid.x += boid.vx * dt;
      boid.y += boid.vy * dt;

      if (boid.x < 0) boid.x += w;
      if (boid.x >= w) boid.x -= w;
      if (boid.y < 0) boid.y += h;
      if (boid.y >= h) boid.y -= h;
    }

    if (predator) {
      predator.life -= dt / 2.4;
      if (predator.life <= 0) predator = null;
    }
  }

  function render(rt: Runtime) {
    const ctx = rt.ctx;
    ctx.fillStyle = rt.palette.bgRaised;
    ctx.fillRect(0, 0, rt.width, rt.height);

    ctx.fillStyle = rt.palette.ink;
    for (const boid of boids) {
      const angle = Math.atan2(boid.vy, boid.vx);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(boid.x + cos * 6, boid.y + sin * 6);
      ctx.lineTo(boid.x - cos * 4 - sin * 3, boid.y - sin * 4 + cos * 3);
      ctx.lineTo(boid.x - cos * 4 + sin * 3, boid.y - sin * 4 - cos * 3);
      ctx.closePath();
      ctx.fill();
    }

    if (predator) {
      ctx.strokeStyle = rt.palette.accent;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = Math.max(0, predator.life);
      ctx.beginPath();
      ctx.arc(predator.x, predator.y, 10 + (1 - predator.life) * 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  const rt = createRuntime(host, opts, {
    resize(rt) {
      if (boids.length === 0) populate(rt);
      render(rt);
    },
    theme(rt) {
      render(rt);
    },
    frame(dt, rt) {
      stepFlock(dt, rt);
      render(rt);
    },
  });

  rt.controls.append(
    slider('separation', { min: 0, max: 2, step: 0.05, value: separation, format: (v) => v.toFixed(2) }, (v) => {
      separation = v;
    }),
    slider('alignment', { min: 0, max: 2, step: 0.05, value: alignment, format: (v) => v.toFixed(2) }, (v) => {
      alignment = v;
    }),
    slider('cohesion', { min: 0, max: 2, step: 0.05, value: cohesion, format: (v) => v.toFixed(2) }, (v) => {
      cohesion = v;
    }),
    button('scatter', () => {
      predator = { x: rt.width / 2, y: rt.height / 2, life: 1 };
    })
  );

  rt.canvas.addEventListener('pointerdown', (event) => {
    const { x, y } = pointerPos(rt.canvas, event);
    predator = { x, y, life: 1 };
    if (!rt.running) render(rt);
  });
}
