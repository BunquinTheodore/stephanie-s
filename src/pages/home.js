// Home: cursor light on glass cards. The hero is one static, preloaded cover photo. The drinks motion card is a
// lazy loop video wired by boot (video.js), which also pauses it with the Pause motion toggle.
// Everything above the fold is static HTML (LCP image is rendered at build time with
// fetchpriority high); this script only layers progressive motion on top.
import { boot } from '../lib/boot.js';
import '../styles/pages/home.css';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Soft white light that follows the pointer across glass cards (hover devices only). */
function initCardLight() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || reducedMotion()) return;
  let frame = 0;
  let pending = null;
  document.querySelector('main')?.addEventListener(
    'pointermove',
    (e) => {
      const card = e.target.closest?.('.card');
      if (!card) return;
      pending = { card, x: e.clientX, y: e.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const { card: c, x, y } = pending;
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', `${x - r.left}px`);
        c.style.setProperty('--my', `${y - r.top}px`);
      });
    },
    { passive: true },
  );
}

boot({ page: 'home' });

try {
  initCardLight();
} catch (error) {
  console.error('[home] enhancement failed', error);
}

