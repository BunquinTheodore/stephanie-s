// Lazy looping videos: <video data-autoplay muted playsinline loop preload="none" data-poster="...">
// The poster is attached only when the video nears the viewport, so offscreen posters never
// compete with LCP resources. Playback is skipped (poster kept) on reduced motion, save-data,
// slow connections, and for videos with data-min-width on narrower viewports.
import { renderVideo } from './render-core.js';

const POSTER_MARGIN = '400px 0px';
const SLOW_NET = /(^|-)(2g|3g)$/;

/**
 * HTML for a muted loop video from /media/<name>.webm|.mp4 with /media/<name>.jpg poster.
 * @param {string} name e.g. 'hero-loop'
 * @param {{cls?:string, width?:number, height?:string, label?:string, poster?:string}} [opts]
 */
export const video = (name, opts) => renderVideo(name, opts);

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const paused = () => document.documentElement.classList.contains('motion-paused');

/** Shared data-saving guard (also used by the home hero video). */
export function canPlayVideo(v) {
  if (reduced()) return false;
  const conn = navigator.connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && SLOW_NET.test(conn.effectiveType)) return false;
  const minW = Number(v?.dataset?.minWidth || 0);
  return !(minW && window.innerWidth < minW);
}

function attachPoster(v) {
  if (v.dataset.poster && !v.getAttribute('poster')) v.poster = v.dataset.poster;
}

function initPosters(vids) {
  const pending = vids.filter((v) => v.dataset.poster);
  if (!pending.length) return;
  if (!('IntersectionObserver' in window)) {
    pending.forEach(attachPoster);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        attachPoster(target);
        io.unobserve(target);
      }
    },
    { rootMargin: POSTER_MARGIN },
  );
  pending.forEach((v) => io.observe(v));
}

export function initVideos(root = document) {
  const vids = [...root.querySelectorAll('video[data-autoplay]')];
  if (!vids.length) return;
  initPosters(vids);
  const playable = vids.filter(canPlayVideo);
  if (!playable.length || !('IntersectionObserver' in window)) return;
  const visible = new Set();
  const sync = (v) => {
    if (visible.has(v) && !paused() && !document.hidden) {
      attachPoster(v);
      v.play()
        .then(() => (v.dataset.playing = '1'))
        .catch(() => {});
    } else {
      v.pause();
      delete v.dataset.playing;
    }
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (isIntersecting) visible.add(target);
        else visible.delete(target);
        sync(target);
      }
    },
    { threshold: 0.25 },
  );
  playable.forEach((v) => io.observe(v));
  document.addEventListener('visibilitychange', () => playable.forEach(sync));
  document.addEventListener('motionchange', () => playable.forEach(sync));
}
