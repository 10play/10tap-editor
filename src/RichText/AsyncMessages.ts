import type { EditorController } from '../shared/contracts';
import {
  createSequence,
  withMessageId,
  type BridgeMessage,
} from '../shared/protocol';
import {
  getLastAttachedController,
  subscribeControllerReleased,
} from '../native/EditorController';

type Callback = (value: unknown) => void;
/** Method syntax keeps parameters bivariant, so typed bridge senders fit. */
type MessageSender = { send(message: BridgeMessage): void }['send'];

/**
 * @deprecated Kept for custom bridges written against 1.0. Use the
 * `BridgeContext` passed as the sixth `extendEditorInstance` argument:
 * `context.rpc(message)` resolves replies by `messageId` on its own.
 *
 * Requests still go through the given per-editor sender, and replies still
 * arrive through `onMessage`. Unlike 1.0, callbacks are removed once called
 * (#346), and requests are dropped when the editor that was attached last at
 * request time detaches, so an unanswered request cannot pin memory forever.
 */
class AsyncMessages {
  subscriptions: { [key: string]: Callback[] } = {};
  private readonly sequence = createSequence('tentap-async');
  private readonly owners = new Map<string, EditorController<object>>();

  constructor() {
    subscribeControllerReleased((controller) => {
      this.owners.forEach((owner, id) => {
        if (owner !== controller) return;
        this.owners.delete(id);
        delete this.subscriptions[id];
      });
    });
  }

  onMessage(id: string, value: unknown) {
    const callbacks = this.subscriptions[id];
    if (!callbacks) return;
    delete this.subscriptions[id];
    this.owners.delete(id);
    callbacks.forEach((callback) => callback(value));
  }

  addListener(key: string, callback: Callback) {
    (this.subscriptions[key] ??= []).push(callback);
  }

  sendAsyncMessage<T>(message: BridgeMessage, postMessage: MessageSender) {
    const messageId = this.sequence.next();
    const owner = getLastAttachedController();
    return new Promise<T>((resolve) => {
      this.addListener(messageId, resolve as Callback);
      if (owner) this.owners.set(messageId, owner);
      postMessage(withMessageId(message, messageId));
    });
  }
}

export const asyncMessages = new AsyncMessages();
