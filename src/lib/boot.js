// Every page script calls boot({ page }). Global CSS is imported here so it loads first.
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';

import { initNav } from './nav.js';
import { initSplash } from './splash.js';
import { initReveal } from './reveal.js';
import { initMarquees } from './marquee.js';
import { initLightbox, openLightbox } from './lightbox.js';
import { initVideos } from './video.js';
import { initMapFacades } from './map.js';

export { openLightbox };

const MOTION_KEY = 'stf-motion';
const IDLE_TIMEOUT_MS = 1500;

/** Run work after first paint, off the critical path (requestIdleCallback with a timeout fallback). */
function whenIdle(fn) {
  if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: IDLE_TIMEOUT_MS });
  else setTimeout(fn, 1);
}

/** Run one enhancement; a failure is logged and never stops the rest of the page. */
export function safely(name, fn) {
  try {
    fn();
  } catch (error) {
    console.error(`[boot] ${name} failed`, error);
  }
}

function readMotionPref() {
  try {
    return localStorage.getItem(MOTION_KEY) === 'paused';
  } catch {
    return false;
  }
}

/** Buttons with [data-motion-toggle] pause every marquee, video and the 3D scene (WCAG 2.2.2). */
function initMotionToggle() {
  const root = document.documentElement;
  const apply = (paused) => {
    root.classList.toggle('motion-paused', paused);
    document.querySelectorAll('[data-motion-toggle]').forEach((b) => {
      // Fixed label "Pause motion" plus aria-pressed: changing both would read as a contradiction.
      b.setAttribute('aria-pressed', String(paused));
    });
    document.dispatchEvent(new CustomEvent('motionchange', { detail: { paused } }));
  };
  apply(readMotionPref());
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-motion-toggle]')) return;
    const paused = !root.classList.contains('motion-paused');
    try {
      localStorage.setItem(MOTION_KEY, paused ? 'paused' : 'play');
    } catch {
      /* preference just will not persist */
    }
    apply(paused);
  });
}

/** Tag panels that are off screen so their ken burns and orb loops pause (see components.css). */
function initPanelVisibility() {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-offscreen', !e.isIntersecting)),
    { rootMargin: '80px 0px' },
  );
  document.querySelectorAll('.panel').forEach((p) => io.observe(p));
}

/**
 * @param {{page:'home'|'menu'|'food'|'drinks'|'offers'|'events'|'gallery'|'visit'}} opts
 */
export function boot({ page } = {}) {
  document.documentElement.dataset.page = page || '';
  safely('nav', () => initNav(page));
  if (page === 'home') safely('splash', initSplash);
  else document.querySelector('[data-splash]')?.remove();
  safely('motion', initMotionToggle);
  safely('reveal', () => initReveal());
  // Lightbox is delegated and cheap: wire it now so an early tap still opens a photo.
  safely('lightbox', () => initLightbox());
  // Map facade is one delegated listener; wire it now so an early tap on "Load map" works.
  safely('map', () => initMapFacades());
  whenIdle(() => {
    safely('marquee', () => initMarquees());
    safely('video', () => initVideos());
    safely('panels', initPanelVisibility);
  });
}
