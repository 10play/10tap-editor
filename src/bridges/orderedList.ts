import { OrderedList, ListItem } from '@tiptap/extension-list';
import {
  createToggleBridge,
  type ToggleInstance,
  type ToggleState,
} from './factories';

type OrderedListEditorState = ToggleState<'OrderedList'>;

type OrderedListEditorInstance = ToggleInstance<'OrderedList'>;

declare module '../types/EditorBridge' {
  interface BridgeState extends OrderedListEditorState {}
  interface EditorBridge extends OrderedListEditorInstance {}
}

export enum OrderedListEditorActionType {
  ToggleOrderedList = 'toggle-orderedList',
}

export const OrderedListBridge = createToggleBridge({
  label: 'OrderedList',
  type: OrderedListEditorActionType.ToggleOrderedList,
  tiptapExtension: OrderedList,
  tiptapExtensionDeps: [ListItem],
  activeName: 'orderedList',
  toggle: (chain) => chain.toggleOrderedList(),
});
