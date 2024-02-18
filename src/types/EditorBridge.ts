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
  autofocus: boolean;
  focus: (pos?: 'start' | 'end' | 'all' | number | boolean | null) => void;
  initialContent?: string;
  webviewRef: RefObject<WebView>;
  getEditorState: () => BridgeState;
  _updateEditorState: (state: BridgeState) => void;
  _subscribeToEditorStateUpdate: Subscription<BridgeState>;
  bridgeExtensions?: BridgeExtension<unknown, unknown, unknown>[];
}
