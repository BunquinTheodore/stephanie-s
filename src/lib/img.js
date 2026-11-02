// Browser image helpers backed by the generated manifest.
import manifest from '../generated/images.json';
import { renderPicture, renderBg, imgUrl, pickWidth, srcsetFor } from './render-core.js';

export { manifest };

/** Manifest entry for an id, or undefined. */
export const meta = (id) => manifest[String(id)];
export const hasImage = (id) => Boolean(meta(id));

/**
 * HTML string for a responsive <picture>.
 * @param {string|number} id source number, e.g. "142"
 * @param {{sizes?:string, eager?:boolean, cls?:string, imgCls?:string, alt?:string, priority?:boolean}} [opts]
 */
export function picture(id, opts = {}) {
  return renderPicture(manifest, id, opts);
}

/** CSS declarations for a style attribute: background with image-set() (AVIF, WebP) and LQIP. */
export function bgImage(id, opts = {}) {
  return renderBg(manifest, id, opts);
}

/** Direct URL of one rendition, e.g. for posters or og images. */
export function src(id, target = 1200, fmt = 'webp') {
  const e = meta(id);
  return e ? imgUrl(String(id), pickWidth(e, target), fmt) : '';
}

export const srcset = (id, fmt = 'webp') => srcsetFor(String(id), meta(id), fmt);

/** Keep only ids that exist in the manifest (dedupes, preserves order). */
export function existing(ids = []) {
  return [...new Set(ids.map(String))].filter((id) => manifest[id]);
}
