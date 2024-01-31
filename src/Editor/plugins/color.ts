import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TenTapBridge from './base';

type ColorEditorState = {
  activeColor: string | undefined;
};

type ColorEditorInstance = {
  setColor: (color: string) => void;
};

declare module '../../types/EditorState' {
  interface EditorState extends ColorEditorState {}
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
  tiptapExtension: [TextStyle, Color],
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
  extendEditorInstance: (sendPluginMessage) => {
    return {
      setColor: (color) =>
        sendPluginMessage({
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
