/**
 * Tracks whether anything in the WebView document has focus (backs
 * `BridgeState.isFocused`).
 *
 * The tracker is created on first use and never at import time: bridge files
 * are also bundled for React Native, where `window` exists but
 * `window.document` does not (#339). Without a DOM it reports `false`.
 */
export interface FocusTracker {
  readonly isFocused: boolean;
}

const NO_DOM_TRACKER: FocusTracker = Object.freeze({ isFocused: false });

let tracker: FocusTracker | undefined;

const hasDOM = (): boolean =>
  typeof document !== 'undefined' &&
  document !== null &&
  typeof document.addEventListener === 'function';

function createFocusTracker(doc: Document): FocusTracker {
  const active = doc.activeElement;
  let focused = active !== null && active !== doc.body;
  doc.addEventListener(
    'focus',
    () => {
      focused = true;
    },
    true
  );
  doc.addEventListener(
    'blur',
    () => {
      focused = false;
    },
    true
  );
  return {
    get isFocused() {
      return focused;
    },
  };
}

export function getFocusTracker(): FocusTracker {
  if (tracker) return tracker;
  if (!hasDOM()) return NO_DOM_TRACKER;
  tracker = createFocusTracker(document);
  return tracker;
}
