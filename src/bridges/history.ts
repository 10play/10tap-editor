import { UndoRedo } from '@tiptap/extensions';
import BridgeExtension from './base';

type HistoryEditorState = {
  canUndo: boolean;
  canRedo: boolean;
};

type HistoryEditorInstance = {
  undo: () => void;
  redo: () => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends HistoryEditorState {}
  interface EditorBridge extends HistoryEditorInstance {}
}

export enum HistoryEditorActionType {
  Undo = 'undo',
  Redo = 'redo',
}

type HistoryMessage = {
  type: HistoryEditorActionType.Undo | HistoryEditorActionType.Redo;
  payload?: undefined;
};

export const HistoryBridge = new BridgeExtension<
  HistoryEditorState,
  HistoryEditorInstance,
  HistoryMessage
>({
  tiptapExtension: UndoRedo,
  onBridgeMessage: (editor, message) => {
    if (message.type === HistoryEditorActionType.Undo) {
      editor.chain().focus().undo().run();
    }
    if (message.type === HistoryEditorActionType.Redo) {
      editor.chain().focus().redo().run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    const undo = () =>
      sendBridgeMessage({ type: HistoryEditorActionType.Undo });
    const redo = () =>
      sendBridgeMessage({ type: HistoryEditorActionType.Redo });
    return {
      redo,
      undo,
    };
  },
  extendEditorState: (editor) => {
    return {
      canUndo: editor.can().undo?.() ?? false,
      canRedo: editor.can().redo?.() ?? false,
    };
  },
});
