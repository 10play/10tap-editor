import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import type TenTapBridge from '../bridges/base';

export interface EditorNativeState {}

type Subscription<T> = (cb: (val: T) => void) => () => void;

export interface EditorInstance {
  avoidIosKeyboard?: boolean;
  customSource?: string;
  DEV?: boolean;
  DEV_SERVER_URL?: string;
  autofocus: boolean;
  focus: (pos?: 'start' | 'end' | 'all' | number | boolean | null) => void;
  initialContent?: string;
  webviewRef: RefObject<WebView>;
  getEditorState: () => EditorNativeState;
  _updateEditorState: (state: EditorNativeState) => void;
  _subscribeToEditorStateUpdate: Subscription<EditorNativeState>;
  plugins?: TenTapBridge<unknown, unknown, unknown>[];
}
