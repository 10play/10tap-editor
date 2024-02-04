import { Images } from '../../assets';
import { EditorActionType } from '../../types/Actions';
import type { EditorInstance } from '../../types';
import { type EditorNativeState } from '../../types/EditorNativeState';
import { ToolbarContext } from './Toolbar';
import { ColorKeyboard } from '../Keyboard/ColorKeyboard';

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
  editorState: EditorNativeState;
  setToolbarContext: (
    ToolbarContext: ToolbarContext | ((prev: ToolbarContext) => ToolbarContext)
  ) => void;
  toolbarContext: ToolbarContext;
  activeKeyboard: string | undefined;
  setActiveKeyboard: (id: string | undefined) => void;
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
  {
    onPress:
      ({ editor, setActiveKeyboard, activeKeyboard }) =>
      () => {
        const isActive = activeKeyboard === ColorKeyboard.id;
        if (isActive) editor.webviewRef.current?.requestFocus();
        setActiveKeyboard(isActive ? undefined : ColorKeyboard.id);
      },
    active: ({ activeKeyboard }) => activeKeyboard === ColorKeyboard.id,
    disabled: () => false,
    image: () => Images.platte,
  },
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
        editor.toggleBlockquote(),
    active: ({ editorState }) => editorState.isQuoteActive,
    disabled: ({ editorState }) => !editorState.canToggleBlockquote,
    image: () => Images.quote,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleCodeBlock(),
    active: ({ editorState }) => editorState.isCodeActive,
    disabled: ({ editorState }) => !editorState.canToggleCode,
    image: () => Images.code,
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
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleItalic(),
    active: ({ editorState }) => editorState.isItalicActive,
    disabled: ({ editorState }) => !editorState.canToggleItalic,
    image: () => Images.italic,
  },
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
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleStrikethrough(),
    active: ({ editorState }) => editorState.isStrikethroughActive,
    disabled: ({ editorState }) => !editorState.canToggleStrikethrough,
    image: () => Images.strikethrough,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleHeading(1),
    active: ({ editorState }) => editorState.headingLevel === 1,
    disabled: ({ editorState }) => !editorState.canToggleHeading,
    image: () => Images.h1,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleHeading(2),
    active: ({ editorState }) => editorState.headingLevel === 2,
    disabled: ({ editorState }) => !editorState.canToggleHeading,
    image: () => Images.h2,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleHeading(3),
    active: ({ editorState }) => editorState.headingLevel === 3,
    disabled: ({ editorState }) => !editorState.canToggleHeading,
    image: () => Images.h3,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleHeading(4),
    active: ({ editorState }) => editorState.headingLevel === 4,
    disabled: ({ editorState }) => !editorState.canToggleHeading,
    image: () => Images.h4,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleHeading(5),
    active: ({ editorState }) => editorState.headingLevel === 5,
    disabled: ({ editorState }) => !editorState.canToggleHeading,
    image: () => Images.h5,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleHeading(6),
    active: ({ editorState }) => editorState.headingLevel === 6,
    disabled: ({ editorState }) => !editorState.canToggleHeading,
    image: () => Images.h6,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleOrderedList(),
    active: ({ editorState }) => editorState.isOrderedListActive,
    disabled: ({ editorState }) => !editorState.canToggleOrderedList,
    image: () => Images.orderedList,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleBulletList(),
    active: ({ editorState }) => editorState.isBulletListActive,
    disabled: ({ editorState }) => !editorState.canToggleBulletList,
    image: () => Images.bulletList,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.sink(),
    active: () => false,
    disabled: ({ editorState }) => !editorState.canSink,
    image: () => Images.indent,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.lift(),
    active: () => false,
    disabled: ({ editorState }) => !editorState.canLift,
    image: () => Images.outdent,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.undo(),
    active: () => false,
    disabled: ({ editorState }) => !editorState.canUndo,
    image: () => Images.undo,
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.redo(),
    active: () => false,
    disabled: ({ editorState }) => !editorState.canRedo,
    image: () => Images.redo,
  },
];
