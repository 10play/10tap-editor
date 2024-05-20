import BridgeExtension from './base';
import { asyncMessages } from '../RichText/AsyncMessages';
import type { BridgeState, EditorTheme } from '../types';
import { focusListener } from '../webEditorUtils/focusListener';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';

export type EditorContentType = 'html' | 'text' | 'json';

type CoreEditorState = {
  selection: { from: number; to: number };
  isFocused: boolean;
  isReady: boolean;
  editable: boolean;
};

type FocusArgs = 'start' | 'end' | 'all' | number | boolean | null;

type CoreEditorInstance = {
  getHTML: () => Promise<string>;
  getJSON: () => Promise<object>;
  getText: () => Promise<string>;
  setContent: (content: string) => void;
  setSelection: (from: number, to: number) => void;
  updateScrollThresholdAndMargin: (offset: number) => void;
  focus: (pos: FocusArgs) => void;
  blur: () => void;
  injectJS: (js: string) => void;
  injectCSS: (css: string, tag?: string) => void;
  setEditable: (editable: boolean) => void;
  theme: EditorTheme;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends CoreEditorState {}
  interface EditorBridge extends CoreEditorInstance {}
}

export enum CoreEditorActionType {
  SetSelection = 'set-selection',
  GetHTML = 'get-html',
  GetJSON = 'get-json',
  GetText = 'get-text',
  SendHTMLToNative = 'send-html-back',
  SendTextToNative = 'send-text-back',
  SendJSONToNative = 'send-json-back',
  SetContent = 'set-content',
  StateUpdate = 'stateUpdate',
  Focus = 'focus',
  Blur = 'blur',
  EditorReady = 'editor-ready',
  UpdateScrollThresholdAndMargin = 'update-scroll-threshold-and-margin',
  ContentUpdate = 'content-update',
  SetEditable = 'set-editable',
}

type MessageToNative =
  | {
      type: CoreEditorActionType.SendHTMLToNative;
      payload: {
        content: string;
        messageId: string;
      };
    }
  | {
      type: CoreEditorActionType.SendTextToNative;
      payload: {
        content: string;
        messageId: string;
      };
    }
  | {
      type: CoreEditorActionType.SendJSONToNative;
      payload: {
        content: object;
        messageId: string;
      };
    };

export type CoreMessages =
  | MessageToNative
  | {
      type: CoreEditorActionType.GetHTML;
      payload: {
        messageId: string;
      };
    }
  | {
      type: CoreEditorActionType.GetJSON;
      payload: {
        messageId: string;
      };
    }
  | {
      type: CoreEditorActionType.GetText;
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
      payload: BridgeState;
    }
  | {
      type: CoreEditorActionType.EditorReady;
      payload: undefined;
    }
  | {
      type: CoreEditorActionType.Focus;
      payload: FocusArgs;
    }
  | {
      type: CoreEditorActionType.Blur;
      payload: undefined;
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
    }
  | {
      type: CoreEditorActionType.ContentUpdate;
      payload: undefined;
    }
  | {
      type: CoreEditorActionType.SetEditable;
      payload: boolean;
    };

export const CoreBridge = new BridgeExtension<
  CoreEditorState,
  Omit<CoreEditorInstance, 'theme' | 'injectCSS'>,
  CoreMessages
>({
  forceName: 'coreBridge',
  tiptapExtension: Document,
  tiptapExtensionDeps: [Paragraph, Text],
  onBridgeMessage: (editor, message, sendMessageBack) => {
    if (message.type === CoreEditorActionType.SetContent) {
      editor.commands.setContent(message.payload.content);
      return true;
    }
    if (message.type === CoreEditorActionType.GetHTML) {
      sendMessageBack({
        type: CoreEditorActionType.SendHTMLToNative,
        payload: {
          content: editor.getHTML(),
          messageId: message.payload.messageId,
        },
      });
    }
    if (message.type === CoreEditorActionType.GetJSON) {
      sendMessageBack({
        type: CoreEditorActionType.SendJSONToNative,
        payload: {
          content: editor.getJSON(),
          messageId: message.payload.messageId,
        },
      });
    }
    if (message.type === CoreEditorActionType.GetText) {
      sendMessageBack({
        type: CoreEditorActionType.SendTextToNative,
        payload: {
          content: editor.getText(),
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
    if (message.type === CoreEditorActionType.Blur) {
      editor.commands.blur();
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
    if (message.type === CoreEditorActionType.SetEditable) {
      editor.setEditable(message.payload);
      return true;
    }

    return false;
  },
  onEditorMessage: ({ type, payload }, editorBridge) => {
    if (type === CoreEditorActionType.SendHTMLToNative) {
      asyncMessages.onMessage(payload.messageId, payload.content);
      return true;
    }
    if (type === CoreEditorActionType.SendTextToNative) {
      asyncMessages.onMessage(payload.messageId, payload.content);
      return true;
    }
    if (type === CoreEditorActionType.SendJSONToNative) {
      asyncMessages.onMessage(payload.messageId, payload.content);
      return true;
    }

    if (type === CoreEditorActionType.EditorReady) {
      if (editorBridge.autofocus) {
        editorBridge.focus('end');
      }
    }
    if (type === CoreEditorActionType.StateUpdate) {
      editorBridge._updateEditorState(payload);
    }
    if (type === CoreEditorActionType.ContentUpdate) {
      editorBridge._onContentUpdate();
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
      getHTML: async () => {
        const html = await asyncMessages.sendAsyncMessage<string>(
          {
            type: CoreEditorActionType.GetHTML,
          },
          sendBridgeMessage
        );
        return html;
      },
      getText: async () => {
        const text = await asyncMessages.sendAsyncMessage<string>(
          {
            type: CoreEditorActionType.GetText,
          },
          sendBridgeMessage
        );
        return text;
      },
      getJSON: async () => {
        const json = await asyncMessages.sendAsyncMessage<object>(
          {
            type: CoreEditorActionType.GetJSON,
          },
          sendBridgeMessage
        );
        return json;
      },
      focus: (pos: FocusArgs) => {
        webviewRef?.current?.requestFocus();
        if (editorStateRef && editorStateRef.current) {
          _updateEditorState &&
            _updateEditorState({
              ...(editorStateRef.current as BridgeState),
              isFocused: true,
            });
        }
        sendBridgeMessage({
          type: CoreEditorActionType.Focus,
          payload: pos,
        });
      },
      blur: () => {
        sendBridgeMessage({
          type: CoreEditorActionType.Blur,
          payload: undefined,
        });
      },
      injectJS: (js: string) => {
        webviewRef?.current?.injectJavaScript(js);
      },
      setEditable: (editable: boolean) => {
        sendBridgeMessage({
          type: CoreEditorActionType.SetEditable,
          payload: editable,
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
      editable: editor.isEditable,
    };
  },
});
