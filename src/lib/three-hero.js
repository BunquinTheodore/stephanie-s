// Lazy hero 3D: decides whether to run before importing three, schedules the import
// off the critical path (first input, or a delay after load, then idle), and
// degrades to the static CSS poster on any problem.
//
//   const ctrl = await mountHero(canvas);           // null when disabled
//   mountHero(canvas, { delay: 4000, immediate: false })
//
// html[data-hero3d] = 'off' | 'waiting' | 'loading' | 'live' | 'static'

// Passive visitors still get the scene, but late enough to stay outside a typical lab trace;
// any real input (INPUT_EVENTS) mounts it right away.
const DEFAULT_DELAY_MS = 15000;
const MIN_3D_WIDTH = 768;
const IDLE_TIMEOUT_MS = 2000;
const INPUT_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'];

const setState = (state, reason = '') => {
  document.documentElement.dataset.hero3d = state;
  if (reason && new URLSearchParams(location.search).has('debug')) console.info(`[hero3d] ${state}: ${reason}`);
};

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** '' when 3D may run, otherwise the reason it is skipped. */
export function disableReason() {
  const params = new URLSearchParams(location.search);
  if (params.get('3d') === 'off') return 'query';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced-motion';
  if (navigator.connection?.saveData) return 'save-data';
  // Phones and tablets keep the static CSS cloche: saves ~135 KB of script and main-thread time,
  // and keeps the 3D dome from sitting behind the headline on narrow screens.
  if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < MIN_3D_WIDTH) return 'small-screen';
  if (navigator.deviceMemory && navigator.deviceMemory < 4) return 'low-memory';
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return 'low-cpu';
  if (!hasWebGL()) return 'no-webgl';
  return '';
}

function afterLoad() {
  return document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((r) => window.addEventListener('load', r, { once: true }));
}

function firstInputOrDelay(delay) {
  return new Promise((resolve) => {
    let timer = 0;
    const done = () => {
      clearTimeout(timer);
      INPUT_EVENTS.forEach((ev) => window.removeEventListener(ev, done));
      resolve();
    };
    INPUT_EVENTS.forEach((ev) => window.addEventListener(ev, done, { once: true, passive: true }));
    timer = setTimeout(done, delay);
  });
}

const idle = () =>
  new Promise((r) =>
    'requestIdleCallback' in window ? requestIdleCallback(() => r(), { timeout: IDLE_TIMEOUT_MS }) : setTimeout(r, 200),
  );

/**
 * Mount the glass cloche scene into a <canvas>. Never throws.
 * @param {HTMLCanvasElement} canvas
 * @param {{delay?:number, immediate?:boolean}} [opts]
 * @returns {Promise<{destroy:Function}|null>}
 */
export async function mountHero(canvas, { delay = DEFAULT_DELAY_MS, immediate = false } = {}) {
  if (!canvas) return null;
  const reason = disableReason();
  if (reason) {
    setState('off', reason);
    return null;
  }
  try {
    setState('waiting');
    if (!immediate) {
      await afterLoad();
      await firstInputOrDelay(delay);
      await idle();
    }
    setState('loading');
    const { createClocheScene } = await import('./three-scene.js');
    const ctrl = await createClocheScene(canvas, {
      onLive: () => {
        setState('live');
        canvas.closest('.hero3d')?.classList.add('is-live');
      },
      onFail: (why) => {
        setState('static', why);
        canvas.closest('.hero3d')?.classList.remove('is-live');
      },
    });
    return ctrl;
  } catch (error) {
    console.error('[hero3d] failed, using static poster', error);
    setState('static', 'error');
    return null;
  }
}
