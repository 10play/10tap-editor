import type { CoreEditorActionType } from '../bridges/core';
import type { RuntimePlatform } from '../shared/bootConfig';
import {
  CAPABILITIES,
  LEGACY_CAPABILITIES,
  hasCapability,
  type Capabilities,
  type CapabilityName,
} from '../shared/capabilities';
import type {
  BridgeContext,
  CommandListener,
  CommandMeta,
  EditorController,
  EditorControllerOptions,
  Listener,
  MessageListener,
  RpcOptions,
  SendOptions,
  Unsubscribe,
  WebViewHandle,
} from '../shared/contracts';
import { TentapUnsupportedError } from '../shared/errors';
import {
  LEGACY_READY_TIMEOUT_MS,
  PROTOCOL_TYPES,
  capabilitiesFromEditorReady,
  createEditorId,
  decodeWebMessage,
  isForEditor,
  readRpcReply,
  type BridgeMessage,
  type RpcReplyPayload,
  type WebMessage,
} from '../shared/protocol';
import { DEFAULT_CSS_TAG, Injector } from './injector';
import { RpcRegistry } from './rpc';
import {
  createEmitter,
  createStore,
  shallowEqual,
  type Emitter,
  type Store,
} from './stores';
import { OUTBOX_LIMIT, Outbox, Transport, type OutboxEntry } from './transport';

/** The controller replays the last content after a reload. */
export const SET_CONTENT_TYPE: `${CoreEditorActionType.SetContent}` =
  'set-content';

/** Longer than the web side's minimum delay for an answer to a report. */
const CONTAINER_ECHO_DELAY_MS = 300;

type ReadySource = 'handshake' | 'state' | 'timeout';

const warn = (message: string, ...details: unknown[]) => {
  if (__DEV__) console.warn(`[TenTap] ${message}`, ...details);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The 1.1 `EditorController`. Lifecycle of one editor's page:
 *
 * - `loading` until the bundle is ready: an `editor-ready` handshake, a
 *   legacy `editor-ready` (no payload; applied a macrotask later because 1.0
 *   bundles attach their listener after posting it), a `stateUpdate` without
 *   a prior handshake, or `LEGACY_READY_TIMEOUT_MS` after the page loaded.
 * - `ready`: stylesheets and persistent scripts are applied, the outbox is
 *   flushed in order, then `isReady` flips and `onReady` runs.
 * - A reload (new load, new WebView, crashed renderer, iOS remount, a second
 *   handshake, or a handshake after the timeout fallback) goes back to
 *   `loading` and re-queues the last content,
 *   the latest coalesced commands and every pending RPC.
 */
export class NativeEditorController<
  S extends object,
> implements EditorController<S> {
  readonly editorId: string;
  readonly platform: RuntimePlatform;

  private readonly options: EditorControllerOptions<S>;
  private readonly transport: Transport;
  private readonly outbox: Outbox;
  private readonly rpcs = new RpcRegistry();
  private readonly injector = new Injector();

  private readonly state: Store<S>;
  private readonly ready = createStore(false);
  private readonly height = createStore<number | undefined>(undefined);
  private readonly content = createEmitter<void>();
  private readonly messages = createEmitter<WebMessage>();
  private readonly messageListeners = new Map<string, Emitter<WebMessage>>();
  private readonly commandListeners = new Set<CommandListener>();

  private phase: 'loading' | 'ready' = 'loading';
  private capabilities: Capabilities = LEGACY_CAPABILITIES;
  private readySource: ReadySource | undefined;
  private readyTimer: ReturnType<typeof setTimeout> | undefined;
  private loadStarted = false;
  private remountPending = false;
  private overflowWarned = false;
  private internalToken: symbol | undefined;
  private containerHeight: number | undefined;
  private containerEchoTimer: ReturnType<typeof setTimeout> | undefined;
  /**
   * Capability-gated RPCs held while the bundle is unknown: ready through the
   * timeout fallback, before its handshake or its first legacy `stateUpdate`.
   */
  private heldRpcs: string[] = [];
  /** Latest message per coalesce key, in last-sent order. */
  private readonly coalesced = new Map<string, BridgeMessage>();
  /** The `set-content` to replay after a reload. */
  private lastContent: BridgeMessage | undefined;
  private contentVersion = 0;

  constructor(options: EditorControllerOptions<S>) {
    this.options = options;
    this.editorId = options.editorId ?? createEditorId();
    this.platform = options.platform;
    this.transport = new Transport(this.editorId);
    this.outbox = new Outbox(OUTBOX_LIMIT, (entry) => this.onOutboxDrop(entry));
    this.state = createStore<S>(
      { ...options.initialState, isReady: false },
      shallowEqual
    );
  }

  // Lifecycle

  attach(): void {
    registerAttached(this);
  }

  // RPC timeouts keep running, so `rpcTimeoutMs` settles requests that were
  // pending when the editor unmounted.
  detach(): void {
    unregisterAttached(this);
  }

  // WebView wiring

  getWebView(): WebViewHandle | null {
    return this.transport.getWebView();
  }

  setWebView(handle: WebViewHandle | null): void {
    const previous = this.transport.getWebView();
    if (!this.transport.setWebView(handle)) return;
    if (handle === null) return;
    // Swapped without a detach: another page, starting from scratch.
    if (previous !== null) {
      this.reset();
      return;
    }
    if (!this.isReady()) return;
    // Re-attached while ready. Deliver what was queued after the commit,
    // unless `onPageReplaced` showed the handle belongs to a new page.
    void Promise.resolve().then(() => {
      if (this.isReady() && this.transport.getWebView() === handle) {
        this.flush();
      }
    });
  }

  onPageReplaced(): void {
    this.reset();
  }

  handleWebViewMessage(data: unknown): void {
    const message = decodeWebMessage(data);
    if (!message || !isForEditor(message.editorId, this.editorId)) return;
    this.receive(message);
    this.messages.emit(message);
    this.messageListeners.get(message.type)?.emit(message);
  }

  onLoadStart(): void {
    if (this.loadStarted) this.reset();
    this.loadStarted = true;
  }

  onLoad(): void {
    this.armLegacyFallback();
  }

  onLoadEnd(): void {
    this.armLegacyFallback();
  }

  onProcessTerminated(): void {
    this.reset();
    this.transport.getWebView()?.reload();
  }

  setRemountPending(pending: boolean): void {
    this.remountPending = pending;
    if (pending) this.reset();
  }

  reportContainerHeight(height: number): void {
    this.containerHeight = height;
    this.clearContainerEcho();
    if (this.isReady()) this.postContainerHeight();
  }

  // Readiness

  isReady(): boolean {
    return this.phase === 'ready';
  }

  subscribeReady(listener: Listener<boolean>): Unsubscribe {
    return this.ready.subscribe(listener);
  }

  getCapabilities(): Capabilities {
    return this.capabilities;
  }

  supports(capability: CapabilityName): boolean {
    return hasCapability(this.capabilities, capability);
  }

  // Outbound

  send(message: BridgeMessage, options: SendOptions = {}): void {
    const meta: CommandMeta =
      this.internalToken === undefined ? {} : { internal: this.internalToken };
    Array.from(this.commandListeners).forEach((listener) =>
      listener(message, meta)
    );

    const { coalesceKey } = options;
    if (coalesceKey !== undefined) {
      this.coalesced.delete(coalesceKey);
      this.coalesced.set(coalesceKey, message);
    }
    if (message.type === SET_CONTENT_TYPE) {
      // Replayed only to restore a reloaded page, which is not an edit.
      this.lastContent = {
        ...message,
        payload: { ...(message.payload as object), emitUpdate: false },
      };
      this.contentVersion++;
    }

    if (this.canPost()) this.transport.post(message);
    else this.outbox.push({ kind: 'message', message, coalesceKey });
  }

  forgetCoalesced(coalesceKey: string): void {
    this.coalesced.delete(coalesceKey);
    this.outbox.discard(coalesceKey);
  }

  rpc<T>(message: BridgeMessage, options: RpcOptions = {}): Promise<T> {
    const { capability } = options;
    if (
      capability !== undefined &&
      this.isReady() &&
      this.readySource !== 'timeout' &&
      !this.supports(capability)
    ) {
      return Promise.reject(new TentapUnsupportedError(capability));
    }
    const messageId = this.transport.nextId();
    const promise = this.rpcs.create<T>(messageId, message, {
      capability,
      timeoutMs: options.timeoutMs ?? this.options.rpcTimeoutMs,
    });
    if (this.canPost()) this.postRpc(messageId);
    else this.outbox.push({ kind: 'rpc', messageId });
    return promise;
  }

  injectJS(js: string): void {
    if (this.canPost()) this.transport.inject(js);
    else this.outbox.push({ kind: 'script', js });
  }

  injectCSS(css: string, tag: string = DEFAULT_CSS_TAG): void {
    this.injectPersistent(this.injector.setStyleSheet(tag, css));
  }

  registerPersistentScript(key: string, js: string | null): void {
    this.injector.setScript(key, js);
    if (js !== null) this.injectPersistent(js);
  }

  runInternal<T>(token: symbol, fn: () => T): T {
    const previous = this.internalToken;
    this.internalToken = token;
    try {
      return fn();
    } finally {
      this.internalToken = previous;
    }
  }

  // Inbound

  subscribeMessage<P = unknown>(
    type: string,
    listener: MessageListener<P>
  ): Unsubscribe {
    let emitter = this.messageListeners.get(type);
    if (!emitter) {
      emitter = createEmitter<WebMessage>();
      this.messageListeners.set(type, emitter);
    }
    return emitter.subscribe((message) =>
      listener(message.payload as P, message)
    );
  }

  subscribeMessages(listener: Listener<WebMessage>): Unsubscribe {
    return this.messages.subscribe(listener);
  }

  onCommand(listener: CommandListener): Unsubscribe {
    this.commandListeners.add(listener);
    return () => {
      this.commandListeners.delete(listener);
    };
  }

  // Stores

  getState(): S {
    return this.state.get();
  }

  /** `isReady` is owned by the controller and overrides the given value. */
  setState(state: S): void {
    this.state.set({ ...state, isReady: this.isReady() });
  }

  subscribeState(listener: Listener<S>): Unsubscribe {
    return this.state.subscribe(listener);
  }

  emitContentUpdate(): void {
    this.content.emit();
  }

  subscribeContent(listener: () => void): Unsubscribe {
    return this.content.subscribe(listener);
  }

  getHeight(): number | undefined {
    return this.height.get();
  }

  subscribeHeight(listener: Listener<number>): Unsubscribe {
    return this.height.subscribe((height) => {
      if (height !== undefined) listener(height);
    });
  }

  getContentVersion(): number {
    return this.contentVersion;
  }

  rememberContent(content: string | object, version?: number): void {
    if (version !== undefined && version !== this.contentVersion) return;
    this.lastContent = {
      type: SET_CONTENT_TYPE,
      payload: { content, emitUpdate: false },
    };
  }

  // Internals

  private receive(message: WebMessage): void {
    switch (message.type) {
      case PROTOCOL_TYPES.EditorReady:
        this.onEditorReady(message.payload);
        return;
      case PROTOCOL_TYPES.StateUpdate:
        // A legacy bundle: the new runtime posts `editor-ready` first.
        if (!this.isReady()) {
          this.becomeReady('state');
        } else if (this.readySource === 'timeout') {
          this.readySource = 'state';
          this.releaseHeldRpcs();
        }
        if (isRecord(message.payload)) {
          // The bundle sends the merged `extendEditorState` of its bridges.
          this.setState(message.payload as S);
        }
        return;
      case PROTOCOL_TYPES.DocumentHeight:
        if (
          typeof message.payload === 'number' &&
          Number.isFinite(message.payload)
        ) {
          this.height.set(message.payload);
          this.scheduleContainerEcho();
        }
        return;
      case PROTOCOL_TYPES.BootError:
        warn('The editor web bundle reported a boot error.', message.payload);
        return;
      default: {
        const reply = readRpcReply(message);
        if (reply && !this.rpcs.resolve(reply.messageId, reply.content)) {
          unmatchedReplies.emit(reply);
        }
      }
    }
  }

  private onEditorReady(payload: unknown): void {
    if (this.remountPending) return;
    const capabilities = capabilitiesFromEditorReady(payload);
    if (this.isReady()) {
      // After the timeout fallback, a 1.1 runtime buffered what was flushed
      // and hands it to the editor before this handshake; only a legacy
      // bundle, whose listener did not exist yet, lost it.
      const buffered = this.readySource === 'timeout' && !capabilities.legacy;
      if (this.readySource !== 'state' && !buffered) {
        // A second handshake means the page restarted, and a legacy one
        // after the timeout fallback that the fallback reached no listener.
        this.reset();
      } else {
        // The handshake upgrades a bundle that is already being talked to.
        this.capabilities = capabilities;
        this.readySource = 'handshake';
        this.injector
          .scriptsForReady()
          .forEach((js) => this.transport.inject(js));
        this.postContainerHeight();
        this.releaseHeldRpcs();
        return;
      }
    }
    this.capabilities = capabilities;
    if (capabilities.legacy) {
      // 1.0 bundles post `editor-ready` from `onCreate`, before the effect
      // that attaches their message listener has run.
      this.clearReadyTimer();
      this.readyTimer = setTimeout(() => {
        this.readyTimer = undefined;
        this.becomeReady('handshake');
      }, 0);
    } else {
      this.becomeReady('handshake');
    }
  }

  private becomeReady(source: ReadySource): void {
    if (
      this.remountPending ||
      this.isReady() ||
      this.transport.getWebView() === null
    ) {
      return;
    }
    this.clearReadyTimer();
    this.readySource = source;
    this.phase = 'ready';

    this.injector.scriptsForReady().forEach((js) => this.transport.inject(js));
    this.postContainerHeight();
    this.outbox.drain().forEach((entry) => this.deliver(entry));

    this.ready.set(true);
    this.state.set({ ...this.state.get(), isReady: true });
    this.options.onReady?.();
  }

  /** Ready with a WebView attached. */
  private canPost(): boolean {
    return this.isReady() && this.transport.getWebView() !== null;
  }

  /** Every ready re-applies it; a detached ready page gets it on re-attach. */
  private injectPersistent(js: string): void {
    if (this.canPost()) this.transport.inject(js);
    else if (this.isReady()) this.outbox.push({ kind: 'script', js });
  }

  /** Delivers what was queued while a ready page had no WebView attached. */
  private flush(): void {
    this.postContainerHeight();
    this.outbox.drain().forEach((entry) => this.deliver(entry));
  }

  /** Back to `loading`; when the page was ready, re-queue what it held. */
  private reset(): void {
    this.clearReadyTimer();
    this.capabilities = LEGACY_CAPABILITIES;
    this.readySource = undefined;
    // Still pending in the registry, so they are re-queued below.
    this.heldRpcs = [];
    if (!this.isReady()) return;
    this.phase = 'loading';

    // Queued while detached; the replay below covers RPCs and coalesced
    // commands.
    const detached = this.outbox
      .drain()
      .filter(
        (entry) =>
          entry.kind === 'script' ||
          (entry.kind === 'message' && entry.coalesceKey === undefined)
      );
    if (this.lastContent) {
      this.outbox.push({ kind: 'message', message: this.lastContent });
    }
    this.coalesced.forEach((message, coalesceKey) =>
      this.outbox.push({ kind: 'message', message, coalesceKey })
    );
    this.rpcs
      .ids()
      .forEach((messageId) => this.outbox.push({ kind: 'rpc', messageId }));
    detached.forEach((entry) => this.outbox.push(entry));

    this.ready.set(false);
    this.state.set({ ...this.state.get(), isReady: false });
  }

  private armLegacyFallback(): void {
    if (this.isReady() || this.readyTimer !== undefined) {
      return;
    }
    this.readyTimer = setTimeout(() => {
      this.readyTimer = undefined;
      this.becomeReady('timeout');
    }, LEGACY_READY_TIMEOUT_MS);
  }

  private clearReadyTimer(): void {
    clearTimeout(this.readyTimer);
    this.readyTimer = undefined;
  }

  private deliver(entry: OutboxEntry): void {
    switch (entry.kind) {
      case 'message':
        this.transport.post(entry.message);
        return;
      case 'script':
        this.transport.inject(entry.js);
        return;
      case 'rpc':
        this.postRpc(entry.messageId);
    }
  }

  private postRpc(messageId: string): void {
    const pending = this.rpcs.get(messageId);
    if (!pending) return;
    if (
      pending.capability !== undefined &&
      !this.supports(pending.capability)
    ) {
      if (this.readySource === 'timeout') {
        this.heldRpcs.push(messageId);
        return;
      }
      this.rpcs.reject(
        messageId,
        new TentapUnsupportedError(pending.capability)
      );
      return;
    }
    this.transport.post(pending.request);
  }

  /** Posts or rejects the held RPCs once the bundle's capabilities are known. */
  private releaseHeldRpcs(): void {
    const held = this.heldRpcs;
    this.heldRpcs = [];
    held.forEach((messageId) => this.postRpc(messageId));
  }

  /**
   * A WebView clamped by its parent does not lay out again when it is given a
   * larger height, so the web side would never learn that it stopped
   * following. Re-post the height once a new content height had time to
   * apply, unless a layout already reported it (#323).
   */
  private scheduleContainerEcho(): void {
    if (this.containerHeight === undefined) return;
    this.clearContainerEcho();
    this.containerEchoTimer = setTimeout(() => {
      this.containerEchoTimer = undefined;
      if (this.isReady()) this.postContainerHeight();
    }, CONTAINER_ECHO_DELAY_MS);
  }

  private clearContainerEcho(): void {
    clearTimeout(this.containerEchoTimer);
    this.containerEchoTimer = undefined;
  }

  private postContainerHeight(): void {
    if (
      this.containerHeight === undefined ||
      !this.supports(CAPABILITIES.ContainerHeight)
    ) {
      return;
    }
    this.transport.post({
      type: PROTOCOL_TYPES.ContainerHeight,
      payload: this.containerHeight,
    });
  }

  private onOutboxDrop(entry: OutboxEntry): void {
    if (this.overflowWarned) return;
    this.overflowWarned = true;
    warn(
      'The editor has not become ready and its outbox is full; the oldest queued commands are being dropped.',
      entry
    );
  }
}

export function createEditorController<S extends object>(
  options: EditorControllerOptions<S>
): NativeEditorController<S> {
  return new NativeEditorController(options);
}

/** The sixth `extendEditorInstance` argument for one controller. */
export function createBridgeContext<S extends object>(
  controller: NativeEditorController<S>
): BridgeContext<S> {
  return {
    platform: controller.platform,
    editorId: controller.editorId,
    send: (message, options) => controller.send(message, options),
    rpc: (message, options) => controller.rpc(message, options),
    getState: () => controller.getState(),
    setState: (state) => controller.setState(state),
    supports: (capability) => controller.supports(capability),
    getCapabilities: () => controller.getCapabilities(),
    subscribeMessage: (type, listener) =>
      controller.subscribeMessage(type, listener),
    injectJS: (js) => controller.injectJS(js),
    getWebView: () => controller.getWebView(),
  };
}

// Attached controllers, most recently attached last. Backs the deprecated
// `asyncMessages` shim, which has no editor of its own.
const attachedControllers: EditorController<object>[] = [];
const released = createEmitter<EditorController<object>>();
const unmatchedReplies = createEmitter<RpcReplyPayload>();

function registerAttached(controller: EditorController<object>): void {
  const index = attachedControllers.indexOf(controller);
  if (index !== -1) attachedControllers.splice(index, 1);
  attachedControllers.push(controller);
}

function unregisterAttached(controller: EditorController<object>): void {
  const index = attachedControllers.indexOf(controller);
  if (index === -1) return;
  attachedControllers.splice(index, 1);
  released.emit(controller);
}

export function getLastAttachedController():
  EditorController<object> | undefined {
  return attachedControllers[attachedControllers.length - 1];
}

/**
 * Called with replies no controller sent the request for, such as those of
 * the deprecated `asyncMessages`.
 */
export function subscribeUnmatchedReplies(
  listener: Listener<RpcReplyPayload>
): Unsubscribe {
  return unmatchedReplies.subscribe(listener);
}

/** Called when a controller is detached. */
export function subscribeControllerReleased(
  listener: Listener<EditorController<object>>
): Unsubscribe {
  return released.subscribe(listener);
}
