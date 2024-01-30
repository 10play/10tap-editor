import { Editor, Extension } from '@tiptap/core';

class BaseTenTapPlugin<T, E, M> {
  name: string;
  tiptapPlugin: Extension;
  onTenTapMessage: (editor: Editor, message: M) => boolean;
  extendEditorState: (editor: Editor) => T;
  extendEditor: (sendPluginMessage: (message: M) => void) => E;

  constructor({
    tiptapPlugin,
    onTenTapMessage,
    extendEditorState,
    extendEditor,
  }: {
    tiptapPlugin: any;
    onTenTapMessage: (editor: Editor, message: M) => boolean;
    extendEditorState: (editor: Editor) => T;
    extendEditor: (sendPluginMessage: (message: M) => void) => E;
  }) {
    this.name = tiptapPlugin.name;
    this.tiptapPlugin = tiptapPlugin;
    this.onTenTapMessage = onTenTapMessage;
    this.extendEditorState = extendEditorState;
    this.extendEditor = extendEditor;
  }
}
export default BaseTenTapPlugin;
