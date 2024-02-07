import Code from '@tiptap/extension-code';
import BridgeExtension from './base';

type CodeEditorState = {
  isCodeActive: boolean;
  canToggleCode: boolean;
};

type CodeEditorInstance = {
  toggleCode: () => void;
};

declare module '../types/EditorNativeState' {
  interface EditorNativeState extends CodeEditorState {}
  interface EditorBridge extends CodeEditorInstance {}
}

export enum CodeEditorActionType {
  ToggleCode = 'toggle-code',
}

type CodeMessage = {
  type: CodeEditorActionType.ToggleCode;
  payload?: undefined;
};

export const CodeBridge = new BridgeExtension<
  CodeEditorState,
  CodeEditorInstance,
  CodeMessage
>({
  tiptapExtension: Code,
  //   tiptapExtensionDeps: [CodeBlock],
  onBridgeMessage: (editor, message) => {
    if (message.type === CodeEditorActionType.ToggleCode) {
      editor.chain().focus().toggleCode().run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      toggleCode: () =>
        sendBridgeMessage({ type: CodeEditorActionType.ToggleCode }),
    };
  },
  extendEditorState: (editor) => {
    return {
      canToggleCode: editor.can().toggleCode(),
      isCodeActive: editor.isActive('code'),
    };
  },
  extendCSS: `
    code {
        background-color: #6161611a;
        border-radius: 0.25em;
        box-decoration-break: clone;
        color: #616161;
        font-size: 0.9rem;
        padding: 0.25em;
    }
  `,
});
