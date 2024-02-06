import Image from '@tiptap/extension-image';
import BridgeExtension from './base';

type ImageEditorState = {};

type ImageEditorInstance = {
  setImage: (src: string) => void;
};

declare module '../types/EditorNativeState' {
  interface EditorNativeState extends ImageEditorState {}
  interface EditorBridge extends ImageEditorInstance {}
}

export enum ImageEditorActionType {
  SetImage = 'set-image',
}

type ImageMessage = {
  type: ImageEditorActionType.SetImage;
  payload: string;
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
      editor.chain().focus().setImage({ src: message.payload }).run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      setImage: (src: string) =>
        sendBridgeMessage({
          type: ImageEditorActionType.SetImage,
          payload: src,
        }),
    };
  },
  extendEditorState: () => {
    return {};
  },
  extendCSS: `
  img {
    height: auto;
    max-width: 100%;
  }

  img &.ProseMirror-selectednode {
    outline: 3px solid #68cef8;
  }
  `,
});
