import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import type TenTapBridge from '../Editor/plugins/base';

export interface EditorState {
  isFocused: boolean;
  isReady: boolean;
}

type Subscription<T> = (cb: (val: T) => void) => () => void;

export interface EditorInstance {
  focus: (pos?: 'start' | 'end' | 'all' | number | boolean | null) => void;
  webviewRef: RefObject<WebView>;
  updateScrollThresholdAndMargin: (offset: number) => void;
  getEditorState: () => EditorState;
  _updateEditorState: (state: EditorState) => void;
  _subscribeToEditorStateUpdate: Subscription<EditorState>;
  plugins?: TenTapBridge<unknown, unknown, unknown>[];
}
