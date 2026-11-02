import { boot } from '../lib/boot.js';
import '../styles/pages/food.css';

const MAX_TILT_DEG = 6;

/** Soft pointer tilt on the healthy poster frames. Desktop pointers only, off for reduced motion. */
function initFrameTilt(root = document) {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reduced) return;

  const host = root.querySelector('.food-healthy__frames');
  if (!host) return;

  let frame = 0;
  const apply = (x, y) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      host.style.setProperty('--tilt-x', `${(-y * MAX_TILT_DEG).toFixed(2)}deg`);
      host.style.setProperty('--tilt-y', `${(x * MAX_TILT_DEG).toFixed(2)}deg`);
    });
  };

  host.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    apply((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
  });
  host.addEventListener('pointerleave', () => apply(0, 0));
}

boot({ page: 'food' });
initFrameTilt();
