import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import BridgeExtension from './base';

type ColorEditorState = {
  activeColor: string | undefined;
};

type ColorEditorInstance = {
  setColor: (color: string) => void;
  unsetColor: () => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends ColorEditorState {}
  interface EditorBridge extends ColorEditorInstance {}
}

export enum ColorEditorActionType {
  SetColor = 'set-color',
  UnsetColor = 'unset-color',
}
type SetColorMessage = {
  type: ColorEditorActionType.SetColor;
  payload: string;
};
type UnsetColorMessage = {
  type: ColorEditorActionType.UnsetColor;
  payload: undefined;
};

type ColorMessage = SetColorMessage | UnsetColorMessage;

export const ColorBridge = new BridgeExtension<
  ColorEditorState,
  ColorEditorInstance,
  ColorMessage
>({
  tiptapExtension: Color,
  tiptapExtensionDeps: [TextStyle],
  onBridgeMessage: (editor, { type, payload }) => {
    switch (type) {
      case ColorEditorActionType.SetColor:
        editor.chain().focus().setColor(payload).run();
        break;
      case ColorEditorActionType.UnsetColor:
        editor.chain().focus().unsetColor().run();
        break;
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
      unsetColor: () =>
        sendBridgeMessage({
          type: ColorEditorActionType.UnsetColor,
          payload: undefined,
        }),
    };
  },
  extendEditorState: (editor) => {
    return {
      activeColor: editor.getAttributes('textStyle').color,
    };
  },
});
