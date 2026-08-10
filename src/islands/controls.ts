// Tiny DOM helpers for the control bars. Eight pieces would otherwise repeat this
// twenty times. Nothing here knows anything about any particular piece.

export function button(label: string, onClick: () => void): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.textContent = label;
  el.addEventListener('click', onClick);
  return el;
}

export function slider(
  label: string,
  opts: { min: number; max: number; step: number; value: number; format?: (v: number) => string },
  onInput: (value: number) => void
): HTMLLabelElement {
  const wrap = document.createElement('label');
  const name = document.createElement('span');
  name.textContent = label;
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(opts.min);
  input.max = String(opts.max);
  input.step = String(opts.step);
  input.value = String(opts.value);
  input.setAttribute('aria-label', label);
  const out = document.createElement('span');
  out.className = 'readout';
  const format = opts.format ?? ((v: number) => String(v));
  out.textContent = format(opts.value);
  input.addEventListener('input', () => {
    const value = Number(input.value);
    out.textContent = format(value);
    onInput(value);
  });
  wrap.append(name, input, out);
  return wrap;
}

export function select(
  label: string,
  options: string[],
  value: string,
  onChange: (value: string) => void
): HTMLLabelElement {
  const wrap = document.createElement('label');
  const name = document.createElement('span');
  name.textContent = label;
  const el = document.createElement('select');
  el.setAttribute('aria-label', label);
  for (const option of options) {
    const opt = document.createElement('option');
    opt.value = option;
    opt.textContent = option;
    el.appendChild(opt);
  }
  el.value = value;
  el.addEventListener('change', () => onChange(el.value));
  wrap.append(name, el);
  return wrap;
}

export function textField(
  label: string,
  value: string,
  onCommit: (value: string) => void
): HTMLLabelElement {
  const wrap = document.createElement('label');
  const name = document.createElement('span');
  name.textContent = label;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.size = 24;
  input.setAttribute('aria-label', label);
  const commit = () => onCommit(input.value);
  input.addEventListener('change', commit);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') commit();
  });
  wrap.append(name, input);
  return wrap;
}

export function readout(text = ''): HTMLSpanElement {
  const el = document.createElement('span');
  el.className = 'readout';
  el.textContent = text;
  return el;
}

/** Pointer position in CSS pixels relative to the canvas. */
export function pointerPos(canvas: HTMLCanvasElement, event: PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}
