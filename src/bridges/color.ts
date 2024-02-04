import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TenTapBridge from './base';

type ColorEditorState = {
  activeColor: string | undefined;
};

type ColorEditorInstance = {
  setColor: (color: string) => void;
};

declare module '../types/EditorNativeState' {
  interface EditorNativeState extends ColorEditorState {}
  interface EditorInstance extends ColorEditorInstance {}
}

export enum ColorEditorActionType {
  SetColor = 'set-color',
}

type ColorMessage = {
  type: ColorEditorActionType.SetColor;
  payload: string | undefined;
};

export const ColorBridge = new TenTapBridge<
  ColorEditorState,
  ColorEditorInstance,
  ColorMessage
>({
  tiptapExtension: Color,
  tiptapExtensionDeps: [TextStyle],
  onBridgeMessage: (editor, { type, payload }) => {
    if (type === ColorEditorActionType.SetColor) {
      editor
        .chain()
        .focus()
        .setColor(payload || '')
        .run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      setColor: (color) =>
        sendBridgeMessage({
          type: ColorEditorActionType.SetColor,
          payload: color,
        }),
    };
  },
  extendEditorState: (editor) => {
    return {
      activeColor: editor.getAttributes('textStyle').color,
    };
  },
});
