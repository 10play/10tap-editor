import {
  LEGACY_CAPABILITIES,
  createCapabilities,
  type Capabilities,
  type CapabilityName,
} from './capabilities';

/**
 * Wire protocol shared by the native side and the web runtime.
 *
 * Protocol 2 is protocol 1 plus optional fields, so 1.0.x / 0.7.x bundles and
 * custom `onMessage` handlers keep working:
 * - native → web: `{type: 'action', payload: {type, payload}, id?, editorId?}`
 * - web → native: raw `{type, payload}` plus optional `editorId` and `v`
 * - `editor-ready` carries `{protocol, capabilities, editorId}`; a bundle that
 *   sends it without a payload is a legacy bundle.
 *
 * Bridge command strings (`set-content`, `toggle-bold`, …) belong to the bridge
 * enums in `src/bridges`. Only protocol-level types are defined here.
 */

export const PROTOCOL_VERSION = 2;

/** `EditorMessageType.Action`: the only envelope type legacy bundles read. */
export const ACTION_ENVELOPE_TYPE = 'action';

export const PROTOCOL_TYPES = {
  /** web → native. Sent before the initial full `stateUpdate`. */
  EditorReady: 'editor-ready',
  /** web → native. Merged `extendEditorState` of every bridge. */
  StateUpdate: 'stateUpdate',
  /** web → native. Content height in CSS px (dynamic height). */
  DocumentHeight: 'document-height',
  /** native → web (inside an action envelope). WebView height from `onLayout`. */
  ContainerHeight: 'container-height',
  /** web → native. Diagnostics when the boot config never arrived. */
  BootError: 'boot-error',
  /** web → native. Posted by the injected press listener (custom keyboard). */
  EditorPress: 'tentap-editor-press',
} as const;

export type ProtocolType = (typeof PROTOCOL_TYPES)[keyof typeof PROTOCOL_TYPES];

/** Web runtime: post `boot-error` when no config arrived after this long. */
export const BOOT_ERROR_TIMEOUT_MS = 5000;
/** Native: treat the bundle as legacy when no handshake arrived this long after `onLoadEnd`. */
export const LEGACY_READY_TIMEOUT_MS = 1500;
/** Web runtime: number of recent envelope ids remembered to drop duplicates (RNW #3305). */
export const DEDUPE_CAPACITY = 64;

/** A bridge command or event: the inner message of every exchange. */
export interface BridgeMessage<T extends string = string, P = unknown> {
  type: T;
  payload?: P;
}

/** native → web */
export interface ActionEnvelope<M extends BridgeMessage = BridgeMessage> {
  type: typeof ACTION_ENVELOPE_TYPE;
  payload: M;
  /** Unique per message (`<editorId>.<seq>`); legacy bundles dedupe on it. */
  id?: string;
  editorId?: string;
}

/** web → native */
export interface WebMessage<
  T extends string = string,
  P = unknown,
> extends BridgeMessage<T, P> {
  editorId?: string;
  v?: number;
}

export interface EditorReadyPayload {
  protocol: number;
  capabilities: CapabilityName[];
  editorId: string;
}

export type BootErrorReason = 'config-missing' | 'exception';

export interface BootErrorPayload {
  reason: BootErrorReason;
  elapsedMs: number;
  /** Whether the 1.0 globals (`window.contentInjected`, …) were present. */
  legacyGlobals: boolean;
  message?: string;
}

export interface ProtocolPayloads {
  [PROTOCOL_TYPES.EditorReady]: EditorReadyPayload | undefined;
  [PROTOCOL_TYPES.StateUpdate]: Record<string, unknown>;
  [PROTOCOL_TYPES.DocumentHeight]: number;
  [PROTOCOL_TYPES.ContainerHeight]: number;
  [PROTOCOL_TYPES.BootError]: BootErrorPayload;
  [PROTOCOL_TYPES.EditorPress]: undefined;
}

export type ProtocolMessage<T extends ProtocolType = ProtocolType> = {
  [K in T]: WebMessage<K, ProtocolPayloads[K]>;
}[T];

/** Reply to an RPC request: `send-*-back` messages carry this payload. */
export interface RpcReplyPayload<C = unknown> {
  messageId: string;
  content: C;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBridgeMessage = (value: unknown): value is BridgeMessage =>
  isRecord(value) && typeof value.type === 'string';

const parse = (data: unknown): unknown => {
  if (typeof data !== 'string') return undefined;
  try {
    return JSON.parse(data);
  } catch {
    return undefined;
  }
};

/** A random id that is safe in JSON, HTML attributes and CSS selectors. */
export function createEditorId(): string {
  const random = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `tt${Date.now().toString(36)}${random}`;
}

/** Monotonic ids (`<editorId>.<n>`) used for envelope ids and RPC message ids. */
export function createSequence(editorId: string): { next(): string } {
  let seq = 0;
  return {
    next: () => `${editorId}.${++seq}`,
  };
}

export function encodeMessage(
  message: ActionEnvelope | WebMessage | BridgeMessage
): string {
  return JSON.stringify(message);
}

export function createActionEnvelope<M extends BridgeMessage>(
  payload: M,
  options: { id?: string; editorId?: string } = {}
): ActionEnvelope<M> {
  const envelope: ActionEnvelope<M> = {
    type: ACTION_ENVELOPE_TYPE,
    payload,
  };
  if (options.id !== undefined) envelope.id = options.id;
  if (options.editorId !== undefined) envelope.editorId = options.editorId;
  return envelope;
}

/**
 * Parses data received by the web runtime. Returns null for anything that is
 * not a JSON string encoding an action envelope around a bridge message.
 */
export function decodeActionEnvelope(data: unknown): ActionEnvelope | null {
  const value = parse(data);
  if (
    !isRecord(value) ||
    value.type !== ACTION_ENVELOPE_TYPE ||
    !isBridgeMessage(value.payload)
  ) {
    return null;
  }
  return createActionEnvelope(value.payload, {
    id: typeof value.id === 'string' ? value.id : undefined,
    editorId: typeof value.editorId === 'string' ? value.editorId : undefined,
  });
}

export function createWebMessage<T extends string, P>(
  type: T,
  payload: P,
  editorId?: string
): WebMessage<T, P> {
  const message: WebMessage<T, P> = { type, payload };
  if (editorId !== undefined) {
    message.editorId = editorId;
    message.v = PROTOCOL_VERSION;
  }
  return message;
}

/**
 * Parses data received by native (`event.nativeEvent.data`). Returns null for
 * non-strings, invalid JSON and values without a string `type`.
 */
export function decodeWebMessage(data: unknown): WebMessage | null {
  const value = parse(data);
  if (!isRecord(value) || typeof value.type !== 'string') return null;
  const message: WebMessage = { type: value.type, payload: value.payload };
  if (typeof value.editorId === 'string') message.editorId = value.editorId;
  if (typeof value.v === 'number') message.v = value.v;
  return message;
}

/**
 * Whether a message tagged with `messageEditorId` belongs to `editorId`.
 * Untagged messages come from legacy peers and are always accepted (#318).
 */
export function isForEditor(
  messageEditorId: string | undefined,
  editorId: string
): boolean {
  return messageEditorId === undefined || messageEditorId === editorId;
}

export function isProtocolMessage<T extends ProtocolType>(
  message: BridgeMessage,
  type: T
): message is ProtocolMessage<T> {
  return message.type === type;
}

export function createEditorReadyPayload(
  editorId: string,
  capabilities: readonly CapabilityName[]
): EditorReadyPayload {
  return {
    protocol: PROTOCOL_VERSION,
    capabilities: [...capabilities],
    editorId,
  };
}

/** Returns null for a legacy `editor-ready` (no or unrecognised payload). */
export function parseEditorReadyPayload(
  payload: unknown
): EditorReadyPayload | null {
  if (
    !isRecord(payload) ||
    typeof payload.protocol !== 'number' ||
    payload.protocol < PROTOCOL_VERSION ||
    typeof payload.editorId !== 'string' ||
    !Array.isArray(payload.capabilities)
  ) {
    return null;
  }
  return {
    protocol: payload.protocol,
    editorId: payload.editorId,
    capabilities: payload.capabilities.filter(
      (name): name is string => typeof name === 'string'
    ),
  };
}

export function capabilitiesFromEditorReady(payload: unknown): Capabilities {
  const ready = parseEditorReadyPayload(payload);
  return ready
    ? createCapabilities(ready.protocol, ready.capabilities)
    : LEGACY_CAPABILITIES;
}

/**
 * Returns a copy of an RPC request with `payload.messageId` set. Object
 * payloads keep their fields; any other payload is replaced. The input is
 * never mutated.
 */
export function withMessageId<M extends BridgeMessage>(
  message: M,
  messageId: string
): M & { payload: { messageId: string } } {
  const fields = isRecord(message.payload) ? message.payload : {};
  return { ...message, payload: { ...fields, messageId } };
}

/** Reads the `{messageId, content}` of an RPC reply, or null. */
export function readRpcReply(message: BridgeMessage): RpcReplyPayload | null {
  const { payload } = message;
  if (!isRecord(payload) || typeof payload.messageId !== 'string') {
    return null;
  }
  return { messageId: payload.messageId, content: payload.content };
}

/**
 * Remembers the last `capacity` ids. `seen(id)` returns true when `id` was
 * already recorded and records it otherwise.
 */
export function createDedupe(capacity: number = DEDUPE_CAPACITY): {
  seen(id: string): boolean;
} {
  const ids = new Set<string>();
  return {
    seen(id) {
      if (ids.has(id)) {
        ids.delete(id);
        ids.add(id);
        return true;
      }
      ids.add(id);
      if (ids.size > capacity) {
        const oldest = ids.values().next();
        if (!oldest.done) ids.delete(oldest.value);
      }
      return false;
    },
  };
}
