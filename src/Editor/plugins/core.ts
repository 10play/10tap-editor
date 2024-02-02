import TenTapBridge from './base';
import { asyncMessages } from '../../RichText/AsyncMessages';

type CoreEditorState = {};

type CoreEditorInstance = {
  getContent: () => Promise<string>;
};

declare module '../../types/EditorState' {
  interface EditorState extends CoreEditorState {}
  interface EditorInstance extends CoreEditorInstance {}
}

export enum CoreEditorActionType {
  GetContent = 'get-content',
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
    };

export const CoreBridge = new TenTapBridge<
  CoreEditorState,
  CoreEditorInstance,
  CoreMessages
>({
  forceName: 'coreBridge',
  onBridgeMessage: (editor, message, sendMessageBack) => {
    if (message.type === CoreEditorActionType.GetContent) {
      sendMessageBack({
        type: CoreEditorActionType.SendContentToNative,
        payload: {
          content: editor.getText(),
          messageId: message.payload.messageId,
        },
      });
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
  extendEditorState: () => {
    return {};
  },
});
