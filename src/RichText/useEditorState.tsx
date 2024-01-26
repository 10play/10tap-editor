import { useEffect, useState } from 'react';
import { type Editor } from './useEditor';

export const useEditorState = (editor: Editor) => {
  const [editorState, setEditorState] = useState(editor.getEditorState());

  useEffect(() => {
    const unsubscribe = editor._subscribeToEditorStateUpdate(setEditorState);
    return unsubscribe;
  }, [editor]);

  return editorState;
};
