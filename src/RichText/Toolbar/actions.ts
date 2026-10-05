import { Platform } from 'react-native';
import type { Level } from '@tiptap/extension-heading';
import { Images } from '../../assets';
import { EditorActionType } from '../../types/Actions';
import type { EditorBridge } from '../../types';
import { type BridgeState } from '../../types/EditorBridge';

export enum ToolbarContext {
  Main,
  Link,
  Heading,
}

export const ToolbarItems = {
  ...EditorActionType,
  ToggleH1: 'toggle-h1',
  ToggleH2: 'toggle-h2',
  ToggleH3: 'toggle-h3',
  ToggleH4: 'toggle-h4',
  ToggleH5: 'toggle-h5',
  ToggleH6: 'toggle-h6',
} as const;

export type ArgsToolbarCB = {
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
  image: ({ editor, editorState }: ArgsToolbarCB) => any;
  /** Accessibility label of the button, read by screen readers and UI tests. */
  label?: string;
}

export const DEFAULT_TOOLBAR_ITEMS: ToolbarItem[] = [
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleBold(),
    active: ({ editorState }) => editorState.isBoldActive,
    disabled: ({ editorState }) => !editorState.canToggleBold,
    image: () => Images.bold,
    label: 'Bold',
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleItalic(),
    active: ({ editorState }) => editorState.isItalicActive,
    disabled: ({ editorState }) => !editorState.canToggleItalic,
    image: () => Images.italic,
    label: 'Italic',
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
    image: () => Images.link,
    label: 'Link',
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleTaskList(),
    active: ({ editorState }) => editorState.isTaskListActive,
    disabled: ({ editorState }) => !editorState.canToggleTaskList,
    image: () => Images.checkList,
    label: 'Task list',
  },
  {
    onPress:
      ({ setToolbarContext }) =>
      () =>
        setToolbarContext(ToolbarContext.Heading),
    active: () => false,
    disabled: ({ editorState }) => !editorState.canToggleHeading,
    image: () => Images.Aa,
    label: 'Heading',
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleCode(),
    active: ({ editorState }) => editorState.isCodeActive,
    disabled: ({ editorState }) => !editorState.canToggleCode,
    image: () => Images.code,
    label: 'Code',
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleUnderline(),
    active: ({ editorState }) => editorState.isUnderlineActive,
    disabled: ({ editorState }) => !editorState.canToggleUnderline,
    image: () => Images.underline,
    label: 'Underline',
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleStrike(),
    active: ({ editorState }) => editorState.isStrikeActive,
    disabled: ({ editorState }) => !editorState.canToggleStrike,
    image: () => Images.strikethrough,
    label: 'Strikethrough',
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleBlockquote(),
    active: ({ editorState }) => editorState.isBlockquoteActive,
    disabled: ({ editorState }) => !editorState.canToggleBlockquote,
    image: () => Images.quote,
    label: 'Quote',
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleOrderedList(),
    active: ({ editorState }) => editorState.isOrderedListActive,
    disabled: ({ editorState }) => !editorState.canToggleOrderedList,
    image: () => Images.orderedList,
    label: 'Ordered list',
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.toggleBulletList(),
    active: ({ editorState }) => editorState.isBulletListActive,
    disabled: ({ editorState }) => !editorState.canToggleBulletList,
    image: () => Images.bulletList,
    label: 'Bullet list',
  },
  {
    // Regular list items (li) and task list items both use the
    // same sink command and button just with a different parameter, so we check both states here
    onPress:
      ({ editor, editorState }) =>
      () =>
        editorState.canSink ? editor.sink() : editor.sinkTaskListItem(),
    active: () => false,
    disabled: ({ editorState }) =>
      !editorState.canSink && !editorState.canSinkTaskListItem,
    image: () => Images.indent,
    label: 'Indent',
  },
  {
    // Regular list items (li) and task list items both use the
    // same lift command and button just with a different parameter, so we check both states here
    onPress:
      ({ editor, editorState }) =>
      () =>
        editorState.canLift ? editor.lift() : editor.liftTaskListItem(),
    active: () => false,
    disabled: ({ editorState }) =>
      !editorState.canLift && !editorState.canLiftTaskListItem,
    image: () => Images.outdent,
    label: 'Outdent',
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.undo(),
    active: () => false,
    disabled: ({ editorState }) => !editorState.canUndo,
    image: () => Images.undo,
    label: 'Undo',
  },
  {
    onPress:
      ({ editor }) =>
      () =>
        editor.redo(),
    active: () => false,
    disabled: ({ editorState }) => !editorState.canRedo,
    image: () => Images.redo,
    label: 'Redo',
  },
];

const HEADING_LEVELS: readonly Level[] = [1, 2, 3, 4, 5, 6];

const headingItem = (level: Level): ToolbarItem => ({
  onPress:
    ({ editor }) =>
    () =>
      editor.toggleHeading(level),
  active: ({ editorState }) => editorState.headingLevel === level,
  disabled: ({ editorState }) => !editorState.canToggleHeading,
  image: () => Images[`h${level}`],
  label: `Heading ${level}`,
});

/**
 * The heading sub-toolbar: a close item back to the main toolbar, then H1-H6.
 * Replace it with `<Toolbar headingItems={...} />`.
 */
export const HEADING_ITEMS: ToolbarItem[] = [
  {
    onPress:
      ({ setToolbarContext }) =>
      () =>
        setToolbarContext(ToolbarContext.Main),
    active: () => false,
    disabled: () => false,
    image: () => Images.close,
    label: 'Close headings',
  },
  ...HEADING_LEVELS.map(headingItem),
];
