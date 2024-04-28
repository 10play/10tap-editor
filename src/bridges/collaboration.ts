import * as Y from 'yjs';
import BridgeExtension from './base';
import Collaboration from '@tiptap/extension-collaboration';
import { TiptapCollabProvider } from '@hocuspocus/provider';

type CollaborationEditorState = {
  activeColor: string | undefined;
};

type CollaborationEditorInstance = {
  setColor: (color: string) => void;
  unsetColor: () => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends CollaborationEditorState {}
  interface EditorBridge extends CollaborationEditorInstance {}
}

export enum CollaborationEditorActionType {
  SetColor = 'set-color',
  UnsetColor = 'unset-color',
}
type SetColorMessage = {
  type: CollaborationEditorActionType.SetColor;
  payload: string;
};
type UnsetColorMessage = {
  type: CollaborationEditorActionType.UnsetColor;
  payload: undefined;
};

type ColorMessage = SetColorMessage | UnsetColorMessage;

interface Config {
  name: string;
  appId: string;
  token: string;
}

class CollaborationBase extends BridgeExtension<
  CollaborationEditorState,
  CollaborationEditorInstance,
  ColorMessage,
  Config
> {
  public document?: Y.Doc;

  configureTiptapExtensionsOnRunTime(config: Config, extendConfig: any) {
    this.document = new Y.Doc();
    // Configure extension
    if (this.tiptapExtension) {
      if (config) {
        this.tiptapExtension = this.tiptapExtension?.configure({
          document: this.document,
          ...config,
        });
      } else {
        this.tiptapExtension = this.tiptapExtension?.configure({
          document: this.document,
        });
      }
      if (extendConfig) {
        this.tiptapExtension = this.tiptapExtension?.extend(extendConfig);
      }
    }

    const { appId, name, token } = config;
    if (!appId || !name || !token) {
      throw new Error('CollaborationBridge: Missing required config');
    }
    // Initialize provider
    const doc = this.document;
    const provider = new TiptapCollabProvider({
      name,
      appId,
      token,
      document: doc,
      onSynced: () => {
        console.log('Document synced');
      },
      onConnect: () => {
        console.log('Connected');
      },
      onAuthenticationFailed: () => {
        console.log('Authentication failed');
      },
    });
    // Ignore this
    provider.isAuthenticated;

    return [this.tiptapExtension, ...(this.tiptapExtensionDeps || [])];
  }
}

export const CollaborationBridge = new CollaborationBase({
  tiptapExtension: Collaboration,
  onBridgeMessage: (editor, { type, payload }) => {
    switch (type) {
      case CollaborationEditorActionType.SetColor:
        editor.chain().focus().setColor(payload).run();
        break;
      case CollaborationEditorActionType.UnsetColor:
        editor.chain().focus().unsetColor().run();
        break;
    }
    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      setColor: (color) =>
        sendBridgeMessage({
          type: CollaborationEditorActionType.SetColor,
          payload: color,
        }),
      unsetColor: () =>
        sendBridgeMessage({
          type: CollaborationEditorActionType.UnsetColor,
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
