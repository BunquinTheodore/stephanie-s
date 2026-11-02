// Accessible photo lightbox built on <dialog>. openLightbox(ids, index).
import { picture, meta, existing } from './img.js';

const SWIPE_PX = 50;
let dialog = null;
let state = { ids: [], index: 0 };

const icon = (d) =>
  `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function build() {
  dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Photo viewer');
  dialog.innerHTML = `
    <div class="lightbox__stage" data-lb-stage></div>
    <p class="lightbox__meta"><span data-lb-cap></span><span class="lightbox__count" data-lb-count></span></p>
    <button type="button" class="lightbox__btn lightbox__btn--close" data-lb="close" aria-label="Close">${icon('M6 6l12 12M18 6L6 18')}</button>
    <button type="button" class="lightbox__btn lightbox__btn--prev" data-lb="prev" aria-label="Previous photo">${icon('M15 5l-7 7 7 7')}</button>
    <button type="button" class="lightbox__btn lightbox__btn--next" data-lb="next" aria-label="Next photo">${icon('M9 5l7 7-7 7')}</button>`;
  document.body.append(dialog);

  // A swipe ends with a click on the shared ancestor; it must never close the viewer.
  let swiped = false;
  let downOnBackdrop = false;
  const isBackdrop = (t) => t === dialog || t.matches?.('[data-lb-stage]');

  dialog.addEventListener('click', (e) => {
    if (swiped) {
      swiped = false;
      return;
    }
    const action = e.target.closest('[data-lb]')?.dataset.lb;
    if (action === 'close') dialog.close();
    else if (action === 'prev') step(-1);
    else if (action === 'next') step(1);
    else if (downOnBackdrop && isBackdrop(e.target)) dialog.close();
  });
  dialog.addEventListener('keydown', (e) => {
    swiped = false;
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  dialog.addEventListener('close', () => document.documentElement.classList.remove('has-lightbox'));

  let startX = null;
  dialog.addEventListener(
    'pointerdown',
    (e) => {
      startX = e.clientX;
      swiped = false;
      downOnBackdrop = isBackdrop(e.target);
    },
    { passive: true },
  );
  dialog.addEventListener(
    'pointerup',
    (e) => {
      if (startX == null) return;
      const dx = e.clientX - startX;
      startX = null;
      swiped = Math.abs(dx) > SWIPE_PX;
      if (swiped) step(dx < 0 ? 1 : -1);
    },
    { passive: true },
  );
}

function render() {
  const { ids, index } = state;
  const id = ids[index];
  const entry = meta(id) || {};
  dialog.querySelector('[data-lb-stage]').innerHTML = picture(id, {
    sizes: '100vw',
    eager: true,
    priority: false,
    cls: 'lightbox__pic',
  });
  dialog.querySelector('[data-lb-cap]').textContent = entry.alt || '';
  dialog.querySelector('[data-lb-count]').textContent = ids.length > 1 ? `${index + 1} / ${ids.length}` : '';
  const multi = ids.length > 1;
  dialog.querySelectorAll('[data-lb="prev"],[data-lb="next"]').forEach((b) => (b.hidden = !multi));
}

function step(delta) {
  const n = state.ids.length;
  if (n < 2) return;
  state = { ...state, index: (state.index + delta + n) % n };
  render();
}

/** Open the viewer on a list of image ids at a given index. */
export function openLightbox(ids, index = 0) {
  const list = existing(ids);
  if (!list.length) return;
  if (!dialog) build();
  state = { ids: list, index: Math.min(Math.max(0, index), list.length - 1) };
  render();
  document.documentElement.classList.add('has-lightbox');
  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal();
  } else dialog.setAttribute('open', '');
}

/** Delegated: any [data-lightbox="group"][data-id] opens its group (marquee clones excluded). */
export function initLightbox(root = document) {
  root.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-lightbox][data-id]');
    if (!trigger || trigger.closest('.lightbox')) return;
    e.preventDefault();
    const group = trigger.dataset.lightbox;
    const nodes = [...document.querySelectorAll(`[data-lightbox="${CSS.escape(group)}"][data-id]`)].filter(
      (n) => !n.closest('[inert],[aria-hidden="true"]'),
    );
    const ids = [...new Set(nodes.map((n) => n.dataset.id))];
    openLightbox(ids, Math.max(0, ids.indexOf(trigger.dataset.id)));
  });
}
