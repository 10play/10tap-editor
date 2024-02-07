import Italic from '@tiptap/extension-italic';
import BridgeExtension from './base';

type ItalicEditorState = {
  isItalicActive: boolean;
  canToggleItalic: boolean;
};

type ItalicEditorInstance = {
  toggleItalic: () => void;
};

declare module '../types/EditorNativeState' {
  interface EditorNativeState extends ItalicEditorState {}
  interface EditorBridge extends ItalicEditorInstance {}
}

export enum ItalicEditorActionType {
  ToggleItalic = 'toggle-italic',
}

type ItalicMessage = {
  type: ItalicEditorActionType.ToggleItalic;
  payload?: undefined;
};

export const ItalicBridge = new BridgeExtension<
  ItalicEditorState,
  ItalicEditorInstance,
  ItalicMessage
>({
  tiptapExtension: Italic,
  onBridgeMessage: (editor, message) => {
    if (message.type === ItalicEditorActionType.ToggleItalic) {
      editor.chain().focus().toggleItalic().run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      toggleItalic: () =>
        sendBridgeMessage({ type: ItalicEditorActionType.ToggleItalic }),
    };
  },
  extendEditorState: (editor) => {
    return {
      canToggleItalic: editor.can().toggleItalic(),
      isItalicActive: editor.isActive('italic'),
    };
  },
});
