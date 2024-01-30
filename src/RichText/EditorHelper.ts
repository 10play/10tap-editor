import type { EditorInstance } from '../types';

class _EditorHelper {
  editorLastInstance: EditorInstance | undefined;
  constructor() {
    this.editorLastInstance = undefined;
  }

  setEditorLastInstance(editorLastInstance: EditorInstance) {
    this.editorLastInstance = editorLastInstance;
  }
}

export const EditorHelper = new _EditorHelper();
