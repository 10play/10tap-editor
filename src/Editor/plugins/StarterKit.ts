import StarterKit from '@tiptap/starter-kit';
import BaseTenTapPlugin from './base';

type TenTapStartKitEditorState = {
  isBoldActive: boolean;
  isItalicActive: boolean;
  canToggleBold: boolean;
  canToggleItalic: boolean;
  canToggleStrikethrough: boolean;
  canLift: boolean;
  canSink: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canToggleHeading: boolean;
  canToggleOrderedList: boolean;
  canToggleBulletList: boolean;
  isStrikethroughActive: boolean;
  headingLevel: number | undefined;
  isOrderedListActive: boolean;
  isBulletListActive: boolean;
};

type TenTapStartKitEditorInstance = {
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleStrikethrough: () => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  toggleHeading: (level: Level) => void;
  lift: () => void;
  sink: () => void;
  undo: () => void;
  redo: () => void;
};

declare module '../../types/EditorState' {
  interface EditorState extends TenTapStartKitEditorState {}
  interface EditorInstance extends TenTapStartKitEditorInstance {}
}

export enum StarterKitEditorActionType {
  ToggleBold = 'toggle-bold',
  ToggleItalic = 'toggle-italic',
  ToggleStrikethrough = 'toggle-strikethrough',
  ToggleHeading = 'toggle-heading',
  ToggleOrderedList = 'toggle-ordered-list',
  ToggleBulletList = 'toggle-bullet-list',
  Lift = 'lift',
  Sink = 'sink',
  Undo = 'undo',
  Redo = 'redo',
}

// Actions with no payload
type ToggleActionTypes =
  | StarterKitEditorActionType.ToggleBold
  | StarterKitEditorActionType.ToggleItalic
  | StarterKitEditorActionType.ToggleStrikethrough
  | StarterKitEditorActionType.ToggleOrderedList
  | StarterKitEditorActionType.ToggleBulletList
  | StarterKitEditorActionType.Lift
  | StarterKitEditorActionType.Sink
  | StarterKitEditorActionType.Undo
  | StarterKitEditorActionType.Redo;

export interface ToggleAction {
  type: ToggleActionTypes;
  payload?: undefined;
}

type Level = 2 | 1 | 3 | 4 | 5 | 6;
interface HeadingAction {
  type: StarterKitEditorActionType.ToggleHeading;
  payload: Level;
}

type StarterKitMessage = ToggleAction | HeadingAction;

export const TenTapStartKit = new BaseTenTapPlugin<
  TenTapStartKitEditorState,
  TenTapStartKitEditorInstance,
  StarterKitMessage
>({
  tiptapPlugin: StarterKit,
  onTenTapMessage: (editor, message) => {
    switch (message.type) {
      case StarterKitEditorActionType.ToggleBold:
        editor.chain().focus().toggleBold().run();
        break;
      case StarterKitEditorActionType.ToggleItalic:
        editor.chain().focus().toggleItalic().run();
        break;

      case StarterKitEditorActionType.ToggleStrikethrough:
        editor.chain().focus().toggleStrike().run();
        break;
      case StarterKitEditorActionType.ToggleBulletList:
        editor.chain().focus().toggleBulletList().run();
        break;
      case StarterKitEditorActionType.ToggleOrderedList:
        editor.chain().focus().toggleOrderedList().run();
        break;

      case StarterKitEditorActionType.ToggleHeading:
        editor.chain().focus().toggleHeading({ level: message.payload }).run();
        break;
      case StarterKitEditorActionType.Lift:
        editor
          .chain()
          .focus()
          .liftListItem(editor.schema.nodes.listItem!.name)
          .run();
        break;
      case StarterKitEditorActionType.Sink:
        editor
          .chain()
          .focus()
          .sinkListItem(editor.schema.nodes.listItem!.name)
          .run();
        break;
      case StarterKitEditorActionType.Undo:
        editor.chain().focus().undo().run();
        break;
      case StarterKitEditorActionType.Redo:
        editor.chain().focus().redo().run();
        break;
    }

    return false;
  },
  extendEditor: (sendPluginMessage) => {
    const toggleBold = () => {
      console.log('try to toggle bold', sendPluginMessage);
      sendPluginMessage({ type: StarterKitEditorActionType.ToggleBold });
    };
    const toggleItalic = () =>
      sendPluginMessage({ type: StarterKitEditorActionType.ToggleItalic });
    const toggleStrikethrough = () =>
      sendPluginMessage({
        type: StarterKitEditorActionType.ToggleStrikethrough,
      });
    const toggleBulletList = () =>
      sendPluginMessage({ type: StarterKitEditorActionType.ToggleBulletList });
    const toggleOrderedList = () =>
      sendPluginMessage({ type: StarterKitEditorActionType.ToggleOrderedList });
    const toggleHeading = (level: Level) =>
      sendPluginMessage({
        type: StarterKitEditorActionType.ToggleHeading,
        payload: level,
      });
    const lift = () =>
      sendPluginMessage({ type: StarterKitEditorActionType.Lift });
    const sink = () =>
      sendPluginMessage({ type: StarterKitEditorActionType.Sink });
    const undo = () =>
      sendPluginMessage({ type: StarterKitEditorActionType.Undo });
    const redo = () =>
      sendPluginMessage({ type: StarterKitEditorActionType.Redo });

    return {
      toggleBold,
      toggleItalic,
      toggleStrikethrough,
      toggleBulletList,
      toggleOrderedList,
      toggleHeading,
      lift,
      sink,
      undo,
      redo,
    };
  },
  extendEditorState: (editor) => {
    return {
      canToggleBold: editor.can().toggleBold(),
      canToggleBulletList: editor.can().toggleBulletList(),
      canToggleItalic: editor.can().toggleItalic(),
      canToggleOrderedList: editor.can().toggleOrderedList(),
      canToggleStrikethrough: editor.can().toggleStrike(),
      canToggleHeading: editor.can().toggleHeading({ level: 1 }),
      canLift: editor
        .can()
        .liftListItem(editor.state.schema.nodes.listItem!.name),
      canSink: editor
        .can()
        .sinkListItem(editor.state.schema.nodes.listItem!.name),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
      isBoldActive: editor.isActive('bold'),
      isItalicActive: editor.isActive('italic'),
      isStrikethroughActive: editor.isActive('strike'),
      isBulletListActive: editor.isActive('bulletList'),
      isOrderedListActive: editor.isActive('orderedList'),
      headingLevel: editor.getAttributes('heading')?.level,
    };
  },
});
