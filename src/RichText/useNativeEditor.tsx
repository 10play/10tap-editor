import { useRef } from 'react';
import WebView from 'react-native-webview';
import {
  type EditorActionMessage,
  EditorMessageType,
} from '../types/Messaging';
import { type EditorNativeState } from '../types/EditorNativeState';
import { EditorHelper } from './EditorHelper';
import type { EditorInstance } from '../types';
import type TenTapBridge from '../bridges/base';

type Subscription<T> = (cb: (val: T) => void) => () => void;

export const useNativeEditor = (options?: {
  plugins?: TenTapBridge<any, any, any>[];
  initialContent?: string;
  autofocus?: boolean;
  avoidIosKeyboard?: boolean;
  customSource?: string;
  DEV?: boolean;
  DEV_SERVER_URL?: string;
}): EditorInstance => {
  const webviewRef = useRef<WebView>(null);
  // Till we will implement default per plugin
  const editorStateRef = useRef<EditorNativeState | {}>({});
  const editorStateSubsRef = useRef<((state: EditorNativeState) => void)[]>([]);

  const _updateEditorState = (editorState: EditorNativeState) => {
    editorStateRef.current = editorState;
    editorStateSubsRef.current.forEach((sub) => sub(editorState));
  };

  const _subscribeToEditorStateUpdate: Subscription<EditorNativeState> = (
    cb
  ) => {
    editorStateSubsRef.current.push(cb);
    return () => {
      editorStateSubsRef.current = editorStateSubsRef.current.filter(
        (sub) => sub !== cb
      );
    };
  };

  const getEditorState = () => {
    return editorStateRef.current;
  };

  const sendMessage = (message: EditorActionMessage) => {
    // TODO editor ready check
    if (!webviewRef.current) return console.warn("Editor isn't ready yet");
    webviewRef.current?.postMessage(JSON.stringify(message));
  };

  const sendAction = (action: any) => {
    sendMessage({
      type: EditorMessageType.Action,
      payload: action,
    });
  };

  const editorInstance = {
    plugins: options?.plugins,
    initialContent: options?.initialContent,
    autofocus: options?.autofocus,
    avoidIosKeyboard: options?.avoidIosKeyboard,
    customSource: options?.customSource,
    DEV_SERVER_URL: options?.DEV_SERVER_URL,
    DEV: options?.DEV,
    webviewRef,
    getEditorState,
    _updateEditorState,
    _subscribeToEditorStateUpdate,
  };

  const editorInstanceExtendByPlugins = (options?.plugins || []).reduce(
    (acc, cur) => {
      if (!cur.extendEditorInstance) return acc;
      return Object.assign(
        acc,
        cur.extendEditorInstance(
          sendAction,
          webviewRef,
          editorStateRef,
          _updateEditorState
        ),
        webviewRef,
        editorStateRef.current,
        _updateEditorState
      );
    },
    editorInstance
  ) as EditorInstance;

  EditorHelper.setEditorLastInstance(editorInstanceExtendByPlugins);

  return editorInstanceExtendByPlugins;
};
