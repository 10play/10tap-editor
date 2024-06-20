import debounce from 'lodash/debounce';
import { useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import { Editor } from '@tiptap/core';
import { type EditorMessage, EditorMessageType } from '../types/Messaging';
import { type BridgeState } from '../types/EditorBridge';
import type BridgeExtension from '../bridges/base';
import { CoreEditorActionType } from '../bridges/core';
import { blueBackgroundPlugin } from '../bridges/HighlightSelection';
import { contentHeightListener } from './contentHeight';
declare global {
  interface Window {
    initialContent: string;
    editable: string;
    bridgeExtensionConfigMap: string;
    whiteListBridgeExtensions: string[];
    ReactNativeWebView: { postMessage: (message: string) => void };
  }
}

const content = window.initialContent || '';

export const sendMessage = (message: EditorMessage) => {
  // @ts-ignore TODO fix type
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
};

interface useTenTapArgs {
  tiptapOptions?: any;
  bridges?: BridgeExtension[];
}

const extensionConfigs = JSON.parse(window.bridgeExtensionConfigMap || '{}');

// Wrapper for tiptap editor that will add specific mobile functionality and support tentap bridges
// args:
// tiptapOptions - all the options that tiptap editor accepts
// bridges - array of bridges that will be used to extend the editor
export const useTenTap = (options?: useTenTapArgs) => {
  const { tiptapOptions = {}, bridges = [] } = options || {};
  function filterExists<T>(object: T): object is NonNullable<T> {
    return object !== null && object !== undefined;
  }

  const extensions = bridges
    .map((e) => {
      const extensionConfig = extensionConfigs[e.name];
      if (!extensionConfig) return null;
      const { optionsConfig, extendConfig } = extensionConfig;
      return e.configureTiptapExtensionsOnRunTime(optionsConfig, extendConfig);
    })
    .filter(filterExists)
    .flat();

  const tiptapOptionsWithExtensions = {
    ...tiptapOptions,
    extensions: [
      blueBackgroundPlugin,
      ...extensions,
      ...(tiptapOptions.extensions || []),
    ],
  };

  const sendStateUpdate = debounce((editor: Editor) => {
    let payload = {};

    const state = bridges.reduce((acc, e) => {
      if (!e.extendEditorState) return acc;
      return Object.assign(acc, e.extendEditorState(editor));
    }, payload) as BridgeState;

    sendMessage({
      type: CoreEditorActionType.StateUpdate,
      payload: state,
    });
  }, 10);

  const editor = useEditor({
    content,
    onCreate: () =>
      sendMessage({
        type: CoreEditorActionType.EditorReady,
        payload: undefined,
      }),
    onUpdate: (onUpdate) => {
      sendStateUpdate(onUpdate.editor);
      sendMessage({
        type: CoreEditorActionType.ContentUpdate,
        payload: undefined,
      });
    },
    onSelectionUpdate: (onUpdate) => sendStateUpdate(onUpdate.editor),
    onTransaction: (onUpdate) => sendStateUpdate(onUpdate.editor),
    editable: window.editable,
    ...tiptapOptionsWithExtensions,
  });

  useEffect(() => {
    if (!editor) return;
    // Subscribe to editor message
    const handleEditorAction = (action: any) => {
      bridges.forEach((e) => {
        e.onBridgeMessage && e.onBridgeMessage(editor, action, sendMessage);
      });
    };
    const handleWebviewMessage = (event: MessageEvent | Event) => {
      if (!(event instanceof MessageEvent)) return; // TODO check android
      const message = JSON.parse(event.data) as EditorMessage;
      if (message.type === EditorMessageType.Action) {
        // Workaround for https://github.com/react-native-webview/react-native-webview/issues/3305
        if (message.id) {
          // @ts-ignore
          if (window.lastMessageID === message.id) return;
          // @ts-ignore
          window.lastMessageID = message.id;
        }
        // Handle actions
        handleEditorAction(message.payload);
      }
    };
    // We need to listen to both window and document events because some platform get
    // webview messages from window and some from document
    window.addEventListener('message', handleWebviewMessage);
    document.addEventListener('message', handleWebviewMessage);

    return () => {
      window.removeEventListener('message', handleWebviewMessage);
      document.removeEventListener('message', handleWebviewMessage);
    };
  }, [editor, bridges]);

  useEffect(() => {
    if (editor && !contentHeightListener.connected)
      contentHeightListener.connect(
        document.querySelector('.ProseMirror')!,
        (height) => {
          sendMessage({
            type: CoreEditorActionType.DocumentHeight,
            payload: height,
          });
        }
      );
  }, [editor]);

  return editor;
};
