import { Platform } from 'react-native';
import { EditorActionType } from '../../types/Actions';
import type { EditorBridge } from '../../types';
import { type BridgeState } from '../../types/EditorBridge';
import { ToolbarContext } from './Toolbar';
import { IconSVG } from '../../assets/IconSVG';
import { SVGs } from '../../assets';

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
  editor: EditorBridge;
  editorState: BridgeState;
  setToolbarContext: (
    ToolbarContext: ToolbarContext | ((prev: ToolbarContext) => ToolbarContext)
  ) => void;
  toolbarContext: ToolbarContext;
};
export interface ToolbarItem {
  onPress: ({ editor, editorState }: ArgsToolbarCB) => () => void;
  active: ({ editor, editorState }: ArgsToolbarCB) => boolean;
  disabled: ({ editor, editorState }: ArgsToolbarCB) => boolean;
  // image: ({ editor, editorState }: ArgsToolbarCB) => any;
  // accept react icon component

  icon: ({ editor, editorState }: ArgsToolbarCB) => any;
}

export const DEFAULT_TOOLBAR_ITEMS: ToolbarItem[] = [
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleBold(),
    active: ({ editorState }) => editorState.isBoldActive,
    disabled: ({ editorState }) => !editorState.canToggleBold,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.isBoldActive,
        disabled: !editorState.canToggleBold,
        icon: SVGs.bold,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleItalic(),
    active: ({ editorState }) => editorState.isItalicActive,
    disabled: ({ editorState }) => !editorState.canToggleItalic,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.isItalicActive,
        disabled: !editorState.canToggleItalic,
        icon: SVGs.italic,
      }),
  },
  {
    onPress:
      ({ setToolbarContext, editorState, editor }) =>
      () => {
        if (Platform.OS === 'android') {
          // On android focus outside the editor will lose the tiptap selection so we wait for the next tick and set it with the last selection value we had
          setTimeout(() => {
            editor.setSelection(
              editorState.selection.from,
              editorState.selection.to
            );
          });
        }
        setToolbarContext(ToolbarContext.Link);
      },
    active: ({ editorState }) => editorState.isLinkActive,
    disabled: ({ editorState }) =>
      !editorState.isLinkActive && !editorState.canSetLink,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.isLinkActive,
        disabled: !editorState.isLinkActive && !editorState.canSetLink,
        icon: SVGs.link,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleTaskList(),
    active: ({ editorState }) => editorState.isTaskListActive,
    disabled: ({ editorState }) => !editorState.canToggleTaskList,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.isTaskListActive,
        disabled: !editorState.canToggleTaskList,
        icon: SVGs.checkList,
      }),
  },
  {
    onPress:
      ({ setToolbarContext }) =>
      () =>
        setToolbarContext(ToolbarContext.Heading),
    active: () => false,
    disabled: ({ editorState }) => !editorState.canToggleHeading,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: false,
        disabled: !editorState.canToggleHeading,
        icon: SVGs.Aa,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleCode(),
    active: ({ editorState }) => editorState.isCodeActive,
    disabled: ({ editorState }) => !editorState.canToggleCode,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.isCodeActive,
        disabled: !editorState.canToggleCode,
        icon: SVGs.code,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleUnderline(),
    active: ({ editorState }) => editorState.isUnderlineActive,
    disabled: ({ editorState }) => !editorState.canToggleUnderline,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.isUnderlineActive,
        disabled: !editorState.canToggleUnderline,
        icon: SVGs.underline,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleStrike(),
    active: ({ editorState }) => editorState.isStrikeActive,
    disabled: ({ editorState }) => !editorState.canToggleStrike,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.isStrikeActive,
        disabled: !editorState.canToggleStrike,
        icon: SVGs.strikethrough,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleBlockquote(),
    active: ({ editorState }) => editorState.isBlockquoteActive,
    disabled: ({ editorState }) => !editorState.canToggleBlockquote,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.isBlockquoteActive,
        disabled: !editorState.canToggleBlockquote,
        icon: SVGs.quote,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleOrderedList(),
    active: ({ editorState }) => editorState.isOrderedListActive,
    disabled: ({ editorState }) => !editorState.canToggleOrderedList,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.isOrderedListActive,
        disabled: !editorState.canToggleOrderedList,
        icon: SVGs.orderedList,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleBulletList(),
    active: ({ editorState }) => editorState.isBulletListActive,
    disabled: ({ editorState }) => !editorState.canToggleBulletList,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.isBulletListActive,
        disabled: !editorState.canToggleBulletList,
        icon: SVGs.bulletList,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.sink(),
    active: () => false,
    disabled: ({ editorState }) => !editorState.canSink,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: false,
        disabled: !editorState.canSink,
        icon: SVGs.indent,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.lift(),
    active: () => false,
    disabled: ({ editorState }) => !editorState.canLift,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: false,
        disabled: !editorState.canLift,
        icon: SVGs.outdent,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.undo(),
    active: () => false,
    disabled: ({ editorState }) => !editorState.canUndo,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: false,
        disabled: !editorState.canUndo,
        icon: SVGs.undo,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.redo(),
    active: () => false,
    disabled: ({ editorState }) => !editorState.canRedo,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: false,
        disabled: !editorState.canRedo,
        icon: SVGs.redo,
      }),
  },
];

export const HEADING_ITEMS: ToolbarItem[] = [
  {
    onPress:
      ({ setToolbarContext }) =>
      () =>
        setToolbarContext(ToolbarContext.Main),
    active: () => false,
    disabled: () => false,
    icon: ({ editor }) =>
      IconSVG({
        editor,
        active: false,
        disabled: false,
        icon: SVGs.close,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleHeading(1),
    active: ({ editorState }) => editorState.headingLevel === 1,
    disabled: ({ editorState }) => !editorState.canToggleHeading,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.headingLevel === 1,
        disabled: !editorState.canToggleHeading,
        icon: SVGs.h1,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleHeading(2),
    active: ({ editorState }) => editorState.headingLevel === 2,
    disabled: ({ editorState }) => !editorState.canToggleHeading,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.headingLevel === 2,
        disabled: !editorState.canToggleHeading,
        icon: SVGs.h2,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleHeading(3),
    active: ({ editorState }) => editorState.headingLevel === 3,
    disabled: ({ editorState }) => !editorState.canToggleHeading,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.headingLevel === 3,
        disabled: !editorState.canToggleHeading,
        icon: SVGs.h3,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleHeading(4),
    active: ({ editorState }) => editorState.headingLevel === 4,
    disabled: ({ editorState }) => !editorState.canToggleHeading,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.headingLevel === 4,
        disabled: !editorState.canToggleHeading,
        icon: SVGs.h4,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleHeading(5),
    active: ({ editorState }) => editorState.headingLevel === 5,
    disabled: ({ editorState }) => !editorState.canToggleHeading,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.headingLevel === 5,
        disabled: !editorState.canToggleHeading,
        icon: SVGs.h5,
      }),
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleHeading(6),
    active: ({ editorState }) => editorState.headingLevel === 6,
    disabled: ({ editorState }) => !editorState.canToggleHeading,
    icon: ({ editor, editorState }) =>
      IconSVG({
        editor,
        active: editorState.headingLevel === 6,
        disabled: !editorState.canToggleHeading,
        icon: SVGs.h6,
      }),
  },
];
