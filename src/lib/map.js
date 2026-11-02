// Click-to-load Google Maps facade. The iframe never loads with the page.
import { site } from '../data/site.js';
import { manifest } from './img.js';
import { renderMapFacade } from './render-core.js';

/**
 * HTML for the facade.
 * @param {{imageId?:string, cls?:string, title?:string}} [opts] imageId: manifest id used as the static poster
 */
export const mapFacade = (opts = {}) => renderMapFacade(manifest, site, opts);

export function initMapFacades(root = document) {
  root.addEventListener('click', (e) => {
    const host = e.target.closest('[data-map-load]')?.closest('[data-map-facade]');
    if (!host) return;
    const frame = document.createElement('iframe');
    frame.src = host.dataset.src;
    frame.title = host.dataset.title || 'Map';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.allowFullscreen = true;
    frame.className = 'map-facade__frame';
    host.classList.add('is-loaded');
    host.replaceChildren(frame);
    frame.focus();
  });
}
