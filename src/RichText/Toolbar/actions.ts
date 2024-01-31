import { Images } from '../../assets';
import { EditorActionType } from '../../types/Actions';
import type { EditorInstance } from '../../types';
import { type EditorState } from '../../types/EditorState';
import { ToolbarContext } from './Toolbar';

export const ToolbarItems = {
  ...EditorActionType,
  ToggleH1: 'toggle-h1',
  ToggleH2: 'toggle-h2',
  ToggleH3: 'toggle-h3',
  ToggleH4: 'toggle-h4',
  ToggleH5: 'toggle-h5',
  ToggleH6: 'toggle-h6',
} as const;

type ArgsToolbarCB = {
  editor: EditorInstance;
  editorState: EditorState;
  setToolbarContext: (ToolbarContext: ToolbarContext) => void;
  toolbarContext: ToolbarContext;
};
export interface ToolbarItem {
  onPress: ({
    editor,
    editorState,
    setToolbarContext,
    toolbarContext,
  }: ArgsToolbarCB) => () => void;
  active: ({
    editor,
    editorState,
    setToolbarContext,
    toolbarContext,
  }: ArgsToolbarCB) => boolean;
  disabled: ({
    editor,
    editorState,
    setToolbarContext,
    toolbarContext,
  }: ArgsToolbarCB) => boolean;
  image: ({
    editor,
    editorState,
    setToolbarContext,
    toolbarContext,
  }: ArgsToolbarCB) => any;
}

export const DEFAULT_TOOLBAR_ITEMS: ToolbarItem[] = [
  // {
  //   // TODO: this is weird I have to add it here
  //   type: ToolbarItems.ChangeHighlight,
  //   onPress: () => () => {},
  //   active: () => false,
  //   disabled: () => false,
  //   image: () => Images.platte,
  // },
  // {
  //   type: ToolbarItems.ChangeColor,
  //   onPress:
  //     ({ editor, setToolbarContext }) =>
  //     () => {
  //       setToolbarContext((prev) => {
  //         if (prev === ToolbarContext.Color) {
  //           editor.webviewRef.current?.requestFocus();
  //           return ToolbarContext.Main;
  //         } else {
  //           return ToolbarContext.Color;
  //         }
  //       });
  //     },
  //   active: ({ toolbarContext }) => toolbarContext === ToolbarContext.Color,
  //   disabled: () => false,
  //   image: () => Images.platte,
  // },
  {
    onPress:
      ({ setToolbarContext }) =>
      () => {
        setToolbarContext(ToolbarContext.Link);
      },
    active: ({ editorState }) => editorState.isLinkActive,
    disabled: ({ editorState }) =>
      !editorState.isLinkActive && !editorState.canSetLink,
    image: () => Images.link,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleBold(),
    active: ({ editorState }) => editorState.isBoldActive,
    disabled: ({ editorState }) => !editorState.canToggleBold,
    image: () => Images.bold,
  },
  // {
  //   type: EditorActionType.ToggleItalic,
  //   onPress: ({ editor }) =>  () => editor.toggleItalic(),
  //   active: ({ editorState }) =>  editorState.isItalicActive,
  //   disabled: ({ editorState }) =>  !editorState.canToggleItalic,
  //   image: () => Images.italic,
  // },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleTaskList(),
    active: ({ editorState }) => editorState.isTaskListActive,
    disabled: ({ editorState }) => !editorState.canToggleTaskList,
    image: () => Images.checkList,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleUnderline(),
    active: ({ editorState }) => editorState.isUnderlineActive,
    disabled: ({ editorState }) => !editorState.canToggleUnderline,
    image: () => Images.underline,
  },
  // {
  //   type: EditorActionType.ToggleStrikethrough,
  //   onPress: ({ editor }) => () => editor.toggleStrikethrough(),
  //   active: ({ editorState }) => editorState.isStrikethroughActive,
  //   disabled: ({ editorState }) => !editorState.canToggleStrikethrough,
  //   image: () => Images.strikethrough,
  // },
  // {
  //   type: EditorActionType.ToggleHeading,
  //   onPress: ({ editor }) => () => editor.toggleHeading(1),
  //   active: ({ editorState }) => editorState.headingLevel === 1,
  //   disabled: ({ editorState }) => !editorState.canToggleHeading,
  //   image: () => Images.h1,
  // },
  // {
  //   type: EditorActionType.ToggleHeading,
  //   onPress: ({ editor }) => () => editor.toggleHeading(2),
  //   active: ({ editorState }) => editorState.headingLevel === 2,
  //   disabled: ({ editorState }) => !editorState.canToggleHeading,
  //   image: () => Images.h2,
  // },
  // {
  //   type: EditorActionType.ToggleHeading,
  //   onPress: ({ editor }) =>  () => editor.toggleHeading(3),
  //   active: ({ editorState }) => editorState.headingLevel === 3,
  //   disabled: !editorState.canToggleHeading,
  //   image: Images.h3,
  // },
  // {
  //   type: EditorActionType.ToggleHeading,
  //   onPress: () => editor.toggleHeading(4),
  //   active: editorState.headingLevel === 4,
  //   disabled: !editorState.canToggleHeading,
  //   image: Images.h4,
  // },
  // {
  //   type: EditorActionType.ToggleHeading,
  //   onPress: () => editor.toggleHeading(5),
  //   active: editorState.headingLevel === 5,
  //   disabled: !editorState.canToggleHeading,
  //   image: Images.h5,
  // },
  // {
  //   type: EditorActionType.ToggleHeading,
  //   onPress: () => editor.toggleHeading(6),
  //   active: editorState.headingLevel === 6,
  //   disabled: !editorState.canToggleHeading,
  //   image: Images.h6,
  // },
  // {
  //   type: EditorActionType.ToggleOrderedList,
  //   onPress: () => editor.toggleOrderedList(),
  //   active: editorState.isOrderedListActive,
  //   disabled: !editorState.canToggleOrderedList,
  //   image: Images.orderedList,
  // },
  // {
  //   type: EditorActionType.ToggleBulletList,
  //   onPress: () => editor.toggleBulletList(),
  //   active: editorState.isBulletListActive,
  //   disabled: !editorState.canToggleBulletList,
  //   image: Images.bulletList,
  // },
  // {
  //   type: EditorActionType.Sink,
  //   onPress: () => editor.sink(),
  //   active: false,
  //   disabled: !editorState.canSink,
  //   image: Images.indent,
  // },
  // {
  //   type: EditorActionType.Lift,
  //   onPress: () => editor.lift(),
  //   active: false,
  //   disabled: !editorState.canLift,
  //   image: Images.outdent,
  // },

  // {
  //   type: EditorActionType.Undo,
  //   onPress: () => editor.undo(),
  //   active: false,
  //   disabled: !editorState.canUndo,
  //   image: Images.undo,
  // },
  // {
  //   type: EditorActionType.Redo,
  //   onPress: () => editor.redo(),
  //   active: false,
  //   disabled: !editorState.canRedo,
  //   image: Images.redo,
  // },
];
