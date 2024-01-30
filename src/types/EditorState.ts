import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import type BaseTenTapPlugin from '../Editor/plugins/base';

export interface EditorState {
  activeHighlight: string | undefined;
  activeColor: string | undefined;
  activeLink: string | undefined;
  canAddLink: boolean;
  canToggleCheckList: boolean;
  isFocused: boolean;
  isLinkActive: boolean;
  isCheckListActive: boolean;
}

type Subscription<T> = (cb: (val: T) => void) => () => void;

export interface EditorInstance {
  webviewRef: RefObject<WebView>;
  editLink: (newLink: string) => void;
  toggleCheckList: () => void;
  changeColor: (color: string) => void;
  updateScrollThresholdAndMargin: (offset: number) => void;
  changeHighlight: (color: string) => void;
  getEditorState: () => EditorState;
  _updateEditorState: (state: EditorState) => void;
  _subscribeToEditorStateUpdate: Subscription<EditorState>;
  plugins?: BaseTenTapPlugin<unknown, unknown, unknown>[];
}
