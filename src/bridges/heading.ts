import Heading, { type Level } from '@tiptap/extension-heading';
import BridgeExtension from './base';

type HeadingEditorState = {
  headingLevel: number | undefined;
  canToggleHeading: boolean;
};

type HeadingEditorInstance = {
  toggleHeading: (level: Level) => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends HeadingEditorState {}
  interface EditorBridge extends HeadingEditorInstance {}
}

export enum HeadingEditorActionType {
  ToggleHeading = 'toggle-heading',
}

type HeadingMessage = {
  type: HeadingEditorActionType.ToggleHeading;
  payload: Level;
};

export const HeadingBridge = new BridgeExtension<
  HeadingEditorState,
  HeadingEditorInstance,
  HeadingMessage
>({
  tiptapExtension: Heading,
  onBridgeMessage: (editor, message) => {
    if (message.type === HeadingEditorActionType.ToggleHeading) {
      editor.chain().focus().toggleHeading({ level: message.payload }).run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      toggleHeading: (level) =>
        sendBridgeMessage({
          type: HeadingEditorActionType.ToggleHeading,
          payload: level,
        }),
    };
  },
  extendEditorState: (editor) => {
    return {
      canToggleHeading: editor.can().toggleHeading({ level: 1 }),
      headingLevel: editor.getAttributes('heading')?.level,
    };
  },
});
