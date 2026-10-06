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
