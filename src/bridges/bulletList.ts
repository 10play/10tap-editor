import { BulletList, ListItem } from '@tiptap/extension-list';
import {
  createToggleBridge,
  type ToggleInstance,
  type ToggleState,
} from './factories';

type BulletListEditorState = ToggleState<'BulletList'>;

type BulletListEditorInstance = ToggleInstance<'BulletList'>;

declare module '../types/EditorBridge' {
  interface BridgeState extends BulletListEditorState {}
  interface EditorBridge extends BulletListEditorInstance {}
}

export enum BulletListEditorActionType {
  ToggleBulletList = 'toggle-bulletList',
}

export const BulletListBridge = createToggleBridge({
  label: 'BulletList',
  type: BulletListEditorActionType.ToggleBulletList,
  tiptapExtension: BulletList,
  tiptapExtensionDeps: [ListItem],
  activeName: 'bulletList',
  toggle: (chain) => chain.toggleBulletList(),
});
