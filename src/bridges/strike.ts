import Strike from '@tiptap/extension-strike';
import BridgeExtension from './base';

type StrikeEditorState = {
  isStrikeActive: boolean;
  canToggleStrike: boolean;
};

type StrikeEditorInstance = {
  toggleStrike: () => void;
};

declare module '../types/EditorNativeState' {
  interface EditorNativeState extends StrikeEditorState {}
  interface EditorBridge extends StrikeEditorInstance {}
}

export enum StrikeEditorActionType {
  ToggleStrike = 'toggle-strike',
}

type StrikeMessage = {
  type: StrikeEditorActionType.ToggleStrike;
  payload?: undefined;
};

export const StrikeBridge = new BridgeExtension<
  StrikeEditorState,
  StrikeEditorInstance,
  StrikeMessage
>({
  tiptapExtension: Strike,
  onBridgeMessage: (editor, message) => {
    if (message.type === StrikeEditorActionType.ToggleStrike) {
      editor.chain().focus().toggleStrike().run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      toggleStrike: () =>
        sendBridgeMessage({ type: StrikeEditorActionType.ToggleStrike }),
    };
  },
  extendEditorState: (editor) => {
    return {
      canToggleStrike: editor.can().toggleStrike(),
      isStrikeActive: editor.isActive('strike'),
    };
  },
});
