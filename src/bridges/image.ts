import type { CommandProps } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { TextSelection } from '@tiptap/pm/state';
import BridgeExtension from './base';

type ImageEditorState = {};

type ImageEditorInstance = {
  setImage: (src: string) => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends ImageEditorState {}
  interface EditorBridge extends ImageEditorInstance {}
}

export enum ImageEditorActionType {
  SetImage = 'set-image',
}

type ImageMessage = {
  type: ImageEditorActionType.SetImage;
  payload: string;
};

/**
 * Puts the caret right after the image the previous step inserted. A block
 * image that would end the document (or be followed by another non-text
 * block) gets an empty paragraph after it, in the same transaction, so the
 * next keystroke types below the image instead of replacing it (#273).
 */
const placeCaretAfterInsertedImage = ({ tr, dispatch }: CommandProps) => {
  const lastStep = tr.mapping.maps[tr.mapping.maps.length - 1];
  let end: number | undefined;
  lastStep?.forEach((_from, _to, _newFrom, newTo) => (end = newTo));
  if (end === undefined) return false;

  const $end = tr.doc.resolve(end);
  if ($end.nodeBefore?.type.name !== Image.name) return false;
  if (!dispatch) return true;

  if ($end.parent.inlineContent) {
    tr.setSelection(TextSelection.create(tr.doc, end));
    return true;
  }
  if (!$end.nodeAfter?.isTextblock) {
    const paragraph = tr.doc.type.schema.nodes.paragraph?.create();
    if (!paragraph) return false;
    tr.insert(end, paragraph);
  }
  tr.setSelection(TextSelection.create(tr.doc, end + 1));
  return true;
};

export const ImageBridge = new BridgeExtension<
  ImageEditorState,
  ImageEditorInstance,
  ImageMessage
>({
  tiptapExtension: Image.configure({
    allowBase64: true,
  }),
  onBridgeMessage: (editor, message) => {
    if (message.type === ImageEditorActionType.SetImage) {
      editor
        .chain()
        .focus()
        .setImage({ src: message.payload })
        .command(placeCaretAfterInsertedImage)
        .run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => ({
    setImage: (src: string) =>
      sendBridgeMessage({
        type: ImageEditorActionType.SetImage,
        payload: src,
      }),
  }),
  extendEditorState: () => ({}),
  // The separator rule keeps user `img` styles off ProseMirror's hidden
  // cursor helper after inline images (#291).
  extendCSS: `
  img {
    height: auto;
    max-width: 100%;
  }

  img.ProseMirror-selectednode {
    outline: 3px solid #68cef8;
  }

  img.ProseMirror-separator {
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    outline: none !important;
    box-shadow: none !important;
    background: none !important;
  }
  `,
});
