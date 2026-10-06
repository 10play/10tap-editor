/**
 * Upserts `<style data-tag="{tag}">` in the document head. Same element the
 * native `injectCSS(css, tag)` snippet targets, so either path can update a
 * stylesheet the other created.
 */
export function applyStyleSheet(
  tag: string,
  css: string,
  doc: Document = document
): HTMLStyleElement {
  const existing = Array.from(doc.querySelectorAll('style[data-tag]')).find(
    (element): element is HTMLStyleElement =>
      element.getAttribute('data-tag') === tag
  );
  const style = existing ?? doc.createElement('style');
  style.textContent = css;
  if (!existing) {
    style.setAttribute('data-tag', tag);
    (doc.head ?? doc.documentElement).appendChild(style);
  }
  return style;
}

export {
  DYNAMIC_HEIGHT_CSS,
  DYNAMIC_HEIGHT_STYLE_TAG,
} from '../shared/dynamicHeightStyle';
