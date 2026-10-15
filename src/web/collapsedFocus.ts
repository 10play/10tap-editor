import type { EditorState } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

/** How long after such a blur the focus coming back restores the selection. */
export const COLLAPSED_FOCUS_RESTORE_MS = 1000;

const viewportHeight = (): number =>
  Math.min(window.innerHeight, window.visualViewport?.height ?? Infinity);

/**
 * Android takes the focus of a WebView that a layout leaves without height
 * for a frame (the window resizing for the IME before the app follows), and
 * gives it back once the WebView has a size again. Meanwhile Chromium moves
 * the collapsed page's selection to the start of the document, where the
 * editor would then type. When the editor blurs in a page with no height and
 * gets the focus back without the user touching it, its selection from
 * before the blur is restored, with the marks it was about to type with.
 */
export function keepSelectionThroughCollapse(
  view: EditorView,
  now: () => number = Date.now
): () => void {
  let saved: { state: EditorState; at: number } | null = null;

  const onBlur = () => {
    saved = viewportHeight() < 1 ? { state: view.state, at: now() } : null;
  };
  const onFocus = () => {
    const blur = saved;
    saved = null;
    const { state } = view;
    if (
      !blur ||
      view.isDestroyed ||
      now() - blur.at > COLLAPSED_FOCUS_RESTORE_MS ||
      // An edit since then makes the old selection stale.
      state.doc !== blur.state.doc ||
      (state.selection.eq(blur.state.selection) &&
        state.storedMarks === blur.state.storedMarks)
    ) {
      return;
    }
    // The marks to type with (a color just picked) go with the selection.
    const tr = state.tr
      .setSelection(blur.state.selection)
      .setStoredMarks(blur.state.storedMarks)
      .scrollIntoView();
    view.dispatch(tr);
  };
  // The user placing the caret anywhere wins over the old selection.
  const onPointerDown = () => {
    saved = null;
  };

  const { dom } = view;
  const doc = dom.ownerDocument;
  dom.addEventListener('blur', onBlur);
  dom.addEventListener('focus', onFocus);
  doc.addEventListener('pointerdown', onPointerDown, true);
  doc.addEventListener('touchstart', onPointerDown, true);
  return () => {
    dom.removeEventListener('blur', onBlur);
    dom.removeEventListener('focus', onFocus);
    doc.removeEventListener('pointerdown', onPointerDown, true);
    doc.removeEventListener('touchstart', onPointerDown, true);
  };
}
