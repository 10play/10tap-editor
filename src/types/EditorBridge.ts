import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import type BridgeExtension from '../bridges/base';
import type { Subscription } from './Subscription';

export interface BridgeState {}

export interface EditorBridge {
  avoidIosKeyboard?: boolean;
  customSource?: string;
  webviewBaseURL?: string;
  DEV?: boolean;
  DEV_SERVER_URL?: string;
  dynamicHeight?: boolean;
  disableColorHighlight?: boolean;
  autofocus: boolean;
  focus: (pos?: 'start' | 'end' | 'all' | number | boolean | null) => void;
  initialContent?: string;
  editable?: boolean;
  webviewRef: RefObject<WebView>;
  getEditorState: () => BridgeState;
  _updateEditorState: (state: BridgeState) => void;
  _subscribeToEditorStateUpdate: Subscription<BridgeState>;
  _onContentUpdate: () => void;
  _onContentHeightUpdate: (height: number) => void;
  _subscribeToContentUpdate: Subscription<void>;
  bridgeExtensions?: BridgeExtension<unknown, unknown, unknown>[];
}
