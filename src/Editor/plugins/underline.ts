import Underline from '@tiptap/extension-underline';
import BaseTenTapPlugin from './base';

type UnderlineEditorState = {
  isUnderlineActive: boolean;
  canToggleUnderline: boolean;
};

type UnderlineEditorInstance = {
  toggleUnderline: () => void;
};

declare module '../../types/EditorState' {
  interface EditorState extends UnderlineEditorState {}
  interface EditorInstance extends UnderlineEditorInstance {}
}

export enum UnderlineEditorActionType {
  ToggleUnderline = 'toggle-underline',
}

type UnderlineMessage = {
  type: UnderlineEditorActionType.ToggleUnderline;
  payload?: undefined;
};

export const UnderlineBridge = new BaseTenTapPlugin<
  UnderlineEditorState,
  UnderlineEditorInstance,
  UnderlineMessage
>({
  tiptapPlugin: Underline,
  onTenTapMessage: (editor, message) => {
    if (message.type === UnderlineEditorActionType.ToggleUnderline) {
      editor.chain().focus().toggleUnderline().run();
    }

    return false;
  },
  extendEditor: (sendPluginMessage) => {
    return {
      toggleUnderline: () =>
        sendPluginMessage({ type: UnderlineEditorActionType.ToggleUnderline }),
    };
  },
  extendEditorState: (editor) => {
    return {
      canToggleUnderline: editor.can().toggleUnderline(),
      isUnderlineActive: editor.isActive('underline'),
    };
  },
});
