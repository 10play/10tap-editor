import type { WebViewHandle } from '../shared/contracts';
import {
  createActionEnvelope,
  createSequence,
  encodeMessage,
  type BridgeMessage,
} from '../shared/protocol';

/** Soft limit for queued commands and scripts while the editor is not ready. */
export const OUTBOX_LIMIT = 500;

export type OutboxEntry =
  | { kind: 'message'; message: BridgeMessage; coalesceKey?: string }
  | { kind: 'script'; js: string }
  | { kind: 'rpc'; messageId: string };

/** Commands carrying document content (`set-content`, `insert-content`, …). */
const carriesContent = (message: BridgeMessage): boolean =>
  typeof message.payload === 'object' &&
  message.payload !== null &&
  'content' in message.payload;

/**
 * Only fire-and-forget entries may be dropped on overflow: RPCs and content
 * commands never are, so a long outage can neither hang a promise nor lose
 * a document.
 */
const isDroppable = (entry: OutboxEntry): boolean =>
  entry.kind === 'script' ||
  (entry.kind === 'message' && !carriesContent(entry.message));

/**
 * Ordered queue of what was sent while the editor was not ready. An entry
 * with a coalesce key replaces the queued entry with the same key and moves
 * to the end, so `setEditable(false); setContent(x); setEditable(true)`
 * leaves `setContent(x); setEditable(true)`.
 */
export class Outbox {
  private entries: OutboxEntry[] = [];

  constructor(
    private readonly limit: number = OUTBOX_LIMIT,
    private readonly onDrop?: (entry: OutboxEntry) => void
  ) {}

  get size(): number {
    return this.entries.length;
  }

  push(entry: OutboxEntry): void {
    if (entry.kind === 'message' && entry.coalesceKey !== undefined) {
      const key = entry.coalesceKey;
      this.entries = this.entries.filter(
        (queued) => queued.kind !== 'message' || queued.coalesceKey !== key
      );
    }
    this.entries.push(entry);
    if (this.entries.length > this.limit) {
      const index = this.entries.findIndex(isDroppable);
      if (index !== -1) {
        const [dropped] = this.entries.splice(index, 1);
        if (dropped) this.onDrop?.(dropped);
      }
    }
  }

  /** Removes and returns every entry, oldest first. */
  drain(): OutboxEntry[] {
    const drained = this.entries;
    this.entries = [];
    return drained;
  }
}

/**
 * Posts to the current WebView. Every envelope gets a unique
 * `<editorId>.<n>` id (legacy bundles dedupe Android double delivery on it,
 * RNW #3305) and the editor id (#318). RPC message ids come from the same
 * sequence.
 */
export class Transport {
  private webView: WebViewHandle | null = null;
  private readonly sequence: { next(): string };

  constructor(private readonly editorId: string) {
    this.sequence = createSequence(editorId);
  }

  nextId(): string {
    return this.sequence.next();
  }

  getWebView(): WebViewHandle | null {
    return this.webView;
  }

  /** Returns whether the handle changed. */
  setWebView(handle: WebViewHandle | null): boolean {
    if (handle === this.webView) return false;
    this.webView = handle;
    return true;
  }

  post(message: BridgeMessage): void {
    const envelope = createActionEnvelope(message, {
      id: this.sequence.next(),
      editorId: this.editorId,
    });
    this.webView?.postMessage(encodeMessage(envelope));
  }

  inject(js: string): void {
    this.webView?.injectJavaScript(js);
  }
}
