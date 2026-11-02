import { boot, openLightbox } from '../lib/boot.js';
import '../styles/pages/offers.css';

const TILT_MAX_DEG = 8;
const reduceMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  document.documentElement.classList.contains('motion-paused');

/** "View all posters" buttons open their own lightbox set. */
function initPosterSets(root) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-posters]');
    if (!btn) return;
    const ids = btn.dataset.posters.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length) openLightbox(ids, 0);
  });
}

/** Horizontal snap carousel: prev/next buttons and a progress bar. */
function initCarousel(root) {
  const track = root.querySelector('[data-carousel]');
  if (!track) return;
  const nav = root.querySelector('[data-carousel-nav]');
  const prev = root.querySelector('[data-carousel-prev]');
  const next = root.querySelector('[data-carousel-next]');
  const bar = root.querySelector('[data-carousel-bar]');

  const step = () => {
    const card = track.querySelector('.offer');
    const gap = parseFloat(getComputedStyle(track).columnGap) || 16;
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
  };
  const behavior = () => (reduceMotion() ? 'auto' : 'smooth');

  let frame = 0;
  const update = () => {
    frame = 0;
    const max = track.scrollWidth - track.clientWidth;
    const scrollable = max > 4;
    if (nav) nav.hidden = !scrollable;
    const ratio = scrollable ? track.scrollLeft / max : 1;
    const visible = scrollable ? track.clientWidth / track.scrollWidth : 1;
    if (bar) {
      bar.style.setProperty('--w', visible.toFixed(3));
      bar.style.setProperty('--x', ratio.toFixed(3));
    }
    if (prev) prev.disabled = track.scrollLeft <= 4;
    if (next) next.disabled = track.scrollLeft >= max - 4;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: behavior() }));
  next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: behavior() }));
  track.addEventListener('scroll', schedule, { passive: true });
  track.addEventListener('keydown', (e) => {
    if (e.target !== track) return;
    if (e.key === 'ArrowRight') track.scrollBy({ left: step(), behavior: behavior() });
    else if (e.key === 'ArrowLeft') track.scrollBy({ left: -step(), behavior: behavior() });
    else return;
    e.preventDefault();
  });
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(track);
  else window.addEventListener('resize', schedule, { passive: true });
  update();
}

/** Gentle pointer tilt on the featured poster (fine pointers only, motion allowed). */
function initTilt(root) {
  const el = root.querySelector('[data-tilt]');
  if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let frame = 0;
  let px = 0;
  let py = 0;
  const apply = () => {
    frame = 0;
    el.style.setProperty('--rx', `${(-py * TILT_MAX_DEG).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(px * TILT_MAX_DEG).toFixed(2)}deg`);
  };
  el.addEventListener('pointermove', (e) => {
    if (reduceMotion()) return;
    const r = el.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width - 0.5;
    py = (e.clientY - r.top) / r.height - 0.5;
    if (!frame) frame = requestAnimationFrame(apply);
  });
  el.addEventListener('pointerleave', () => {
    px = 0;
    py = 0;
    if (!frame) frame = requestAnimationFrame(apply);
  });
}

const main = document.getElementById('main');
if (main) {
  initPosterSets(main);
  initCarousel(main);
  initTilt(main);
}

boot({ page: 'offers' });
