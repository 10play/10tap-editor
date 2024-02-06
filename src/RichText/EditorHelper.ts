import type { EditorBridge } from '../types';

class _EditorHelper {
  editorLastInstance: EditorBridge | undefined;
  constructor() {
    this.editorLastInstance = undefined;
  }

  setEditorLastInstance(editorLastInstance: EditorBridge) {
    this.editorLastInstance = editorLastInstance;
  }
}

export const EditorHelper = new _EditorHelper();
