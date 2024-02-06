import Placeholder from '@tiptap/extension-placeholder';
import TenTapBridge from './base';

type PlaceholderEditorState = {};

type PlaceholderEditorInstance = {};

declare module '../types/EditorNativeState' {
  interface EditorNativeState extends PlaceholderEditorState {}
  interface EditorInstance extends PlaceholderEditorInstance {}
}

export const PlaceholderBridge = new TenTapBridge<
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
