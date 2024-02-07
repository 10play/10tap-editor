import ListItem from '@tiptap/extension-list-item';
import BridgeExtension from './base';

type ListItemEditorState = {
  canLift: boolean;
  canSink: boolean;
};

type ListItemEditorInstance = {
  lift: () => void;
  sink: () => void;
};

declare module '../types/EditorNativeState' {
  interface EditorNativeState extends ListItemEditorState {}
  interface EditorBridge extends ListItemEditorInstance {}
}

export enum ListItemEditorActionType {
  Lift = 'lift',
  Sink = 'sink',
}

// Actions with no payload
type ToggleActionTypes =
  | ListItemEditorActionType.Lift
  | ListItemEditorActionType.Sink;

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
        editor
          .chain()
          .focus()
          .liftListItem(editor.schema.nodes.listItem!.name)
          .run();
        break;
      case ListItemEditorActionType.Sink:
        editor
          .chain()
          .focus()
          .sinkListItem(editor.schema.nodes.listItem!.name)
          .run();
        break;
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    const lift = () =>
      sendBridgeMessage({ type: ListItemEditorActionType.Lift });
    const sink = () =>
      sendBridgeMessage({ type: ListItemEditorActionType.Sink });

    return {
      lift,
      sink,
    };
  },
  extendEditorState: (editor) => {
    return {
      canLift: editor
        .can()
        .liftListItem(editor.state.schema.nodes.listItem!.name),
      canSink: editor
        .can()
        .sinkListItem(editor.state.schema.nodes.listItem!.name),
    };
  },
});
