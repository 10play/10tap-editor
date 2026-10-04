import type { RuntimePlatform } from './bootConfig';
import type { Capabilities, CapabilityName } from './capabilities';
import type { BridgeMessage, WebMessage } from './protocol';

/**
 * Cross-package contracts of the 1.1 core. Implementations live in
 * `src/native` (EditorController), `src/RichText` (facade, view),
 * `src/RichText/Keyboard` (custom keyboard) and `src/web` (web runtime).
 */

export type Unsubscribe = () => void;
export type Listener<T> = (value: T) => void;

/** The part of the react-native-webview ref the controller drives. */
export interface WebViewHandle {
  postMessage(data: string): void;
  injectJavaScript(script: string): void;
  requestFocus(): void;
  reload(): void;
}

export interface SendOptions {
  /**
   * Idempotent setters (`set-editable`, `set-placeholder`, …) pass a key.
   * While the message is queued, a newer message with the same key removes
   * it and is appended at the end of the outbox. Messages without a key are
   * never dropped or reordered.
   */
  coalesceKey?: string;
}

export interface RpcOptions {
  /**
   * Capability the web bundle must advertise. Evaluated when the editor
   * becomes ready (immediately if it already is); a bundle without it
   * rejects the call with `TentapUnsupportedError`.
   */
  capability?: CapabilityName;
  /** Overrides the controller's `rpcTimeoutMs`. */
  timeoutMs?: number;
}

export interface CommandMeta {
  /** The token of the enclosing `runInternal` call, if any. */
  internal?: symbol;
}

export type CommandListener = (
  message: BridgeMessage,
  meta: CommandMeta
) => void;

export type MessageListener<P = unknown> = (
  payload: P,
  message: WebMessage
) => void;

export interface EditorControllerOptions<S extends object = object> {
  platform: RuntimePlatform;
  /** Fully populated initial bridge state (`isReady: false`, …). */
  initialState: S;
  /** Generated when omitted. */
  editorId?: string;
  /** RPC timeout in ms. Undefined means no timeout (1.x default). */
  rpcTimeoutMs?: number;
  /**
   * Called once per load, right after the editor becomes ready and the
   * outbox is flushed. The facade passes `() => editor.focus('end')` when
   * `autofocus` is set, so autofocus timing has a single owner.
   */
  onReady?: () => void;
}

/**
 * Owns one editor's channel to its WebView: readiness, outbox, RPCs, injected
 * CSS/scripts and the state, content and height stores. Created once per
 * `useEditorBridge`; its identity never changes for the life of the hook.
 */
export interface EditorController<S extends object = object> {
  readonly editorId: string;
  readonly platform: RuntimePlatform;

  /**
   * Lifecycle. `attach` and `detach` are called from an effect and are
   * reversible, so a StrictMode mount/unmount/mount keeps a working
   * controller. `dispose` is final: pending RPCs are dropped (not rejected)
   * and later sends are ignored with a dev warning.
   */
  attach(): void;
  detach(): void;
  dispose(): void;

  /** WebView wiring, called by `RichText`. */
  setWebView(handle: WebViewHandle | null): void;
  /** Raw `event.nativeEvent.data`. Invalid data and foreign `editorId`s are ignored. */
  handleWebViewMessage(data: unknown): void;
  /** A load after the first one means a reload: back to `loading`. */
  onLoadStart(): void;
  onLoad(): void;
  /** Starts the legacy-ready fallback (`LEGACY_READY_TIMEOUT_MS`). */
  onLoadEnd(): void;
  /** Render or content process died: back to `loading` and reload the WebView. */
  onProcessTerminated(): void;
  /**
   * The current WebView instance will be replaced (iOS RNW remount). It is
   * never considered ready while this is true.
   */
  setRemountPending(pending: boolean): void;
  /** Sends `container-height` (dynamic height) when the bundle supports it. */
  reportContainerHeight(height: number): void;

  isReady(): boolean;
  subscribeReady(listener: Listener<boolean>): Unsubscribe;
  /** Legacy capabilities until the bundle completes the handshake. */
  getCapabilities(): Capabilities;
  supports(capability: CapabilityName): boolean;

  /**
   * Wraps `message` in an action envelope and posts it, or queues it until
   * the editor is ready. Queued commands are replayed after a reload.
   */
  send(message: BridgeMessage, options?: SendOptions): void;
  /**
   * Sends a request with `payload.messageId` set and resolves with the
   * `content` of the reply carrying the same id. Pending requests are
   * re-sent after a reload.
   */
  rpc<T>(message: BridgeMessage, options?: RpcOptions): Promise<T>;
  /** Raw `injectJavaScript`, queued until ready. */
  injectJS(js: string): void;
  /** Upserts `<style data-tag={tag}>`; re-applied on every ready. Default tag `custom-css`. */
  injectCSS(css: string, tag?: string): void;
  /**
   * Keyed script run now (when ready) and again after every ready, in
   * registration order. Re-registering a key replaces it; `null` removes it.
   */
  registerPersistentScript(key: string, js: string | null): void;
  /**
   * Runs `fn`; every command sent synchronously inside it reaches
   * `onCommand` listeners with `meta.internal === token`. Lets the keyboard
   * tell its own `editor.focus()` calls from the app's.
   */
  runInternal<T>(token: symbol, fn: () => T): T;

  /** Messages of one `type` from the web, including unknown types. */
  subscribeMessage<P = unknown>(
    type: string,
    listener: MessageListener<P>
  ): Unsubscribe;
  /** Every accepted message from the web, in arrival order. */
  subscribeMessages(listener: Listener<WebMessage>): Unsubscribe;
  /** Every `send()` call, synchronously, before it is posted or queued. */
  onCommand(listener: CommandListener): Unsubscribe;

  getState(): S;
  setState(state: S): void;
  subscribeState(listener: Listener<S>): Unsubscribe;
  /** Fires content subscribers (`content-update`, which drives `onChange`). */
  emitContentUpdate(): void;
  subscribeContent(listener: () => void): Unsubscribe;
  /** Last `document-height`, kept across `RichText` remounts. */
  getHeight(): number | undefined;
  subscribeHeight(listener: Listener<number>): Unsubscribe;
  /**
   * Latest known document content. Used as `setContent` after a renderer
   * crash so a reload does not fall back to `initialContent`.
   */
  rememberContent(content: string | object): void;
}

export type CreateEditorController = <S extends object>(
  options: EditorControllerOptions<S>
) => EditorController<S>;

/**
 * Passed to `BridgeExtension.extendEditorInstance` as an additive sixth
 * argument. Custom bridges use it for RPCs, capability checks and
 * coalesced sends without reaching into the WebView.
 */
export interface BridgeContext<S extends object = object> {
  readonly platform: RuntimePlatform;
  readonly editorId: string;
  send(message: BridgeMessage, options?: SendOptions): void;
  rpc<T>(message: BridgeMessage, options?: RpcOptions): Promise<T>;
  getState(): S;
  setState(state: S): void;
  supports(capability: CapabilityName): boolean;
  getCapabilities(): Capabilities;
  subscribeMessage<P = unknown>(
    type: string,
    listener: MessageListener<P>
  ): Unsubscribe;
  /** Raw `injectJavaScript`, queued until ready. */
  injectJS(js: string): void;
  getWebView(): WebViewHandle | null;
}

/**
 * Keyboard state `RichText` needs, read through `useKeyboard()`. Heights are
 * in dp.
 */
export interface KeyboardSnapshot {
  systemVisible: boolean;
  systemHeight: number;
  customOpen: boolean;
  /** Height of whichever keyboard is up; held through custom/system swaps. */
  effectiveHeight: number;
  /**
   * True when the keyboard covers the window instead of resizing it (iOS,
   * Android `'stable'` mode, edge-to-edge). `RichText` then applies document
   * padding and the scroll threshold.
   */
  windowOverlaysKeyboard: boolean;
}

/**
 * `window.__tentap`, installed by the web runtime. Injected snippets feature
 * detect it and fall back to plain DOM code for legacy bundles.
 */
export interface TentapWebRuntime {
  readonly protocol: number;
  readonly editorId: string;
  readonly capabilities: readonly CapabilityName[];
  /** `null` removes the `inputmode` attribute from `.ProseMirror`. */
  setInputMode(mode: string | null): void;
  /** Upserts `<style data-tag={tag}>` with `css`. */
  applyStyleSheet(tag: string, css: string): void;
}

/** Property under which the facade exposes its controller on the editor. */
export const EDITOR_CONTROLLER: unique symbol = Symbol.for(
  '@10play/tentap-editor/controller'
);

/**
 * Enumerable, so a spread copy (`{ ...editor }`) keeps its controller as in
 * 1.0. Symbol keys stay out of `Object.keys`, `for...in` and JSON.
 */
export function attachEditorController(
  editor: object,
  controller: EditorController<object>
): void {
  Object.defineProperty(editor, EDITOR_CONTROLLER, {
    value: controller,
    configurable: true,
    enumerable: true,
    writable: false,
  });
}

export function getEditorController(
  editor: object | null | undefined
): EditorController<object> | undefined {
  if (!editor) return undefined;
  return (editor as { [EDITOR_CONTROLLER]?: EditorController<object> })[
    EDITOR_CONTROLLER
  ];
}
