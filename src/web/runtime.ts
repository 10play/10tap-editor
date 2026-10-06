import './globals';
import {
  readBootConfig,
  bootConfigFromLegacyGlobals,
  type BootConfig,
} from '../shared/bootConfig';
import { WEB_RUNTIME_CAPABILITIES } from '../shared/capabilities';
import type { TentapWebRuntime } from '../shared/contracts';
import {
  BOOT_ERROR_TIMEOUT_MS,
  PROTOCOL_TYPES,
  PROTOCOL_VERSION,
  createDedupe,
  createEditorId,
  createEditorReadyPayload,
  createWebMessage,
  decodeActionEnvelope,
  encodeMessage,
  isForEditor,
  type ActionEnvelope,
  type BootErrorPayload,
  type BridgeMessage,
} from '../shared/protocol';
import { getFocusTracker } from './focus';
import { applyStyleSheet } from './styles';

/**
 * The web runtime: one per WebView document, created by `boot()`.
 *
 * It reads the boot config, owns the single native → web message listener
 * (attached at boot, before React renders) and the web → native channel.
 * Messages that arrive before an editor subscribes are buffered and handed to
 * the first subscriber, so nothing native sends right after `editor-ready` can
 * be lost to a late listener (#343, #322, #227).
 */
export interface WebRuntime {
  /** Null until the native side provided a config (or `requireConfig` ran). */
  readonly config: BootConfig | null;
  /** Runs `callback` once a config is available (immediately if it is). */
  whenConfigured(callback: (config: BootConfig) => void): () => void;
  /**
   * The config, falling back to whatever 1.0 globals exist right now. Custom
   * bundles that mount their editor without waiting get the 1.0 behaviour.
   */
  requireConfig(): BootConfig;
  /** Posts to native, tagged with the editor id once it is known (#318). */
  post(message: BridgeMessage): void;
  /** Posts the `editor-ready` handshake with this runtime's capabilities. */
  announceReady(): void;
  /**
   * Receives the inner message of every action envelope for this editor. The
   * first subscriber also receives the messages buffered before it.
   */
  subscribe(listener: (message: BridgeMessage) => void): () => void;
  /** `null` removes the attribute. Re-applied to editors mounted later. */
  setInputMode(mode: string | null): void;
  /** Applies the current input mode to a newly mounted editor element. */
  applyInputMode(element: Element): void;
  /** Posts `boot-error` with reason `exception`. */
  reportBootError(error: unknown): void;
  /** Removes listeners, timers and `window.__tentap`. */
  dispose(): void;
}

const RUNTIME_KEY: unique symbol = Symbol.for(
  '@10play/tentap-editor/web-runtime'
);
const CONFIG_POLL_INTERVAL_MS = 16;

type RuntimeHost = Window & { [RUNTIME_KEY]?: WebRuntime };
type LegacyHost = Window & {
  contentInjected?: unknown;
  lastMessageID?: string;
};

const hasLegacyGlobals = (win: Window): boolean =>
  (win as LegacyHost).contentInjected === true ||
  typeof win.bridgeExtensionConfigMap === 'string';

function readConfig(win: Window): BootConfig | null {
  const config = readBootConfig(win.__TENTAP__);
  if (config) return config;
  return hasLegacyGlobals(win)
    ? bootConfigFromLegacyGlobals(win, createEditorId())
    : null;
}

function createWebRuntime(win: Window): WebRuntime {
  const startedAt = Date.now();
  const dedupe = createDedupe();
  const subscribers = new Set<(message: BridgeMessage) => void>();
  const pendingConfig = new Set<(config: BootConfig) => void>();
  let buffer: ActionEnvelope[] = [];
  let config: BootConfig | null = null;
  let inputMode: string | null = null;
  let lastEvent: Event | undefined;
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let bootErrorTimer: ReturnType<typeof setTimeout> | undefined;

  const send = (message: BridgeMessage) => {
    win.ReactNativeWebView?.postMessage(
      encodeMessage(
        createWebMessage(message.type, message.payload, config?.editorId)
      )
    );
  };

  const postBootError = (payload: BootErrorPayload) =>
    send({ type: PROTOCOL_TYPES.BootError, payload });

  const deliver = (envelope: ActionEnvelope) => {
    if (config && !isForEditor(envelope.editorId, config.editorId)) return;
    subscribers.forEach((listener) => listener(envelope.payload));
  };

  const flushBuffer = () => {
    if (!config || subscribers.size === 0 || buffer.length === 0) return;
    const pending = buffer;
    buffer = [];
    pending.forEach(deliver);
  };

  const onMessage = (event: Event) => {
    // Some platforms deliver the same event to window and document listeners.
    if (event === lastEvent) return;
    lastEvent = event;
    const envelope = decodeActionEnvelope((event as MessageEvent).data);
    if (!envelope) return;
    if (envelope.id !== undefined) {
      // Workaround for react-native-webview#3305 (duplicate deliveries).
      if (dedupe.seen(envelope.id)) return;
      (win as LegacyHost).lastMessageID = envelope.id;
    }
    if (!config || subscribers.size === 0) buffer.push(envelope);
    else deliver(envelope);
  };

  const setInputMode = (mode: string | null) => {
    inputMode = mode;
    win.document.querySelectorAll('.ProseMirror').forEach((element) => {
      if (mode === null) element.removeAttribute('inputmode');
      else element.setAttribute('inputmode', mode);
    });
  };

  const stopWaiting = () => {
    clearInterval(pollTimer);
    clearTimeout(bootErrorTimer);
    pollTimer = undefined;
    bootErrorTimer = undefined;
  };

  const configure = (next: BootConfig) => {
    config = next;
    stopWaiting();
    const api: TentapWebRuntime = Object.freeze({
      protocol: PROTOCOL_VERSION,
      editorId: next.editorId,
      capabilities: WEB_RUNTIME_CAPABILITIES,
      setInputMode,
      applyStyleSheet: (tag: string, css: string) => {
        applyStyleSheet(tag, css, win.document);
      },
    });
    win.__tentap = api;
    const callbacks = Array.from(pendingConfig);
    pendingConfig.clear();
    callbacks.forEach((callback) => callback(next));
    flushBuffer();
  };

  const tryConfigure = () => {
    const found = readConfig(win);
    if (found) configure(found);
    return found !== null;
  };

  win.addEventListener('message', onMessage);
  win.document.addEventListener('message', onMessage);
  getFocusTracker();

  if (!tryConfigure()) {
    // react-native-webview can run injectedJavaScriptBeforeContentLoaded
    // after the bundle on Android (react-native-webview#2960).
    pollTimer = setInterval(tryConfigure, CONFIG_POLL_INTERVAL_MS);
    bootErrorTimer = setTimeout(() => {
      postBootError({
        reason: 'config-missing',
        elapsedMs: Date.now() - startedAt,
        legacyGlobals: hasLegacyGlobals(win),
      });
    }, BOOT_ERROR_TIMEOUT_MS);
  }

  const runtime: WebRuntime = {
    get config() {
      return config;
    },
    whenConfigured(callback) {
      if (config) {
        callback(config);
        return () => {};
      }
      pendingConfig.add(callback);
      return () => {
        pendingConfig.delete(callback);
      };
    },
    requireConfig() {
      if (!config)
        configure(bootConfigFromLegacyGlobals(win, createEditorId()));
      return config as BootConfig;
    },
    post: send,
    announceReady() {
      const editorId = runtime.requireConfig().editorId;
      send({
        type: PROTOCOL_TYPES.EditorReady,
        payload: createEditorReadyPayload(editorId, WEB_RUNTIME_CAPABILITIES),
      });
    },
    subscribe(listener) {
      subscribers.add(listener);
      flushBuffer();
      return () => {
        subscribers.delete(listener);
      };
    },
    setInputMode,
    applyInputMode(element) {
      if (inputMode !== null) element.setAttribute('inputmode', inputMode);
    },
    reportBootError(error) {
      postBootError({
        reason: 'exception',
        elapsedMs: Date.now() - startedAt,
        legacyGlobals: hasLegacyGlobals(win),
        message: error instanceof Error ? error.message : String(error),
      });
    },
    dispose() {
      stopWaiting();
      win.removeEventListener('message', onMessage);
      win.document.removeEventListener('message', onMessage);
      subscribers.clear();
      pendingConfig.clear();
      buffer = [];
      const host = win as RuntimeHost;
      if (host[RUNTIME_KEY] === runtime) delete host[RUNTIME_KEY];
      if (config && win.__tentap?.editorId === config.editorId) {
        delete win.__tentap;
      }
    },
  };
  return runtime;
}

/**
 * Starts the web runtime for `win` once; later calls return the same
 * instance. Safe to call during render.
 */
export function boot(win: Window = window): WebRuntime {
  const host = win as RuntimeHost;
  const existing = host[RUNTIME_KEY];
  if (existing) return existing;
  const runtime = createWebRuntime(win);
  host[RUNTIME_KEY] = runtime;
  return runtime;
}

/** The runtime started by `boot()`, if any. */
export function getWebRuntime(
  win: Window | undefined = typeof window === 'undefined' ? undefined : window
): WebRuntime | undefined {
  return win ? (win as RuntimeHost)[RUNTIME_KEY] : undefined;
}

/**
 * Posts a message to native (`@10play/tentap-editor/web` export). Goes
 * through the runtime when it is running so the message carries the editor id.
 */
export function sendMessage(message: BridgeMessage): void {
  const runtime = getWebRuntime();
  if (runtime) runtime.post(message);
  else window.ReactNativeWebView?.postMessage(encodeMessage(message));
}
