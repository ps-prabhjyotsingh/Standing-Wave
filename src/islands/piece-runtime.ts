// Shared plumbing for the Cabinet: a canvas sized to its host, a frame loop that
// stops when nobody is looking, and the site's palette read out of CSS custom
// properties. Deliberately small. If this file starts to look like a framework,
// something has gone wrong.

export interface Palette {
  bg: string;
  bgRaised: string;
  ink: string;
  inkSoft: string;
  accent: string;
  rule: string;
  dark: boolean;
}

export interface Runtime {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** CSS pixels, not device pixels; the context is pre-scaled. */
  width: number;
  height: number;
  palette: Palette;
  controls: HTMLElement;
  running: boolean;
  play(): void;
  pause(): void;
}

export interface PieceHooks {
  /** dt is in seconds, clamped, so a backgrounded tab cannot jump the simulation. */
  frame?(dt: number, rt: Runtime): void;
  resize?(rt: Runtime): void;
  theme?(rt: Runtime): void;
}

export function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const get = (name: string) => style.getPropertyValue(name).trim();
  return {
    bg: get('--bg'),
    bgRaised: get('--bg-raised'),
    ink: get('--ink'),
    inkSoft: get('--ink-soft'),
    accent: get('--accent'),
    rule: get('--rule'),
    dark: document.documentElement.dataset.theme !== 'light',
  };
}

export function createRuntime(
  host: HTMLElement,
  opts: { reducedMotion: boolean },
  hooks: PieceHooks
): Runtime {
  const canvas = document.createElement('canvas');
  const maybeCtx = canvas.getContext('2d', { alpha: false });
  if (!maybeCtx) throw new Error('no 2d context');
  const ctx: CanvasRenderingContext2D = maybeCtx;
  host.appendChild(canvas);

  const stage = host.parentElement ?? host;
  const controls = document.createElement('div');
  controls.className = 'controls';
  stage.appendChild(controls);

  const rt: Runtime = {
    canvas,
    ctx,
    width: 0,
    height: 0,
    palette: readPalette(),
    controls,
    running: false,
    play() {
      if (rt.running) return;
      rt.running = true;
      last = performance.now();
      frameId = requestAnimationFrame(tick);
      playButton.textContent = 'pause';
      playButton.setAttribute('aria-label', 'Pause the piece');
    },
    pause() {
      rt.running = false;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      playButton.textContent = 'play';
      playButton.setAttribute('aria-label', 'Play the piece');
    },
  };

  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.textContent = 'play';
  playButton.addEventListener('click', () => (rt.running ? rt.pause() : rt.play()));
  controls.appendChild(playButton);

  let frameId = 0;
  let last = performance.now();

  function tick(now: number) {
    if (!rt.running) return;
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    hooks.frame?.(dt, rt);
    frameId = requestAnimationFrame(tick);
  }

  function resize() {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (w === rt.width && h === rt.height && canvas.width === Math.round(w * dpr)) return;
    rt.width = w;
    rt.height = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hooks.resize?.(rt);
  }

  resize();
  new ResizeObserver(resize).observe(host);

  window.addEventListener('themechange', () => {
    rt.palette = readPalette();
    hooks.theme?.(rt);
  });

  // Nobody is looking: stop burning a core.
  let visible = true;
  let wanted = !opts.reducedMotion;
  const sync = () => (visible && wanted ? rt.play() : rt.pause());

  new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      sync();
    },
    { threshold: 0.01 }
  ).observe(host);

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    sync();
  });

  playButton.addEventListener('click', () => {
    wanted = rt.running;
  });

  if (opts.reducedMotion) {
    // Draw one frame so the piece is never a blank rectangle, then hold still.
    hooks.frame?.(0, rt);
  } else {
    rt.play();
  }

  return rt;
}
