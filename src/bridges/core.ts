import TenTapBridge from './base';
import { asyncMessages } from '../RichText/AsyncMessages';
import type { EditorNativeState } from '../types';
import { focusListener } from '../webEditorUtils/focusListener';

type CoreEditorState = {
  selection: { from: number; to: number };
  isFocused: boolean;
  isReady: boolean;
};

type focusArgs = 'start' | 'end' | 'all' | number | boolean | null;

type CoreEditorInstance = {
  getContent: () => Promise<string>;
  setContent: (content: string) => void;
  setSelection: (from: number, to: number) => void;
  updateScrollThresholdAndMargin: (offset: number) => void;
  focus: (pos: focusArgs) => void;
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
  StateUpdate = 'stateUpdate',
  Focus = 'Focus',
  EditorReady = 'editor-ready',
  UpdateScrollThresholdAndMargin = 'update-scroll-threshold-and-margin',
}

type MessageToNative = {
  type: CoreEditorActionType.SendContentToNative;
  payload: {
    content: string;
    messageId: string;
  };
};

export type CoreMessages =
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
      type: CoreEditorActionType.StateUpdate;
      payload: EditorNativeState;
    }
  | {
      type: CoreEditorActionType.EditorReady;
      payload: undefined;
    }
  | {
      type: CoreEditorActionType.Focus;
      payload: focusArgs;
    }
  | {
      type: CoreEditorActionType.UpdateScrollThresholdAndMargin;
      payload: number;
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
    if (message.type === CoreEditorActionType.Focus) {
      editor.commands.focus(message.payload);
      return true;
    }
    if (message.type === CoreEditorActionType.UpdateScrollThresholdAndMargin) {
      editor.setOptions({
        editorProps: {
          scrollThreshold: {
            top: 0,
            bottom: message.payload,
            right: 0,
            left: 0,
          },
          scrollMargin: { top: 0, bottom: message.payload, right: 0, left: 0 },
        },
      });
      return true;
    }

    return false;
  },
  onEditorMessage: ({ type, payload }, editorInstance) => {
    if (type === CoreEditorActionType.SendContentToNative) {
      asyncMessages.onMessage(payload.messageId, payload.content);
      return true;
    }

    if (type === CoreEditorActionType.EditorReady) {
      if (editorInstance.autofocus) {
        editorInstance.focus('end');
      }
    }
    if (type === CoreEditorActionType.StateUpdate) {
      editorInstance._updateEditorState(payload);
    }
    return false;
  },
  extendEditorInstance: (
    sendBridgeMessage,
    webviewRef,
    editorStateRef,
    _updateEditorState
  ) => {
    return {
      updateScrollThresholdAndMargin: (bottom: number) =>
        sendBridgeMessage({
          type: CoreEditorActionType.UpdateScrollThresholdAndMargin,
          payload: bottom,
        }),
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
      focus: (pos: 'start' | 'end' | 'all' | number | boolean | null) => {
        webviewRef?.current?.requestFocus();
        if (editorStateRef && editorStateRef.current) {
          _updateEditorState &&
            _updateEditorState({
              ...(editorStateRef.current as EditorNativeState),
              isFocused: true,
            });
        }
        sendBridgeMessage({
          type: CoreEditorActionType.Focus,
          payload: pos,
        });
      },
    };
  },
  extendEditorState: (editor) => {
    return {
      isFocused: focusListener.isFocused,
      isReady: true,
      selection: {
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      },
    };
  },
});
