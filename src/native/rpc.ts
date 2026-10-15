import type { CapabilityName } from '../shared/capabilities';
import { TentapRpcTimeoutError } from '../shared/errors';
import { withMessageId, type BridgeMessage } from '../shared/protocol';

interface PendingRpc {
  /** The request as sent, with `payload.messageId` set. */
  request: BridgeMessage;
  capability?: CapabilityName;
  timeoutMs?: number;
  resolve(content: unknown): void;
  reject(error: Error): void;
  timer?: ReturnType<typeof setTimeout>;
}

/**
 * Pending requests of one controller, keyed by `messageId` (#346). Entries
 * are deleted as soon as they settle.
 */
export class RpcRegistry {
  private readonly pending = new Map<string, PendingRpc>();

  get size(): number {
    return this.pending.size;
  }

  create<T>(
    messageId: string,
    message: BridgeMessage,
    options: { capability?: CapabilityName; timeoutMs?: number } = {}
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const entry: PendingRpc = {
        request: withMessageId(message, messageId),
        capability: options.capability,
        timeoutMs: options.timeoutMs,
        resolve: resolve as (content: unknown) => void,
        reject,
      };
      this.pending.set(messageId, entry);
      this.startTimer(messageId, entry);
    });
  }

  get(messageId: string): Readonly<PendingRpc> | undefined {
    return this.pending.get(messageId);
  }

  /** Message ids of every pending request, oldest first. */
  ids(): string[] {
    return Array.from(this.pending.keys());
  }

  /** Returns false when `messageId` is not pending (late or foreign reply). */
  resolve(messageId: string, content: unknown): boolean {
    const entry = this.take(messageId);
    entry?.resolve(content);
    return entry !== undefined;
  }

  reject(messageId: string, error: Error): boolean {
    const entry = this.take(messageId);
    entry?.reject(error);
    return entry !== undefined;
  }

  private startTimer(messageId: string, entry: PendingRpc): void {
    const { timeoutMs } = entry;
    if (timeoutMs === undefined || !Number.isFinite(timeoutMs)) return;
    entry.timer = setTimeout(() => {
      this.reject(
        messageId,
        new TentapRpcTimeoutError(entry.request.type, timeoutMs)
      );
    }, timeoutMs);
  }

  private take(messageId: string): PendingRpc | undefined {
    const entry = this.pending.get(messageId);
    if (!entry) return undefined;
    clearTimeout(entry.timer);
    this.pending.delete(messageId);
    return entry;
  }
}
