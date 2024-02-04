import { useEffect, useState } from 'react';
import type { EditorInstance } from '../types';

export const useEditorState = (editor: EditorInstance) => {
  const [editorState, setEditorState] = useState(editor.getEditorState());

  useEffect(() => {
    const unsubscribe = editor._subscribeToEditorStateUpdate(setEditorState);
    return unsubscribe;
  }, [editor]);

  return editorState;
};
