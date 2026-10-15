import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import { TextSelection } from '@tiptap/pm/state';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  COLLAPSED_FOCUS_RESTORE_MS,
  keepSelectionThroughCollapse,
} from '../collapsedFocus';

const setInnerHeight = (height: number) => {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  });
};

describe('keepSelectionThroughCollapse', () => {
  let editor: Editor;
  let time: number;
  let stop: () => void;

  const select = (pos: number) =>
    editor.view.dispatch(
      editor.state.tr.setSelection(TextSelection.create(editor.state.doc, pos))
    );
  const blur = () => editor.view.dom.dispatchEvent(new FocusEvent('blur'));
  const focus = () => editor.view.dom.dispatchEvent(new FocusEvent('focus'));
  const head = () => editor.state.selection.head;

  /** Blurs in a page with no height, as Chromium does, and moves the selection to the start. */
  const collapse = () => {
    setInnerHeight(0);
    blur();
    select(1);
    setInnerHeight(600);
  };

  beforeEach(() => {
    time = 0;
    setInnerHeight(600);
    editor = new Editor({
      element: document.body.appendChild(document.createElement('div')),
      extensions: [Document, Paragraph, Text, Bold],
      content: '<p>One</p><p>Two</p><p>Three</p>',
    });
    stop = keepSelectionThroughCollapse(editor.view, () => time);
    select(12);
  });

  afterEach(() => {
    stop();
    editor.destroy();
  });

  it('restores the selection when the focus comes back after a collapsed layout', () => {
    collapse();
    time += 50;
    focus();
    expect(head()).toBe(12);
  });

  it('keeps the marks picked to type with', () => {
    const bold = editor.schema.marks.bold!.create();
    editor.view.dispatch(editor.state.tr.addStoredMark(bold));
    collapse();
    focus();
    expect(head()).toBe(12);
    expect(editor.state.storedMarks).toEqual([bold]);
  });

  it('leaves a blur in a page with a height alone', () => {
    blur();
    select(1);
    focus();
    expect(head()).toBe(1);
  });

  it('keeps a caret the user placed', () => {
    collapse();
    document.dispatchEvent(new Event('pointerdown'));
    select(6);
    focus();
    expect(head()).toBe(6);
  });

  it('keeps the selection of an edit made since', () => {
    collapse();
    editor.commands.insertContent('x');
    const after = head();
    focus();
    expect(head()).toBe(after);
  });

  it('gives up once the focus took too long to come back', () => {
    collapse();
    time += COLLAPSED_FOCUS_RESTORE_MS + 1;
    focus();
    expect(head()).toBe(1);
  });

  it('stops when cleaned up', () => {
    stop();
    collapse();
    focus();
    expect(head()).toBe(1);
  });
});
