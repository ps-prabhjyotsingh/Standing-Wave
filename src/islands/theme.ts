// The site's only stateful client behaviour, and its only localStorage key.
// The pre-paint script in Base.astro has already set data-theme; this module
// only wires the toggle and tells the Cabinet when the palette changes.

export type Theme = 'light' | 'dark';

const KEY = 'theme';

function current(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function apply(theme: Theme, button: HTMLButtonElement) {
  document.documentElement.dataset.theme = theme;
  // ○ offers the light; ● offers the night.
  button.textContent = theme === 'dark' ? '○' : '●';
  button.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'
  );
  button.setAttribute('title', theme === 'dark' ? 'morning paper' : 'night water');
}

export function mountThemeToggle(button: HTMLButtonElement) {
  apply(current(), button);
  button.hidden = false;

  button.addEventListener('click', () => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark';
    apply(next, button);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Private browsing, storage disabled — the theme still flips for this page.
    }
    window.dispatchEvent(new CustomEvent<Theme>('themechange', { detail: next }));
  });
}
