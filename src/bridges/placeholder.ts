import Placeholder from '@tiptap/extension-placeholder';
import BridgeExtension from './base';

type PlaceholderEditorState = {};

type PlaceholderEditorInstance = {};

declare module '../types/EditorBridge' {
  interface BridgeState extends PlaceholderEditorState {}
  interface EditorBridge extends PlaceholderEditorInstance {}
}

export const PlaceholderBridge = new BridgeExtension<
  PlaceholderEditorState,
  PlaceholderEditorInstance
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
});
