import HardBreak from '@tiptap/extension-hard-break';
import BridgeExtension from './base';

type HardBreakState = {};

type HardBreakEditorInstance = {
  setHardBreak: () => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends HardBreakState {}
  interface EditorBridge extends HardBreakEditorInstance {}
}

export enum HardBreakEditorActionType {
  setHardBreak = 'set-hard-break',
}

type HardBreakMessage = {
  type: HardBreakEditorActionType.setHardBreak;
  payload?: undefined;
};

export const HardBreakBridge = new BridgeExtension<
  HardBreakState,
  HardBreakEditorInstance,
  HardBreakMessage
>({
  tiptapExtension: HardBreak,
  onBridgeMessage: (editor, message) => {
    if (message.type === HardBreakEditorActionType.setHardBreak) {
      console.log('setting hard break');
      editor.chain().focus().setHardBreak().run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      setHardBreak: () =>
        sendBridgeMessage({ type: HardBreakEditorActionType.setHardBreak }),
    };
  },
  extendEditorState: () => {
    return {};
  },
});
