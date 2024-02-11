import { useMemo, useRef } from 'react';
import WebView from 'react-native-webview';
import {
  type EditorActionMessage,
  EditorMessageType,
} from '../types/Messaging';
import { type BridgeState } from '../types/EditorBridge';
import { EditorHelper } from './EditorHelper';
import type { EditorBridge } from '../types';
import type BridgeExtension from '../bridges/base';
import { TenTapStartKit } from '../bridges/StarterKit';
import { uniqueBy } from '../utils';

type Subscription<T> = (cb: (val: T) => void) => () => void;

export const useEditorBridge = (options?: {
  bridgeExtensions?: BridgeExtension<any, any, any>[];
  initialContent?: string;
  autofocus?: boolean;
  avoidIosKeyboard?: boolean;
  customSource?: string;
  DEV?: boolean;
  DEV_SERVER_URL?: string;
}): EditorBridge => {
  const webviewRef = useRef<WebView>(null);
  // Till we will implement default per bridgeExtension
  const editorStateRef = useRef<BridgeState | {}>({});
  const editorStateSubsRef = useRef<((state: BridgeState) => void)[]>([]);

  const bridgeExtensions = useMemo(() => {
    const extensions = options?.bridgeExtensions || TenTapStartKit;
    // Filter out duplicates
    return uniqueBy(extensions, 'name');
  }, [options?.bridgeExtensions]);

  const _updateEditorState = (editorState: BridgeState) => {
    editorStateRef.current = editorState;
    editorStateSubsRef.current.forEach((sub) => sub(editorState));
  };

  const _subscribeToEditorStateUpdate: Subscription<BridgeState> = (cb) => {
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

  const editorBridge = {
    bridgeExtensions: bridgeExtensions,
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

  const editorInstanceExtendByPlugins = (bridgeExtensions || []).reduce(
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
    editorBridge
  ) as EditorBridge;

  EditorHelper.setEditorLastInstance(editorInstanceExtendByPlugins);

  return editorInstanceExtendByPlugins;
};
