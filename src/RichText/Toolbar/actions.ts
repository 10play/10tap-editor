import { Linking, Platform } from 'react-native';
import { Images } from '../../assets';
import { EditorActionType } from '../../types/Actions';
import type { EditorBridge } from '../../types';
import { type BridgeState } from '../../types/EditorBridge';
import { type ToolbarContext } from './Toolbar';
import type { Level } from '@tiptap/extension-heading';

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
  onPress: ({
    editor,
    editorState,
    setToolbarContext,
  }: ArgsToolbarCB) => () => void;
  active: ({ editor, editorState }: ArgsToolbarCB) => boolean;
  disabled: ({ editor, editorState }: ArgsToolbarCB) => boolean;
  image: ({ editor, editorState }: ArgsToolbarCB) => any;
  style?: any;
}

export interface ToolbarSection {
  items: ToolbarItem[];
  sectionComponent?: React.ComponentType<{
    items: ToolbarItem[];
    itemRenderer?: (item: ToolbarItem) => React.ReactNode;
  }>;
}

const HEADING: ToolbarItem = {
  onPress:
    ({ setToolbarContext }) =>
    () =>
      setToolbarContext('Heading'),
  active: () => false,
  disabled: ({ editorState }) => !editorState.canToggleHeading,
  image: () => Images.Aa,
};

const BOLD: ToolbarItem = {
  onPress:
    ({ editor }) =>
    () =>
      editor.toggleBold(),
  active: ({ editorState }) => editorState.isBoldActive,
  disabled: ({ editorState }) => !editorState.canToggleBold,
  image: () => Images.bold,
};

const ITALIC: ToolbarItem = {
  onPress:
    ({ editor }) =>
    () =>
      editor.toggleItalic(),
  active: ({ editorState }) => editorState.isItalicActive,
  disabled: ({ editorState }) => !editorState.canToggleItalic,
  image: () => Images.italic,
};

const UNDERLINE: ToolbarItem = {
  onPress:
    ({ editor }) =>
    () =>
      editor.toggleUnderline(),
  active: ({ editorState }) => editorState.isUnderlineActive,
  disabled: ({ editorState }) => !editorState.canToggleUnderline,
  image: () => Images.underline,
};

const STRIKE: ToolbarItem = {
  onPress:
    ({ editor }) =>
    () =>
      editor.toggleStrike(),
  active: ({ editorState }) => editorState.isStrikeActive,
  disabled: ({ editorState }) => !editorState.canToggleStrike,
  image: () => Images.strikethrough,
};

const LINK: ToolbarItem = {
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
      setToolbarContext('Link');
    },
  active: ({ editorState }) => editorState.isLinkActive,
  disabled: ({ editorState }) =>
    !editorState.isLinkActive && !editorState.canSetLink,
  image: () => Images.link,
};

const CODE: ToolbarItem = {
  onPress:
    ({ editor }) =>
    () =>
      editor.toggleCode(),
  active: ({ editorState }) => editorState.isCodeActive,
  disabled: ({ editorState }) => !editorState.canToggleCode,
  image: () => Images.code,
};

const BULLET_LIST: ToolbarItem = {
  onPress:
    ({ editor }) =>
    () =>
      editor.toggleBulletList(),
  active: ({ editorState }) => editorState.isBulletListActive,
  disabled: ({ editorState }) => !editorState.canToggleBulletList,
  image: () => Images.bulletList,
};

const TASK_LIST: ToolbarItem = {
  onPress:
    ({ editor }) =>
    () =>
      editor.toggleTaskList(),
  active: ({ editorState }) => editorState.isTaskListActive,
  disabled: ({ editorState }) => !editorState.canToggleTaskList,
  image: () => Images.checkList,
};

const ORDERED_LIST: ToolbarItem = {
  onPress:
    ({ editor }) =>
    () =>
      editor.toggleOrderedList(),
  active: ({ editorState }) => editorState.isOrderedListActive,
  disabled: ({ editorState }) => !editorState.canToggleOrderedList,
  image: () => Images.orderedList,
};

const INDENT: ToolbarItem = {
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
};

const OUTDENT: ToolbarItem = {
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
};

const UNDO: ToolbarItem = {
  onPress:
    ({ editor }) =>
    () =>
      editor.undo(),
  active: () => false,
  disabled: ({ editorState }) => !editorState.canUndo,
  image: () => Images.undo,
};

const REDO: ToolbarItem = {
  onPress:
    ({ editor }) =>
    () =>
      editor.redo(),
  active: () => false,
  disabled: ({ editorState }) => !editorState.canRedo,
  image: () => Images.redo,
};

export const WATERMARK: ToolbarItem = {
  onPress:
    ({}) =>
    () => {
      Linking.openURL('https://github.com/10play/10tap-editor');
    },
  active: () => false,
  disabled: () => false,
  image: () => Images.watermark,
  style: { tintColor: null },
};

export const STICKY_KEYBOARD: ToolbarItem = {
  onPress:
    ({ editor }) =>
    () => {
      editor.blur();
    },
  active: () => false,
  disabled: () => false,
  image: () => Images.keyboard,
};

export const TOOLBAR_SECTIONS: Record<string, ToolbarSection> = {
  textFormatting: {
    items: [HEADING, BOLD, ITALIC, UNDERLINE, STRIKE],
  },
  insertElements: {
    items: [LINK, CODE],
  },
  lists: {
    items: [BULLET_LIST, TASK_LIST, ORDERED_LIST, INDENT, OUTDENT],
  },
  history: {
    items: [UNDO, REDO],
  },
  watermark: {
    items: [WATERMARK],
  },
};

export const DEFAULT_TOOLBAR_ITEMS: ToolbarItem[] = Object.values(
  TOOLBAR_SECTIONS
).flatMap((section) => section.items);

export const HEADING_ITEMS: ToolbarItem[] = [
  {
    onPress:
      ({ setToolbarContext }) =>
      () =>
        setToolbarContext('Main'),
    active: () => false,
    disabled: () => false,
    image: () => Images.close,
  },
  ...Array.from({ length: 6 }, (_, level) => ({
    onPress:
      ({ editor }: ArgsToolbarCB) =>
      () =>
        editor.toggleHeading((level + 1) as Level),
    active: ({ editorState }: ArgsToolbarCB) =>
      editorState.headingLevel === level + 1,
    disabled: ({ editorState }: ArgsToolbarCB) => !editorState.canToggleHeading,
    image: () => Images[`h${level + 1}` as keyof typeof Images],
  })),
];
