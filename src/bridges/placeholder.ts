import Placeholder from '@tiptap/extension-placeholder';
import BridgeExtension from './base';

type PlaceholderEditorState = {};

type PlaceholderEditorInstance = {
  setPlaceholder: (newPlaceholder: string) => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends PlaceholderEditorState {}
  interface EditorBridge extends PlaceholderEditorInstance {}
}

export enum PlaceholderEditorActionType {
  setPlaceholder = 'set-placeholder',
}

export interface PlaceholderMessage {
  type: PlaceholderEditorActionType.setPlaceholder;
  payload: string;
}

export const PlaceholderBridge = new BridgeExtension<
  PlaceholderEditorState,
  PlaceholderEditorInstance,
  PlaceholderMessage
>({
  tiptapExtension: Placeholder,
  extendCSS: `
    .is-editor-empty:first-child::before {
        color: #adb5bd;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
    }
  `,
  onBridgeMessage: (editor, message) => {
    switch (message.type) {
      case PlaceholderEditorActionType.setPlaceholder:
        const currentExtensions = editor.extensionManager.extensions;
        currentExtensions.forEach((extension) => {
          if (extension.name === 'placeholder') {
            extension.options.placeholder = message.payload;
          }
        });

        // TODO: find better way to update the editor
        editor.setOptions();
        break;
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    const setPlaceholder = (newPlaceholder: string) =>
      sendBridgeMessage({
        type: PlaceholderEditorActionType.setPlaceholder,
        payload: newPlaceholder,
      });

    return {
      setPlaceholder,
    };
  },
});
