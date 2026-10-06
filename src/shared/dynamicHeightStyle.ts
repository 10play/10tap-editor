/**
 * Corrected dynamic-height layout, applied by the 1.1 runtime and injected by
 * native, so custom bundles whose `index.html` was copied from older docs,
 * or built against 1.0, get it too (#336, #342). The
 * `.ProseMirror` element must size to its content, never to the viewport,
 * otherwise the reported height feeds back into the WebView height. It is
 * also a block formatting context, so the margins of its first and last
 * blocks stay inside the measured box instead of collapsing through it.
 *
 * The `#root` selector outranks the 1.0 template's `#root div .ProseMirror
 * { min-height: 100% }` without `!important`, so app CSS can still set a
 * minimum or fixed height.
 */
export const DYNAMIC_HEIGHT_STYLE_TAG = 'tentap-dynamic-height';

export const DYNAMIC_HEIGHT_CSS =
  '#root .dynamic-height .ProseMirror,.dynamic-height .ProseMirror{height:auto;min-height:0;display:flow-root;}';
