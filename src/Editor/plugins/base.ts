import { Editor, Extension } from '@tiptap/core';

class TenTapBridge<T, E, M> {
  name: string;
  tiptapExtension: Extension;
  onBridgeMessage: (editor: Editor, message: M) => boolean;
  extendEditorState: (editor: Editor) => T;
  extendEditorInstance: (sendPluginMessage: (message: M) => void) => E;

  constructor({
    tiptapExtension,
    onBridgeMessage,
    extendEditorState,
    extendEditorInstance,
  }: {
    tiptapExtension: any;
    onBridgeMessage: (editor: Editor, message: M) => boolean;
    extendEditorState: (editor: Editor) => T;
    extendEditorInstance: (sendPluginMessage: (message: M) => void) => E;
  }) {
    this.name = tiptapExtension.name;
    this.tiptapExtension = tiptapExtension;
    this.onBridgeMessage = onBridgeMessage;
    this.extendEditorState = extendEditorState;
    this.extendEditorInstance = extendEditorInstance;
  }
}
export default TenTapBridge;
