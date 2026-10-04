import { WEB_RUNTIME_GLOBAL } from '../shared/bootConfig';
import { jsStringLiteral } from '../shared/safeJson';

export const DEFAULT_CSS_TAG = 'custom-css';

/**
 * Script that upserts `<style data-tag={tag}>` with `css`. It runs in strict
 * mode without creating globals, survives any character in `css` or `tag`,
 * and uses the web runtime's `applyStyleSheet` when the bundle has one, so
 * legacy bundles and the new runtime get the same result. The leading `;`
 * keeps it valid when a host concatenates it after another script without a
 * separator, as react-native-web-webview does.
 */
export function buildStyleSheetScript(css: string, tag: string): string {
  return (
    `;(function(){var t=${jsStringLiteral(tag)},c=${jsStringLiteral(css)},` +
    `r=window.${WEB_RUNTIME_GLOBAL};` +
    'if(r&&typeof r.applyStyleSheet==="function"){r.applyStyleSheet(t,c);return}' +
    'var d=document,h=d.head||d.documentElement,l=h.getElementsByTagName("style"),s=null,i;' +
    'for(i=0;i<l.length;i++){if(l[i].getAttribute("data-tag")===t){s=l[i];break}}' +
    'if(!s){s=d.createElement("style");s.setAttribute("data-tag",t);h.appendChild(s)}' +
    's.textContent=c})();true;'
  );
}

/**
 * What must be re-applied every time a page becomes ready: stylesheets by
 * tag and persistent scripts by key, both in first-registration order.
 */
export class Injector {
  private readonly styleSheets = new Map<string, string>();
  private readonly scripts = new Map<string, string>();

  /** Records the stylesheet and returns the script that applies it. */
  setStyleSheet(tag: string, css: string): string {
    this.styleSheets.set(tag, css);
    return buildStyleSheetScript(css, tag);
  }

  /** `null` removes the script. A replaced script keeps its position. */
  setScript(key: string, js: string | null): void {
    if (js === null) this.scripts.delete(key);
    else this.scripts.set(key, js);
  }

  /** Stylesheets first, so persistent scripts can rely on them. */
  scriptsForReady(): string[] {
    const styles = Array.from(this.styleSheets, ([tag, css]) =>
      buildStyleSheetScript(css, tag)
    );
    return [...styles, ...this.scripts.values()];
  }
}
