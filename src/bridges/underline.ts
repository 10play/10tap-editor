import Underline from '@tiptap/extension-underline';
import {
  createToggleBridge,
  type ToggleInstance,
  type ToggleState,
} from './factories';

type UnderlineEditorState = ToggleState<'Underline'>;

type UnderlineEditorInstance = ToggleInstance<'Underline'>;

declare module '../types/EditorBridge' {
  interface BridgeState extends UnderlineEditorState {}
  interface EditorBridge extends UnderlineEditorInstance {}
}

export enum UnderlineEditorActionType {
  ToggleUnderline = 'toggle-underline',
}

export const UnderlineBridge = createToggleBridge({
  label: 'Underline',
  type: UnderlineEditorActionType.ToggleUnderline,
  tiptapExtension: Underline,
  activeName: 'underline',
  toggle: (chain) => chain.toggleUnderline(),
});
