import { BulletList, ListItem } from '@tiptap/extension-list';
import BridgeExtension from './base';

type BulletListEditorState = {
  isBulletListActive: boolean;
  canToggleBulletList: boolean;
};

type BulletListEditorInstance = {
  toggleBulletList: () => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends BulletListEditorState {}
  interface EditorBridge extends BulletListEditorInstance {}
}

export enum BulletListEditorActionType {
  ToggleBulletList = 'toggle-bulletList',
}

type BulletListMessage = {
  type: BulletListEditorActionType.ToggleBulletList;
  payload?: undefined;
};

export const BulletListBridge = new BridgeExtension<
  BulletListEditorState,
  BulletListEditorInstance,
  BulletListMessage
>({
  tiptapExtension: BulletList,
  tiptapExtensionDeps: [ListItem],
  onBridgeMessage: (editor, message) => {
    if (message.type === BulletListEditorActionType.ToggleBulletList) {
      editor.chain().focus().toggleBulletList().run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      toggleBulletList: () =>
        sendBridgeMessage({
          type: BulletListEditorActionType.ToggleBulletList,
        }),
    };
  },
  extendEditorState: (editor) => {
    return {
      canToggleBulletList: editor.can().toggleBulletList(),
      isBulletListActive: editor.isActive('bulletList'),
    };
  },
});
