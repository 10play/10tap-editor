import Blockquote from '@tiptap/extension-blockquote';
import BridgeExtension from './base';

type BlockquoteEditorState = {
  isBlockquoteActive: boolean;
  canToggleBlockquote: boolean;
};

type BlockquoteEditorInstance = {
  toggleBlockquote: () => void;
};

declare module '../types/EditorNativeState' {
  interface EditorNativeState extends BlockquoteEditorState {}
  interface EditorBridge extends BlockquoteEditorInstance {}
}

export enum BlockquoteEditorActionType {
  ToggleBlockquote = 'toggle-blockquote',
}

type BlockquoteMessage = {
  type: BlockquoteEditorActionType.ToggleBlockquote;
  payload?: undefined;
};

export const BlockquoteBridge = new BridgeExtension<
  BlockquoteEditorState,
  BlockquoteEditorInstance,
  BlockquoteMessage
>({
  tiptapExtension: Blockquote,
  onBridgeMessage: (editor, message) => {
    if (message.type === BlockquoteEditorActionType.ToggleBlockquote) {
      editor.chain().focus().toggleBlockquote().run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      toggleBlockquote: () =>
        sendBridgeMessage({
          type: BlockquoteEditorActionType.ToggleBlockquote,
        }),
    };
  },
  extendEditorState: (editor) => {
    return {
      canToggleBlockquote: editor.can().toggleBlockquote(),
      isBlockquoteActive: editor.isActive('blockquote'),
    };
  },
  extendCSS: `
    blockquote {
        border-left: 3px solid #0d0d0d1a;
        padding-left: 1rem;
    }
  `,
});
