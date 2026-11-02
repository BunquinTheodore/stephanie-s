// Sideways photo marquees. Pure CSS transform animation; JS only toggles play state.
import { manifest } from './img.js';
import { renderMarquee } from './render-core.js';

const TOUCH_RESUME_MS = 2500;
const MAX_FILL_COPIES = 6;
const RESIZE_DEBOUNCE_MS = 250;

/**
 * HTML for one marquee row.
 * @param {Array<string|number>} ids
 * @param {{direction?:'left'|'right', speed?:number, height?:string, cls?:string, group?:string,
 *          caption?:(id:string, entry:object)=>string, sizes?:string, label?:string, lightbox?:boolean}} [opts]
 */
export function marquee(ids, opts = {}) {
  return renderMarquee(manifest, ids, opts);
}

let observer = null;

const canFill = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function getObserver() {
  if (observer || !('IntersectionObserver' in window)) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      // Rows are measured and filled the first time they come near the viewport, in one batch,
      // so boot never reads scrollWidth for offscreen rows.
      const fresh = [];
      for (const entry of entries) {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
        if (entry.isIntersecting && !entry.target.hasAttribute('data-marquee-filled')) {
          entry.target.setAttribute('data-marquee-filled', '');
          fresh.push(entry.target);
        }
      }
      if (fresh.length && canFill()) fillRows(fresh);
    },
    { rootMargin: '120px 0px' },
  );
  return observer;
}

function wireTouchPause(el) {
  let timer = 0;
  const pause = () => {
    clearTimeout(timer);
    el.classList.add('is-paused');
  };
  const resume = () => {
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('is-paused'), TOUCH_RESUME_MS);
  };
  el.addEventListener('pointerdown', pause, { passive: true });
  el.addEventListener('pointerup', resume, { passive: true });
  el.addEventListener('pointercancel', resume, { passive: true });
  el.addEventListener('focusin', pause);
  el.addEventListener('focusout', resume);
}

/** Width of one group and of the row, read together so layout is measured once per batch. */
function measure(el) {
  const set = el.querySelector('.marquee__set:not(.marquee__set--clone)');
  return { el, set, groupW: set ? set.scrollWidth : 0, rowW: el.clientWidth };
}

/**
 * A short row (one group narrower than the viewport) would show a blank gap in the -50% loop.
 * Repeat the group's items until it covers the row, rebuild the clone, and stretch the duration
 * so the speed in px/s is unchanged. Repeats are aria-hidden and unfocusable.
 */
function fill({ el, set, groupW, rowW }) {
  if (!set || !groupW || groupW >= rowW) return;
  const clone = el.querySelector('.marquee__set--clone');
  const originals = [...set.querySelectorAll(':scope > li:not([data-fill])')];
  const total = set.children.length;
  if (!originals.length || !total) return;
  const origW = (groupW * originals.length) / total;
  const copies = Math.min(MAX_FILL_COPIES, Math.ceil((rowW - groupW) / origW));
  const frag = document.createDocumentFragment();
  for (let c = 0; c < copies; c += 1) {
    originals.forEach((li) => {
      const dup = li.cloneNode(true);
      dup.setAttribute('data-fill', '');
      dup.setAttribute('aria-hidden', 'true');
      dup.querySelectorAll('button,a').forEach((b) => b.setAttribute('tabindex', '-1'));
      frag.append(dup);
    });
  }
  set.append(frag);
  if (clone) clone.innerHTML = set.innerHTML;
  const dur = parseFloat(getComputedStyle(el).getPropertyValue('--marquee-dur')) || 60;
  const grown = (groupW + copies * origW) / groupW;
  el.style.setProperty('--marquee-dur', `${(dur * grown).toFixed(1)}s`);
}

function fillRows(rows) {
  rows.map(measure).forEach(fill);
}

let resizeWired = false;
function wireResize() {
  if (resizeWired) return;
  resizeWired = true;
  let timer = 0;
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(timer);
      timer = setTimeout(() => fillRows([...document.querySelectorAll('[data-marquee-filled]')]), RESIZE_DEBOUNCE_MS);
    },
    { passive: true },
  );
}

/** Wire every [data-marquee] under root: play only while on screen, pause on touch/focus. */
export function initMarquees(root = document) {
  const io = getObserver();
  const rows = [...root.querySelectorAll('[data-marquee]:not([data-marquee-ready])')];
  if (canFill()) {
    wireResize();
    if (!io) fillRows(rows);
  }
  rows.forEach((el) => {
    el.setAttribute('data-marquee-ready', '');
    wireTouchPause(el);
    if (io) io.observe(el);
    else el.classList.add('is-visible');
  });
}
