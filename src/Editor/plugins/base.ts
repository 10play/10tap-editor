import { Editor, type AnyExtension } from '@tiptap/core';

interface TenTapBridge<T, E, M> {
  name: string;
  tiptapExtension?: AnyExtension | AnyExtension[];
  onBridgeMessage: (
    editor: Editor,
    message: M,
    sendMessageBack: (message: M) => void
  ) => boolean;
  onEditorMessage?: (message: M) => boolean;
  extendEditorState: (editor: Editor) => T;
  extendEditorInstance: (sendBridgeMessage: (message: M) => void) => E;
  extendCSS?: string | undefined;
}

type CreateTenTapBridgeArgs<T, E, M> = Omit<
  TenTapBridge<T, E, M> & { forceName?: string },
  'name'
>;

class TenTapBridge<T, E, M> {
  constructor({
    forceName,
    tiptapExtension,
    onBridgeMessage,
    onEditorMessage,
    extendEditorState,
    extendEditorInstance,
    extendCSS,
  }: CreateTenTapBridgeArgs<T, E, M>) {
    if (!tiptapExtension) {
      this.name = forceName || 'TenTapBridge';
    } else {
      this.name = Array.isArray(tiptapExtension)
        ? tiptapExtension.map((e) => e.name).join('+')
        : tiptapExtension.name;
    }

    this.tiptapExtension = tiptapExtension;
    this.onBridgeMessage = onBridgeMessage;
    this.onEditorMessage = onEditorMessage;
    this.extendEditorState = extendEditorState;
    this.extendEditorInstance = extendEditorInstance;
    this.extendCSS = extendCSS;
  }
}
export default TenTapBridge;
