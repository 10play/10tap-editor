import { ListItem } from '@tiptap/extension-list';
import BridgeExtension from './base';

type ListItemEditorState = {
  canLift: boolean;
  canSink: boolean;
};

type ListItemEditorInstance = {
  lift: () => void;
  sink: () => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends ListItemEditorState {}
  interface EditorBridge extends ListItemEditorInstance {}
}

export enum ListItemEditorActionType {
  Lift = 'lift',
  Sink = 'sink',
}

// Actions with no payload
type ToggleActionTypes =
  ListItemEditorActionType.Lift | ListItemEditorActionType.Sink;

export interface ListItemMessage {
  type: ToggleActionTypes;
  payload?: undefined;
}

export const ListItemBridge = new BridgeExtension<
  ListItemEditorState,
  ListItemEditorInstance,
  ListItemMessage
>({
  tiptapExtension: ListItem,
  onBridgeMessage: (editor, message) => {
    switch (message.type) {
      case ListItemEditorActionType.Lift:
        editor.chain().focus().liftListItem(ListItem.name).run();
        break;
      case ListItemEditorActionType.Sink:
        editor.chain().focus().sinkListItem(ListItem.name).run();
        break;
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => ({
    lift: () => sendBridgeMessage({ type: ListItemEditorActionType.Lift }),
    sink: () => sendBridgeMessage({ type: ListItemEditorActionType.Sink }),
  }),
  extendEditorState: (editor) => ({
    canLift: editor.can().liftListItem(ListItem.name),
    canSink: editor.can().sinkListItem(ListItem.name),
  }),
});
