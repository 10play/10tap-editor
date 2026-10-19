import Italic from '@tiptap/extension-italic';
import {
  createToggleBridge,
  type ToggleInstance,
  type ToggleState,
} from './factories';

type ItalicEditorState = ToggleState<'Italic'>;

type ItalicEditorInstance = ToggleInstance<'Italic'>;

declare module '../types/EditorBridge' {
  interface BridgeState extends ItalicEditorState {}
  interface EditorBridge extends ItalicEditorInstance {}
}

export enum ItalicEditorActionType {
  ToggleItalic = 'toggle-italic',
}

export const ItalicBridge = createToggleBridge({
  label: 'Italic',
  type: ItalicEditorActionType.ToggleItalic,
  tiptapExtension: Italic,
  activeName: 'italic',
  toggle: (chain) => chain.toggleItalic(),
});
