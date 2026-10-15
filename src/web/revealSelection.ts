import type { EditorView } from '@tiptap/pm/view';
import { findScroller } from './scrollHold';

/**
 * ProseMirror scrolls the selection into view with the transaction that
 * moved it, before an image inserted there has loaded. Once it loads and
 * pushes the caret down, the selection is scrolled into view again.
 */
export function revealSelectionOnImageLoad(view: EditorView): () => void {
  const onLoad = (event: Event) => {
    if (
      event.target instanceof HTMLImageElement &&
      !view.isDestroyed &&
      view.hasFocus()
    ) {
      view.dispatch(view.state.tr.scrollIntoView());
    }
  };
  view.dom.addEventListener('load', onLoad, true);
  return () => view.dom.removeEventListener('load', onLoad, true);
}

const viewportHeight = (): number =>
  window.visualViewport?.height ?? window.innerHeight;

/** The bottom side of ProseMirror's `scrollThreshold` prop, in px. */
const bottomThreshold = (view: EditorView): number => {
  const value: unknown = view.someProp?.('scrollThreshold');
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'bottom' in value) {
    const { bottom } = value as { bottom: unknown };
    if (typeof bottom === 'number') return bottom;
  }
  return 0;
};

/**
 * Whether the caret ends at least `inset` px above the bottom of the visible
 * part of the editor's scroll container. False when it cannot tell.
 */
const isCaretAbove = (view: EditorView, inset: number): boolean => {
  let caretBottom: number;
  try {
    caretBottom = view.coordsAtPos(view.state.selection.head).bottom;
  } catch {
    return false;
  }
  const scroller = findScroller(view.dom as HTMLElement);
  let bottom =
    scroller && scroller !== document.scrollingElement
      ? scroller.getBoundingClientRect().bottom
      : window.innerHeight;
  const visual = window.visualViewport;
  if (visual) bottom = Math.min(bottom, visual.offsetTop + visual.height);
  return Number.isFinite(caretBottom) && caretBottom <= bottom - inset + 0.5;
};

/**
 * A keyboard that grows while the editor is focused (the emoji keyboard, a
 * suggestion bar) shrinks the WebView without moving anything native
 * measures, so no new insets arrive to scroll the caret back. When the
 * viewport gets shorter, the selection of a focused editor is scrolled into
 * view again once the new size is laid out.
 *
 * The bottom scroll threshold native sets describes the WebView it measured,
 * so a shrink can make it stale: a system keyboard that takes the place of a
 * custom one shrinks the window by its height, while the threshold still
 * reaches over the custom keyboard until native measures the new layout.
 * Revealing with it scrolled a caret that never left the visible area, and
 * the scroll hold then kept the text there. So the shrink only reveals a
 * caret below the part of the threshold that is still over the WebView;
 * native sends the insets it measures for the new layout, and re-sends
 * unchanged ones for a keyboard that grew, which reveal the rest.
 */
export function revealSelectionOnViewportShrink(view: EditorView): () => void {
  let height = viewportHeight();
  // The threshold last seen, and the viewport height it was set for.
  let threshold = bottomThreshold(view);
  let thresholdHeight = height;
  const syncThreshold = () => {
    const next = bottomThreshold(view);
    if (next === threshold) return;
    // It changed since the last resize, so it was measured at this height.
    threshold = next;
    thresholdHeight = height;
  };
  let frame: number | undefined;
  const onResize = () => {
    syncThreshold();
    const next = viewportHeight();
    const shrank = next < height;
    height = next;
    if (!shrank || frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      if (view.isDestroyed || !view.hasFocus()) return;
      syncThreshold();
      const shrink = Math.max(0, thresholdHeight - height);
      if (isCaretAbove(view, Math.max(0, threshold - shrink))) return;
      view.dispatch(view.state.tr.scrollIntoView());
    });
  };
  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);
  return () => {
    window.removeEventListener('resize', onResize);
    window.visualViewport?.removeEventListener('resize', onResize);
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
}
