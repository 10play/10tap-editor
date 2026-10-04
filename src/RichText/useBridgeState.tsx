import { useCallback, useSyncExternalStore } from 'react';
import type { BridgeState, EditorBridge } from '../types';

export const useBridgeState = (editor: EditorBridge): BridgeState => {
  const subscribe = useCallback(
    (onChange: () => void) => editor._subscribeToEditorStateUpdate(onChange),
    [editor]
  );
  const getSnapshot = useCallback(() => editor.getEditorState(), [editor]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
