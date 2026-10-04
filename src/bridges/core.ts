import {
  getTextBetween,
  getTextSerializersFromSchema,
  type Content,
  type Editor,
} from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import BridgeExtension from './base';
import { resolveBridgeContext, resolveFallbackReply } from './context';
import type { SerializableParseOptions } from '../shared/bootConfig';
import { CAPABILITIES } from '../shared/capabilities';
import { getEditorController } from '../shared/contracts';
import type { BridgeState as EditorState, EditorTheme } from '../types';
import { getFocusTracker } from '../web/focus';

export type EditorContentType = 'html' | 'text' | 'json';

type CoreEditorState = {
  selection: { from: number; to: number };
  isFocused: boolean;
  isReady: boolean;
  editable: boolean;
  empty: boolean;
};

type FocusArgs = 'start' | 'end' | 'all' | number | boolean | null;

/** A range of ProseMirror document positions (as in `BridgeState.selection`). */
export type SelectionRange = { from: number; to: number };

export interface SetContentOptions {
  /**
   * How HTML is parsed, e.g. `{ preserveWhitespace: 'full' }` to keep runs
   * of spaces (#327). Defaults to the editor's `parseOptions`.
   */
  parseOptions?: SerializableParseOptions;
  /** Whether the change fires `onChange` / `content-update`. Defaults to true. */
  emitUpdate?: boolean;
}

type CoreEditorInstance = {
  getHTML: () => Promise<string>;
  getJSON: () => Promise<object>;
  getText: () => Promise<string>;
  /**
   * Plain text between two document positions, the current selection by
   * default. Blocks are separated by `\n` (#338).
   */
  getSelectedText: (range?: SelectionRange) => Promise<string>;
  setContent: (content: Content, options?: SetContentOptions) => void;
  /** Inserts HTML, text or JSON at the cursor, replacing the selection (#62). */
  insertContent: (content: Content) => void;
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
  DocumentHeight = 'document-height',
  SetEditable = 'set-editable',
  InsertContent = 'insert-content',
  GetSelectedText = 'get-selected-text',
  SendSelectedTextToNative = 'send-selected-text-back',
}

type RpcReply<T extends CoreEditorActionType, C> = {
  type: T;
  payload: {
    content: C;
    messageId: string;
  };
};

type MessageToNative =
  | RpcReply<CoreEditorActionType.SendHTMLToNative, string>
  | RpcReply<CoreEditorActionType.SendTextToNative, string>
  | RpcReply<CoreEditorActionType.SendJSONToNative, object>
  | RpcReply<CoreEditorActionType.SendSelectedTextToNative, string>;

type RpcRequest<T extends CoreEditorActionType, P = {}> = {
  type: T;
  payload: P & { messageId: string };
};

export type CoreMessages =
  | MessageToNative
  | RpcRequest<CoreEditorActionType.GetHTML>
  | RpcRequest<CoreEditorActionType.GetJSON>
  | RpcRequest<CoreEditorActionType.GetText>
  | RpcRequest<CoreEditorActionType.GetSelectedText, { range?: SelectionRange }>
  | {
      type: CoreEditorActionType.SetContent;
      payload: {
        content: Content;
        parseOptions?: SerializableParseOptions;
        emitUpdate?: boolean;
      };
    }
  | {
      type: CoreEditorActionType.InsertContent;
      payload: {
        content: Content;
      };
    }
  | {
      type: CoreEditorActionType.StateUpdate;
      payload: EditorState;
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
      payload: SelectionRange;
    }
  | {
      type: CoreEditorActionType.ContentUpdate;
      payload: undefined;
    }
  | {
      type: CoreEditorActionType.DocumentHeight;
      payload: number;
    }
  | {
      type: CoreEditorActionType.SetEditable;
      payload: boolean;
    };

const clampRange = (editor: Editor, range: SelectionRange | undefined) => {
  const { from, to } = range ?? editor.state.selection;
  const size = editor.state.doc.content.size;
  const clamp = (pos: number) =>
    Math.min(Math.max(Math.round(pos) || 0, 0), size);
  return { from: clamp(Math.min(from, to)), to: clamp(Math.max(from, to)) };
};

/** Android needs a moment after load before `requestFocus` sticks (react-native-webview#1172). */
const ANDROID_FOCUS_DELAY_MS = 100;

export const CoreBridge = new BridgeExtension<
  CoreEditorState,
  Omit<CoreEditorInstance, 'theme' | 'injectCSS'>,
  CoreMessages
>({
  forceName: 'coreBridge',
  tiptapExtension: Document,
  tiptapExtensionDeps: [Paragraph, Text],
  onBridgeMessage: (editor, message, sendMessageBack) => {
    switch (message.type) {
      case CoreEditorActionType.SetContent: {
        const { content, parseOptions, emitUpdate } = message.payload;
        editor.commands.setContent(content, {
          parseOptions: parseOptions ?? editor.options.parseOptions,
          emitUpdate: emitUpdate ?? true,
        });
        return true;
      }
      case CoreEditorActionType.InsertContent:
        editor
          .chain()
          .focus()
          .insertContent(message.payload.content, {
            parseOptions: editor.options.parseOptions,
          })
          .run();
        return true;
      case CoreEditorActionType.GetHTML:
        sendMessageBack({
          type: CoreEditorActionType.SendHTMLToNative,
          payload: {
            content: editor.getHTML(),
            messageId: message.payload.messageId,
          },
        });
        return true;
      case CoreEditorActionType.GetJSON:
        sendMessageBack({
          type: CoreEditorActionType.SendJSONToNative,
          payload: {
            content: editor.getJSON(),
            messageId: message.payload.messageId,
          },
        });
        return true;
      case CoreEditorActionType.GetText:
        sendMessageBack({
          type: CoreEditorActionType.SendTextToNative,
          payload: {
            content: editor.getText(),
            messageId: message.payload.messageId,
          },
        });
        return true;
      case CoreEditorActionType.GetSelectedText: {
        const { from, to } = clampRange(editor, message.payload.range);
        sendMessageBack({
          type: CoreEditorActionType.SendSelectedTextToNative,
          payload: {
            content: getTextBetween(
              editor.state.doc,
              { from, to },
              {
                blockSeparator: '\n',
                textSerializers: getTextSerializersFromSchema(editor.schema),
              }
            ),
            messageId: message.payload.messageId,
          },
        });
        return true;
      }
      case CoreEditorActionType.SetSelection:
        editor.commands.setTextSelection(message.payload);
        return true;
      case CoreEditorActionType.Focus:
        editor.commands.focus(message.payload);
        return true;
      case CoreEditorActionType.Blur:
        editor.commands.blur();
        return true;
      case CoreEditorActionType.UpdateScrollThresholdAndMargin: {
        const bottom = message.payload;
        const edges = { top: 0, bottom, right: 0, left: 0 };
        // setOptions replaces editorProps, so keep the runtime's handlers.
        editor.setOptions({
          editorProps: {
            ...editor.options.editorProps,
            scrollThreshold: edges,
            scrollMargin: edges,
          },
        });
        return true;
      }
      case CoreEditorActionType.SetEditable:
        editor.setEditable(message.payload);
        return true;
      default:
        return false;
    }
  },
  onEditorMessage: (message, editorBridge) => {
    if (resolveFallbackReply(message)) return true;
    switch (message.type) {
      case CoreEditorActionType.EditorReady:
        // With an EditorController attached, it owns autofocus (onReady).
        if (!getEditorController(editorBridge) && editorBridge.autofocus) {
          editorBridge.focus('end');
        }
        return false;
      case CoreEditorActionType.StateUpdate:
        editorBridge._updateEditorState(message.payload);
        return false;
      case CoreEditorActionType.ContentUpdate:
        editorBridge._onContentUpdate();
        return false;
      default:
        return false;
    }
  },
  extendEditorInstance: (
    sendBridgeMessage,
    webviewRef,
    editorState,
    setEditorState,
    platform,
    bridgeContext
  ) => {
    const context = resolveBridgeContext(
      sendBridgeMessage,
      webviewRef,
      editorState,
      setEditorState,
      platform,
      bridgeContext
    );
    const send = (message: CoreMessages, coalesce = false) =>
      context.send(
        message,
        coalesce ? { coalesceKey: message.type } : undefined
      );
    const request = <T>(
      type:
        | CoreEditorActionType.GetHTML
        | CoreEditorActionType.GetJSON
        | CoreEditorActionType.GetText
    ) => context.rpc<T>({ type });

    return {
      updateScrollThresholdAndMargin: (bottom) =>
        send(
          {
            type: CoreEditorActionType.UpdateScrollThresholdAndMargin,
            payload: bottom,
          },
          true
        ),
      setSelection: (from, to) =>
        send({
          type: CoreEditorActionType.SetSelection,
          payload: { from, to },
        }),
      setContent: (content, options) =>
        send({
          type: CoreEditorActionType.SetContent,
          payload: { content, ...options },
        }),
      insertContent: (content) =>
        send({
          type: CoreEditorActionType.InsertContent,
          payload: { content },
        }),
      getHTML: () => request<string>(CoreEditorActionType.GetHTML),
      getText: () => request<string>(CoreEditorActionType.GetText),
      getJSON: () => request<object>(CoreEditorActionType.GetJSON),
      getSelectedText: (range) =>
        context.rpc<string>(
          {
            type: CoreEditorActionType.GetSelectedText,
            payload: range ? { range } : {},
          },
          { capability: CAPABILITIES.SelectedText }
        ),
      focus: (pos) => {
        if (context.platform === 'android') {
          setTimeout(
            () => context.getWebView()?.requestFocus(),
            ANDROID_FOCUS_DELAY_MS
          );
        } else {
          context.getWebView()?.requestFocus();
        }
        context.setState({ ...context.getState(), isFocused: true });
        send({ type: CoreEditorActionType.Focus, payload: pos });
      },
      blur: () => send({ type: CoreEditorActionType.Blur, payload: undefined }),
      injectJS: (js) => context.getWebView()?.injectJavaScript(js),
      setEditable: (editable) =>
        send(
          { type: CoreEditorActionType.SetEditable, payload: editable },
          true
        ),
    };
  },
  extendEditorState: (editor) => ({
    isFocused: getFocusTracker().isFocused,
    isReady: true,
    selection: {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    },
    editable: editor.isEditable,
    empty: editor.isEmpty,
  }),
});
