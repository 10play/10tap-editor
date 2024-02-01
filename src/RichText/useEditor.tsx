import { useRef } from 'react';
import WebView from 'react-native-webview';
import {
  type EditorActionMessage,
  EditorMessageType,
} from '../types/Messaging';
import { EditorUpdateSettings } from '../types/Actions';
import { type EditorState } from '../types/EditorState';
import { EditorHelper } from './EditorHelper';
import type { EditorInstance } from '../types';
import type TenTapBridge from '../Editor/plugins/base';

type Subscription<T> = (cb: (val: T) => void) => () => void;

export const useEditor = (options?: {
  plugins?: TenTapBridge<any, any, any>[];
}): EditorInstance => {
  const webviewRef = useRef<WebView>(null);
  // Till we will implement default per plugin
  const editorStateRef = useRef<EditorState | {}>({});
  const editorStateSubsRef = useRef<((state: EditorState) => void)[]>([]);

  const _updateEditorState = (editorState: EditorState) => {
    editorStateRef.current = editorState;
    editorStateSubsRef.current.forEach((sub) => sub(editorState));
  };

  const _subscribeToEditorStateUpdate: Subscription<EditorState> = (cb) => {
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

  const updateScrollThresholdAndMargin = (bottom: number) =>
    sendAction({
      type: EditorUpdateSettings.UpdateScrollThresholdAndMargin,
      payload: bottom,
    });

  const focus = (pos: 'start' | 'end' | 'all' | number | boolean | null) => {
    webviewRef.current?.requestFocus();
    sendAction({
      type: EditorUpdateSettings.Focus,
      payload: pos,
    });
  };

  const editorInstance = {
    plugins: options?.plugins,
    webviewRef,
    updateScrollThresholdAndMargin,
    getEditorState,
    focus,
    _updateEditorState,
    _subscribeToEditorStateUpdate,
  };

  const editorInstanceExtendByPlugins = (options?.plugins || []).reduce(
    (acc, cur) => {
      return Object.assign(acc, cur.extendEditorInstance(sendAction));
    },
    editorInstance
  ) as EditorInstance;

  EditorHelper.setEditorLastInstance(editorInstanceExtendByPlugins);

  return editorInstanceExtendByPlugins;
};
