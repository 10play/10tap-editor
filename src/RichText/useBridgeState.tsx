import { useEffect, useState } from 'react';
import type { EditorBridge } from '../types';

export const useBridgeState = (editor: EditorBridge) => {
  const [editorState, setEditorState] = useState(editor.getEditorState());

  useEffect(() => {
    const unsubscribe = editor._subscribeToEditorStateUpdate(setEditorState);
    return unsubscribe;
  }, [editor]);

  return editorState;
};
