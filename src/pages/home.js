// Home: hero video + three.js cloche, cursor light on glass cards. The drinks motion card is a
// lazy loop video wired by boot (video.js), which also pauses it with the Pause motion toggle.
// Everything above the fold is static HTML (LCP image is rendered at build time with
// fetchpriority high); this script only layers progressive motion on top.
import { boot } from '../lib/boot.js';
import { mountHero } from '../lib/three-hero.js';
import { initVideos } from '../lib/video.js';
import '../styles/pages/home.css';

const HERO_VIDEO = { webm: '/media/hero-loop.webm', mp4: '/media/hero-loop.mp4', width: 1280, height: 720 };
const VIDEO_MIN_WIDTH = 900;
const VIDEO_DELAY_MS = 1800;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function afterLoad(fn, delay = 0) {
  const run = () => setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 3000 }) : fn()), delay);
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}

/** The 8 s food montage fades in over the LCP photo, on wide screens with a decent connection only. */
function shouldLoadVideo() {
  if (reducedMotion()) return false;
  if (window.innerWidth < VIDEO_MIN_WIDTH) return false;
  const conn = navigator.connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /2g|3g/.test(conn.effectiveType)) return false;
  return true;
}

function mountHeroVideo() {
  const host = document.querySelector('[data-hero-bg]');
  if (!host || !shouldLoadVideo()) return;
  const { webm, mp4, width, height } = HERO_VIDEO;
  host.insertAdjacentHTML(
    'beforeend',
    `<video class="hero__video" data-autoplay muted playsinline loop preload="none" width="${width}" height="${height}" aria-hidden="true">` +
      `<source src="${webm}" type="video/webm"><source src="${mp4}" type="video/mp4"></video>`,
  );
  // video.js sets data-playing once playback starts; CSS fades the video in only then.
  initVideos(host);
}

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

afterLoad(mountHeroVideo, VIDEO_DELAY_MS);
mountHero(document.querySelector('.hero3d__canvas'));
