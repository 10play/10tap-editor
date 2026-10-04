import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import { LEGACY_CAPABILITIES } from '../shared/capabilities';
import type { BridgeContext } from '../shared/contracts';
import type { RuntimePlatform } from '../shared/bootConfig';
import {
  createEditorId,
  createSequence,
  readRpcReply,
  withMessageId,
  type BridgeMessage,
} from '../shared/protocol';
import type { BridgeState } from '../types';

/**
 * Replies to RPCs sent through a fallback context. 1.1 hosts resolve replies
 * in the EditorController; this map only serves hosts that call
 * `extendEditorInstance` with the 1.0 positional arguments.
 */
const pendingReplies = new Map<string, (content: unknown) => void>();
let replyIds: { next(): string } | undefined;

const nextReplyId = () => {
  replyIds ??= createSequence(createEditorId());
  return replyIds.next();
};

/** Resolves a fallback RPC. Returns false for replies it did not send. */
export function resolveFallbackReply(message: BridgeMessage): boolean {
  const reply = readRpcReply(message);
  const resolve = reply && pendingReplies.get(reply.messageId);
  if (!reply || !resolve) return false;
  pendingReplies.delete(reply.messageId);
  resolve(reply.content);
  return true;
}

/**
 * The `BridgeContext` passed to `extendEditorInstance`, or, for hosts that
 * only pass the 1.0 positional arguments, an equivalent built from them.
 * The fallback posts immediately, never coalesces and reports a legacy
 * bundle, which is exactly what a 1.0 host did.
 */
export function resolveBridgeContext<M>(
  sendBridgeMessage: (message: M) => void,
  webviewRef: RefObject<WebView> | undefined,
  editorState: RefObject<BridgeState | {}> | undefined,
  setEditorState: ((state: BridgeState) => void) | undefined,
  platform: string | undefined,
  context: BridgeContext<BridgeState> | undefined
): BridgeContext<BridgeState> {
  if (context) return context;
  return {
    platform: (platform ?? 'ios') as RuntimePlatform,
    editorId: '',
    // The fallback forwards whatever the bridge sends, as a 1.0 host did.
    send: (message) => sendBridgeMessage(message as M),
    rpc: <R>(message: BridgeMessage) =>
      new Promise<R>((resolve) => {
        const messageId = nextReplyId();
        pendingReplies.set(messageId, (content) => resolve(content as R));
        sendBridgeMessage(withMessageId(message, messageId) as M);
      }),
    getState: () => (editorState?.current ?? {}) as BridgeState,
    setState: (state) => setEditorState?.(state),
    supports: () => false,
    getCapabilities: () => LEGACY_CAPABILITIES,
    subscribeMessage: () => () => {},
    getWebView: () => webviewRef?.current ?? null,
  };
}
