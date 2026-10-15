import Blockquote from '@tiptap/extension-blockquote';
import {
  createToggleBridge,
  type ToggleInstance,
  type ToggleState,
} from './factories';

type BlockquoteEditorState = ToggleState<'Blockquote'>;

type BlockquoteEditorInstance = ToggleInstance<'Blockquote'>;

declare module '../types/EditorBridge' {
  interface BridgeState extends BlockquoteEditorState {}
  interface EditorBridge extends BlockquoteEditorInstance {}
}

export enum BlockquoteEditorActionType {
  ToggleBlockquote = 'toggle-blockquote',
}

export const BlockquoteBridge = createToggleBridge({
  label: 'Blockquote',
  type: BlockquoteEditorActionType.ToggleBlockquote,
  tiptapExtension: Blockquote,
  activeName: 'blockquote',
  toggle: (chain) => chain.toggleBlockquote(),
  extendCSS: `
    blockquote {
        border-left: 3px solid #0d0d0d1a;
        padding-left: 1rem;
    }
  `,
});
