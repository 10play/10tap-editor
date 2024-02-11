import Bold from '@tiptap/extension-bold';
import BridgeExtension from './base';

type BoldEditorState = {
  isBoldActive: boolean;
  canToggleBold: boolean;
};

type BoldEditorInstance = {
  toggleBold: () => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends BoldEditorState {}
  interface EditorBridge extends BoldEditorInstance {}
}

export enum BoldEditorActionType {
  ToggleBold = 'toggle-bold',
}

type BoldMessage = {
  type: BoldEditorActionType.ToggleBold;
  payload?: undefined;
};

export const BoldBridge = new BridgeExtension<
  BoldEditorState,
  BoldEditorInstance,
  BoldMessage
>({
  tiptapExtension: Bold,
  onBridgeMessage: (editor, message) => {
    if (message.type === BoldEditorActionType.ToggleBold) {
      editor.chain().focus().toggleBold().run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      toggleBold: () =>
        sendBridgeMessage({ type: BoldEditorActionType.ToggleBold }),
    };
  },
  extendEditorState: (editor) => {
    return {
      canToggleBold: editor.can().toggleBold(),
      isBoldActive: editor.isActive('bold'),
    };
  },
});
