import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import type BridgeExtension from '../bridges/base';
// Loads every built-in bridge's augmentation of `EditorBridge`/`BridgeState`,
// so deep imports of `src/` type-check on their own (#290).
import type {} from '../bridges/StarterKit';
import type { SerializableParseOptions } from '../shared/bootConfig';
import type { Subscription } from './Subscription';
import type { EditorTheme } from './Theme';
import type { RecursivePartial } from './utility';

export interface BridgeState {}

export interface EditorBridge {
  avoidIosKeyboard?: boolean;
  /** Same value as `avoidIosKeyboard`, which it aliases. */
  avoidKeyboard?: boolean;
  /** Extra px kept between the cursor and the bottom of the editor (#308). */
  scrollBottomOffset?: number;
  /** ProseMirror parse options for `initialContent` and `setContent` (#327). */
  parseOptions?: SerializableParseOptions;
  /** Merge `RichText`'s `style` prop over the default WebView styles. */
  mergeStyles?: boolean;
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

export interface EditorBridgeOptions {
  /**
   * Defaults to `TenTapStartKit`. Deduplicated by name, the last one wins.
   * Read once: bridges added after mount are ignored.
   */
  // Bridges are invariant in their message type, so `unknown` would reject them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bridgeExtensions?: BridgeExtension<any, any, any>[];
  /** HTML string or TipTap JSON. */
  initialContent?: string | object;
  /** Focuses the editor at the end once it is ready, after every load. */
  autofocus?: boolean;
  avoidIosKeyboard?: boolean;
  /** Alias of `avoidIosKeyboard`, which wins when both are set. */
  avoidKeyboard?: boolean;
  /** Extra px kept between the cursor and the bottom of the editor (#308). */
  scrollBottomOffset?: number;
  customSource?: string;
  webviewBaseURL?: string;
  dynamicHeight?: boolean;
  /** Defaults to true on Android and false elsewhere. */
  disableColorHighlight?: boolean;
  /** Defaults to true; changing it after mount calls `setEditable`. */
  editable?: boolean;
  /** Called on every content change; the latest callback is always used. */
  onChange?: () => void;
  /** ProseMirror parse options for `initialContent` and `setContent` (#327). */
  parseOptions?: SerializableParseOptions;
  /** Merge `RichText`'s `style` prop over the default WebView styles. */
  mergeStyles?: boolean;
  /**
   * Rejects `getHTML` and the other async reads with `TentapRpcTimeoutError`
   * after this many ms. Read once. No timeout by default.
   */
  rpcTimeoutMs?: number;
  DEV?: boolean;
  DEV_SERVER_URL?: string;
  theme?: RecursivePartial<EditorTheme>;
}
