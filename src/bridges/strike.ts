import Strike from '@tiptap/extension-strike';
import {
  createToggleBridge,
  type ToggleInstance,
  type ToggleState,
} from './factories';

type StrikeEditorState = ToggleState<'Strike'>;

type StrikeEditorInstance = ToggleInstance<'Strike'>;

declare module '../types/EditorBridge' {
  interface BridgeState extends StrikeEditorState {}
  interface EditorBridge extends StrikeEditorInstance {}
}

export enum StrikeEditorActionType {
  ToggleStrike = 'toggle-strike',
}

export const StrikeBridge = createToggleBridge({
  label: 'Strike',
  type: StrikeEditorActionType.ToggleStrike,
  tiptapExtension: Strike,
  activeName: 'strike',
  toggle: (chain) => chain.toggleStrike(),
});
