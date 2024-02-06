import StarterKit from '@tiptap/starter-kit';
import BridgeExtension from './base';

type TenTapStartKitEditorState = {
  isQuoteActive: boolean;
  isCodeActive: boolean;
  isBoldActive: boolean;
  isItalicActive: boolean;
  canToggleBlockquote: boolean;
  canToggleCode: boolean;
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
  toggleBlockquote: () => void;
  toggleCodeBlock: () => void;
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

declare module '../types/EditorNativeState' {
  interface EditorNativeState extends TenTapStartKitEditorState {}
  interface EditorBridge extends TenTapStartKitEditorInstance {}
}

export enum StarterKitEditorActionType {
  ToggleBlockquote = 'toggle-quote',
  ToggleCodeBlock = 'toggle-code-block',
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
  | StarterKitEditorActionType.ToggleBlockquote
  | StarterKitEditorActionType.ToggleCodeBlock
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

export const TenTapStartKit = new BridgeExtension<
  TenTapStartKitEditorState,
  TenTapStartKitEditorInstance,
  StarterKitMessage
>({
  tiptapExtension: StarterKit,
  onBridgeMessage: (editor, message) => {
    switch (message.type) {
      case StarterKitEditorActionType.ToggleBlockquote:
        editor.chain().focus().toggleBlockquote().run();
        break;
      case StarterKitEditorActionType.ToggleCodeBlock:
        editor.chain().focus().toggleCodeBlock().run();
        break;
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
  extendEditorInstance: (sendBridgeMessage) => {
    const toggleBlockquote = () => {
      sendBridgeMessage({ type: StarterKitEditorActionType.ToggleBlockquote });
    };
    const toggleBold = () => {
      sendBridgeMessage({ type: StarterKitEditorActionType.ToggleBold });
    };
    const toggleItalic = () =>
      sendBridgeMessage({ type: StarterKitEditorActionType.ToggleItalic });
    const toggleStrikethrough = () =>
      sendBridgeMessage({
        type: StarterKitEditorActionType.ToggleStrikethrough,
      });
    const toggleBulletList = () =>
      sendBridgeMessage({ type: StarterKitEditorActionType.ToggleBulletList });
    const toggleOrderedList = () =>
      sendBridgeMessage({ type: StarterKitEditorActionType.ToggleOrderedList });
    const toggleHeading = (level: Level) =>
      sendBridgeMessage({
        type: StarterKitEditorActionType.ToggleHeading,
        payload: level,
      });
    const lift = () =>
      sendBridgeMessage({ type: StarterKitEditorActionType.Lift });
    const sink = () =>
      sendBridgeMessage({ type: StarterKitEditorActionType.Sink });
    const undo = () =>
      sendBridgeMessage({ type: StarterKitEditorActionType.Undo });
    const redo = () =>
      sendBridgeMessage({ type: StarterKitEditorActionType.Redo });
    const toggleCodeBlock = () =>
      sendBridgeMessage({ type: StarterKitEditorActionType.ToggleCodeBlock });

    return {
      toggleBlockquote,
      toggleCodeBlock,
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
      isQuoteActive: editor.isActive('blockquote'),
      canToggleBlockquote: editor.can().toggleBlockquote(),
      isCodeActive: editor.isActive('codeBlock'),
      canToggleCode: editor.can().toggleCodeBlock(),
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
  extendCSS: `
  pre {
    background: #0d0d0d;
    border-radius: 0.5rem;
    color: #fff;
    font-family: "JetBrainsMono", monospace;
    padding: 0.75rem 1rem;
  }
  * + * {
    margin-top: 0.75em;
  }  
  code {
    background: none;
    color: inherit;
    font-size: 0.8rem;
    padding: 0;
  }

  blockquote {
    border-left: 3px solid #0d0d0d1a;
    padding-left: 1rem;
  }
  `,
});
