import type { Editor } from './useEditor';

class _EditorHelper {
  editorLastInstance: Editor | undefined;
  constructor() {
    this.editorLastInstance = undefined;
  }

  setEditorLastInstance(editorLastInstance: Editor) {
    this.editorLastInstance = editorLastInstance;
  }
}

export const EditorHelper = new _EditorHelper();
