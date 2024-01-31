import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import type TenTapBridge from '../Editor/plugins/base';

export interface EditorState {
  activeHighlight: string | undefined;
  activeColor: string | undefined;
  isFocused: boolean;
}

type Subscription<T> = (cb: (val: T) => void) => () => void;

export interface EditorInstance {
  webviewRef: RefObject<WebView>;
  changeColor: (color: string) => void;
  updateScrollThresholdAndMargin: (offset: number) => void;
  changeHighlight: (color: string) => void;
  getEditorState: () => EditorState;
  _updateEditorState: (state: EditorState) => void;
  _subscribeToEditorStateUpdate: Subscription<EditorState>;
  plugins?: TenTapBridge<unknown, unknown, unknown>[];
}
