import { Editor } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { TextSelection } from '@tiptap/pm/state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { keepStoredMarksOffRecomposition } from '../imeRecomposition';

describe('keepStoredMarksOffRecomposition', () => {
  let editor: Editor;
  let stop: () => void;

  const bold = () => editor.schema.marks.bold!.create();
  /** The placeholder ProseMirror wraps the caret in for marked new text. */
  const markPlaceholder = () =>
    editor.view.dom.querySelector('img[mark-placeholder]');
  const keyDown = () =>
    editor.view.dom.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, keyCode: 229 })
    );
  const compositionStart = () =>
    editor.view.dom.dispatchEvent(
      new CompositionEvent('compositionstart', { bubbles: true, data: '' })
    );

  beforeEach(() => {
    editor = new Editor({
      element: document.body.appendChild(document.createElement('div')),
      extensions: [Document, Paragraph, Text, Bold],
      content: '<p>Pick a color.</p>',
    });
    // "colo|r."
    editor.view.dispatch(
      editor.state.tr
        .setSelection(TextSelection.create(editor.state.doc, 12))
        .addStoredMark(bold())
    );
  });

  afterEach(() => {
    stop?.();
    editor.destroy();
    vi.useRealTimers();
  });

  it('keeps a composition the keyboard starts on its own off the stored marks', () => {
    stop = keepStoredMarksOffRecomposition(editor.view, true);
    compositionStart();
    expect(markPlaceholder()).toBeNull();
    expect(editor.view.composing).toBe(true);
    expect(editor.state.storedMarks).toEqual([bold()]);
    expect(editor.getHTML()).toBe('<p>Pick a color.</p>');
  });

  it('gives a composition started by a key the stored marks', () => {
    stop = keepStoredMarksOffRecomposition(editor.view, true);
    keyDown();
    compositionStart();
    expect(markPlaceholder()).not.toBeNull();
    expect(editor.state.storedMarks).toEqual([bold()]);
  });

  it('does not count a key whose input already arrived', () => {
    stop = keepStoredMarksOffRecomposition(editor.view, true);
    keyDown();
    editor.view.dom.dispatchEvent(
      new InputEvent('beforeinput', { bubbles: true, inputType: 'insertText' })
    );
    compositionStart();
    expect(markPlaceholder()).toBeNull();
  });

  it('puts the marks back when the event is stopped before it bubbles up', () => {
    vi.useFakeTimers();
    stop = keepStoredMarksOffRecomposition(editor.view, true);
    const stopEvent = (event: Event) => event.stopPropagation();
    editor.view.dom.addEventListener('compositionstart', stopEvent);
    compositionStart();
    editor.view.dom.removeEventListener('compositionstart', stopEvent);
    expect(editor.state.storedMarks).toBeNull();
    vi.runAllTimers();
    expect(editor.state.storedMarks).toEqual([bold()]);
  });

  it('is off unless enabled (Android)', () => {
    stop = keepStoredMarksOffRecomposition(editor.view, false);
    compositionStart();
    expect(markPlaceholder()).not.toBeNull();
  });

  it('stops listening when disposed', () => {
    keepStoredMarksOffRecomposition(editor.view, true)();
    compositionStart();
    expect(markPlaceholder()).not.toBeNull();
  });
});
