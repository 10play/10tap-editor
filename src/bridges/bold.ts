import Bold from '@tiptap/extension-bold';
import {
  createToggleBridge,
  type ToggleInstance,
  type ToggleState,
} from './factories';

type BoldEditorState = ToggleState<'Bold'>;

type BoldEditorInstance = ToggleInstance<'Bold'>;

declare module '../types/EditorBridge' {
  interface BridgeState extends BoldEditorState {}
  interface EditorBridge extends BoldEditorInstance {}
}

export enum BoldEditorActionType {
  ToggleBold = 'toggle-bold',
}

export const BoldBridge = createToggleBridge({
  label: 'Bold',
  type: BoldEditorActionType.ToggleBold,
  tiptapExtension: Bold,
  activeName: 'bold',
  toggle: (chain) => chain.toggleBold(),
});
