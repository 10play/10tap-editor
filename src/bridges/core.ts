import TenTapBridge from './base';
import { asyncMessages } from '../RichText/AsyncMessages';

type CoreEditorState = {
  selection: { from: number; to: number };
};

type CoreEditorInstance = {
  getContent: () => Promise<string>;
  setContent: (content: string) => void;
  setSelection: (from: number, to: number) => void;
};

declare module '../types/EditorNativeState' {
  interface EditorNativeState extends CoreEditorState {}
  interface EditorInstance extends CoreEditorInstance {}
}

export enum CoreEditorActionType {
  SetSelection = 'set-selection',
  GetContent = 'get-content',
  SetContent = 'set-content',
  SendContentToNative = 'send-content-back',
}

type MessageToNative = {
  type: CoreEditorActionType.SendContentToNative;
  payload: {
    content: string;
    messageId: string;
  };
};

type CoreMessages =
  | MessageToNative
  | {
      type: CoreEditorActionType.GetContent;
      payload: {
        messageId: string;
      };
    }
  | {
      type: CoreEditorActionType.SetContent;
      payload: {
        content: string;
      };
    }
  | {
      type: CoreEditorActionType.SetSelection;
      payload: {
        from: number;
        to: number;
      };
    };

export const CoreBridge = new TenTapBridge<
  CoreEditorState,
  CoreEditorInstance,
  CoreMessages
>({
  forceName: 'coreBridge',
  onBridgeMessage: (editor, message, sendMessageBack) => {
    if (message.type === CoreEditorActionType.SetContent) {
      editor.commands.setContent(message.payload.content);
      return true;
    }
    if (message.type === CoreEditorActionType.GetContent) {
      sendMessageBack({
        type: CoreEditorActionType.SendContentToNative,
        payload: {
          content: editor.getHTML(),
          messageId: message.payload.messageId,
        },
      });
    }
    if (message.type === CoreEditorActionType.SetSelection) {
      editor.commands.setTextSelection({
        from: message.payload.from,
        to: message.payload.to,
      });
      return true;
    }

    return false;
  },
  onEditorMessage: ({ type, payload }) => {
    if (type === CoreEditorActionType.SendContentToNative) {
      asyncMessages.onMessage(payload.messageId, payload.content);
      return true;
    }
    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      setSelection: (from, to) => {
        sendBridgeMessage({
          type: CoreEditorActionType.SetSelection,
          payload: {
            from,
            to,
          },
        });
      },
      setContent: (content: string) => {
        sendBridgeMessage({
          type: CoreEditorActionType.SetContent,
          payload: {
            content,
          },
        });
      },
      getContent: async () => {
        const html = (await asyncMessages.sendAsyncMessage(
          {
            type: CoreEditorActionType.GetContent,
          },
          sendBridgeMessage
        )) as string;
        return html;
      },
    };
  },
  extendEditorState: (editor) => {
    return {
      selection: {
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      },
    };
  },
});
