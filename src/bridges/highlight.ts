import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import BridgeExtension from './base';

type HighlightEditorState = {
  activeHighlight: string | undefined;
};

type HighlightEditorInstance = {
  setHighlight: (color: string) => void;
  toggleHighlight: (color: string) => void;
  unsetHighlight: () => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends HighlightEditorState {}
  interface EditorBridge extends HighlightEditorInstance {}
}

export enum HighlightEditorActionType {
  SetHighlight = 'set-highlight',
  ToggleHighlight = 'toggle-highlight',
  UnsetHighlight = 'unset-highlight',
}

type SetHighlightMessage = {
  type: HighlightEditorActionType.SetHighlight;
  payload: string;
};
type ToggleHighlightMessage = {
  type: HighlightEditorActionType.ToggleHighlight;
  payload: string;
};
type UnsetHighlightMessage = {
  type: HighlightEditorActionType.UnsetHighlight;
  payload: undefined;
};

type HighlightMessage =
  | SetHighlightMessage
  | ToggleHighlightMessage
  | UnsetHighlightMessage;

export const HighlightBridge = new BridgeExtension<
  HighlightEditorState,
  HighlightEditorInstance,
  HighlightMessage
>({
  tiptapExtension: Highlight.configure({ multicolor: true }),
  tiptapExtensionDeps: [TextStyle],
  onBridgeMessage: (editor, { type, payload }) => {
    switch (type) {
      case HighlightEditorActionType.SetHighlight:
        editor.chain().focus().setHighlight({ color: payload }).run();
        break;
      case HighlightEditorActionType.ToggleHighlight:
        editor.chain().focus().toggleHighlight({ color: payload }).run();
        break;
      case HighlightEditorActionType.UnsetHighlight:
        editor.chain().focus().unsetHighlight().run();
        break;
    }
    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      setHighlight: (color) =>
        sendBridgeMessage({
          type: HighlightEditorActionType.SetHighlight,
          payload: color,
        }),
      toggleHighlight: (color) =>
        sendBridgeMessage({
          type: HighlightEditorActionType.ToggleHighlight,
          payload: color,
        }),
      unsetHighlight: () =>
        sendBridgeMessage({
          type: HighlightEditorActionType.UnsetHighlight,
          payload: undefined,
        }),
    };
  },
  extendEditorState: (editor) => {
    return {
      activeHighlight: editor.getAttributes('highlight').color,
    };
  },
});
