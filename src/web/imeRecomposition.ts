import type { EditorState } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

type StoredMarks = EditorState['storedMarks'];

const isAndroid = (): boolean =>
  typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

/**
 * Android keyboards such as Gboard start a composition over the word at the
 * caret without a key being pressed: when their input restarts, as when the
 * system keyboard comes back after a custom one, or when the caret moves into
 * a word. ProseMirror takes any composition that starts while marks are
 * stored to type with (a color just picked) for new text at the caret, and
 * wraps the caret in a placeholder carrying those marks, which splits the
 * word the keyboard is composing. Older Android WebViews then lose track of
 * the composition, and what is typed next lands in the wrong place with the
 * wrong marks.
 *
 * ProseMirror reads the stored marks only while it handles the
 * `compositionstart`, so they are hidden from it for that one event when no
 * key started the composition. It then follows the composition as an edit of
 * the existing text, and the marks stay stored for what is typed next. A key
 * the keyboard types (`keydown` 229) comes before the composition it starts,
 * so new text still gets the marks.
 */
export function keepStoredMarksOffRecomposition(
  view: EditorView,
  enabled: boolean = isAndroid()
): () => void {
  const win = view.dom.ownerDocument.defaultView;
  if (!enabled || !win) return () => {};

  // A key went down and its input has not arrived yet.
  let keyPending = false;
  let hidden: { state: EditorState; marks: StoredMarks } | null = null;
  let fallback: ReturnType<typeof setTimeout> | undefined;

  const unhide = () => {
    clearTimeout(fallback);
    if (!hidden) return;
    const { state, marks } = hidden;
    hidden = null;
    (state as { storedMarks: StoredMarks }).storedMarks = marks;
  };

  const onKeyDown = () => {
    keyPending = true;
  };
  const onBeforeInput = () => {
    keyPending = false;
  };
  const onCompositionStart = (event: Event) => {
    const typed = keyPending;
    keyPending = false;
    unhide();
    const { state } = view;
    if (
      typed ||
      view.isDestroyed ||
      view.composing ||
      !state.storedMarks ||
      !(event.target instanceof win.Node) ||
      !view.dom.contains(event.target)
    ) {
      return;
    }
    hidden = { state, marks: state.storedMarks };
    (state as { storedMarks: StoredMarks }).storedMarks = null;
    // In case a handler stops the event before it bubbles back up.
    fallback = setTimeout(unhide, 0);
  };

  // Capture and bubble on the window wrap ProseMirror's own listener on the
  // editor element.
  win.addEventListener('keydown', onKeyDown, true);
  win.addEventListener('beforeinput', onBeforeInput, true);
  win.addEventListener('compositionstart', onCompositionStart, true);
  win.addEventListener('compositionstart', unhide);
  return () => {
    win.removeEventListener('keydown', onKeyDown, true);
    win.removeEventListener('beforeinput', onBeforeInput, true);
    win.removeEventListener('compositionstart', onCompositionStart, true);
    win.removeEventListener('compositionstart', unhide);
    unhide();
  };
}
