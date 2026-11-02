import { boot, openLightbox } from '../lib/boot.js';
import { existing } from '../lib/img.js';
import '../styles/pages/gallery.css';

// Short captions shown on hover/focus over each marquee photo. The caption is also the start of
// the button's accessible name (WCAG 2.5.3 Label in Name).
const CAPTIONS = {
  116: 'The dining room by day',
  50: 'Tables facing the bar',
  39: 'The wooden slat bar',
  28: 'A full house',
  53: 'Round table by the bar',
  41: 'Back bar glow',
  117: 'The buffet line',
  48: 'Set for a long table',
  51: 'Gold rose placemats',
  55: 'Ready for an event',
  118: 'The whole hall',
  47: 'The brick mural',
  43: 'Leather sofa corner',
  54: 'The coffee station',
  46: 'Lounge cushions',
  42: 'Bar counter details',
  45: 'Window lounge',
  49: 'The raised lounge',
  52: 'Bar stools',
  56: 'Under the vine lights',
  70: 'Evening event setup',
  44: 'Our storefront',
  40: 'The terrace',
  61: 'Dinner with friends',
  119: 'A big table celebration',
  69: 'Beers and good company',
  115: 'Date night',
  37: 'Family gathering',
  120: 'In the function area',
  67: 'Silog breakfast selfie',
};

function addCaptions(root) {
  root.querySelectorAll('.place-rows .marquee__btn[data-id]').forEach((btn) => {
    const text = CAPTIONS[btn.dataset.id];
    if (!text || btn.querySelector('.marquee__cap')) return;
    const cap = document.createElement('span');
    cap.className = 'marquee__cap place-cap';
    cap.setAttribute('aria-hidden', 'true');
    cap.textContent = text;
    btn.appendChild(cap);
    btn.setAttribute('aria-label', `${text}. Open photo`);
  });
}

/** Every photo in the three rows, in row order, for the "View all photos" lightbox. */
function allRowIds(root) {
  const ids = [...root.querySelectorAll('.place-rows .marquee__set:not(.marquee__set--clone) [data-id]')].map(
    (el) => el.dataset.id,
  );
  return existing(ids);
}

function wireViewAll(root) {
  const btn = root.querySelector('[data-place-all]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const ids = allRowIds(root);
    if (ids.length) openLightbox(ids, 0);
  });
}

addCaptions(document);
wireViewAll(document);
boot({ page: 'gallery' });
