import type { Editor } from '@tiptap/core';
import type BridgeExtension from '../bridges/base';
import { PROTOCOL_TYPES, type BridgeMessage } from '../shared/protocol';

export const DEFAULT_STATE_UPDATE_DEBOUNCE_MS = 10;

/** Merged `extendEditorState` of every bridge, later bridges winning. */
export function collectBridgeState(
  editor: Editor,
  bridges: readonly BridgeExtension[]
): Record<string, unknown> {
  return bridges.reduce<Record<string, unknown>>(
    (state, bridge) =>
      bridge.extendEditorState
        ? Object.assign(state, bridge.extendEditorState(editor))
        : state,
    {}
  );
}

export interface StatePublisher {
  /** Posts the full state now, cancelling any scheduled update. */
  publishNow(editor: Editor): void;
  /** Posts the state after `debounceMs` without further calls. */
  schedule(editor: Editor): void;
  cancel(): void;
}

/**
 * Sends `stateUpdate` messages. Scheduled updates are dropped until the first
 * `publishNow`, which the runtime calls right after `editor-ready`, so native
 * never sees state before the handshake (#343).
 */
export function createStatePublisher(
  post: (message: BridgeMessage) => void,
  getBridges: () => readonly BridgeExtension[],
  debounceMs: number = DEFAULT_STATE_UPDATE_DEBOUNCE_MS
): StatePublisher {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let started = false;

  const cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  const publishNow = (editor: Editor) => {
    cancel();
    started = true;
    if (editor.isDestroyed) return;
    post({
      type: PROTOCOL_TYPES.StateUpdate,
      payload: collectBridgeState(editor, getBridges()),
    });
  };

  return {
    publishNow,
    schedule(editor) {
      if (!started) return;
      cancel();
      timer = setTimeout(() => publishNow(editor), debounceMs);
    },
    cancel,
  };
}
