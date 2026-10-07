import type { EditorView } from '@tiptap/pm/view';

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

/**
 * A keyboard that grows while the editor is focused (the emoji keyboard, a
 * suggestion bar) shrinks the WebView without moving anything native
 * measures, so no new insets arrive to scroll the caret back. When the
 * viewport gets shorter, the selection of a focused editor is scrolled into
 * view again once the new size is laid out.
 */
export function revealSelectionOnViewportShrink(view: EditorView): () => void {
  let height = viewportHeight();
  let frame: number | undefined;
  const onResize = () => {
    const next = viewportHeight();
    const shrank = next < height;
    height = next;
    if (!shrank || frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      if (!view.isDestroyed && view.hasFocus()) {
        view.dispatch(view.state.tr.scrollIntoView());
      }
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
