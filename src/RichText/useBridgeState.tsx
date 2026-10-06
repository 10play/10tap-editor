import { useMemo, useSyncExternalStore } from 'react';
import type { BridgeState, EditorBridge } from '../types';

/**
 * Follows the states the subscription delivers, as 1.0 did, so
 * `getEditorState()` may return a new object on every call.
 */
const createStateStore = (editor: EditorBridge) => {
  let state = editor.getEditorState();
  return {
    subscribe(onChange: () => void) {
      const unsubscribe = editor._subscribeToEditorStateUpdate((next) => {
        state = next;
        onChange();
      });
      // Catch up with updates published between render and subscribe.
      const latest = editor.getEditorState();
      if (latest !== state) {
        state = latest;
        onChange();
      }
      return unsubscribe;
    },
    getSnapshot: () => state,
  };
};

export const useBridgeState = (editor: EditorBridge): BridgeState => {
  const store = useMemo(() => createStateStore(editor), [editor]);
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
};
