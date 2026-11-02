// Home splash: pure CSS timeline (see partials/splash.html). JS only records the
// session flag, allows skipping, and removes the node when the curtain is gone.
const KEY = 'stf-splash';
const FALLBACK_MS = 2600;

export function initSplash() {
  const el = document.querySelector('[data-splash]');
  if (!el) return;
  const root = document.documentElement;
  if (root.classList.contains('no-splash')) {
    el.remove();
    return;
  }
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* storage blocked: splash simply shows again next visit */
  }
  let gone = false;
  const remove = () => {
    if (gone) return;
    gone = true;
    el.remove();
    root.classList.add('splash-done');
  };
  const skip = () => el.classList.add('is-skip');
  el.addEventListener('animationend', (e) => {
    if (e.target === el && (e.animationName === 'splash-curtain' || e.animationName === 'splash-fade')) remove();
  });
  window.addEventListener('keydown', skip, { once: true });
  window.addEventListener('pointerdown', skip, { once: true, passive: true });
  window.addEventListener('wheel', skip, { once: true, passive: true });
  setTimeout(remove, FALLBACK_MS);
}
