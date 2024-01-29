import { Images } from '../../assets';
import { EditorActionType } from '../../types/Actions';
import { type EditorState } from '../../types/EditorState';
import { type Editor } from '../useEditor';
import { ToolbarContext } from './Toolbar';

export const ToolbarItems = {
  ...EditorActionType,
  ToggleH1: 'toggle-h1',
  ToggleH2: 'toggle-h2',
  ToggleH3: 'toggle-h3',
  ToggleH4: 'toggle-h4',
  ToggleH5: 'toggle-h5',
  ToggleH6: 'toggle-h6',
  ShowColor: 'show-color',
} as const;

type ValueOf<T> = T[keyof T];
export type ToolbarItemType = Exclude<
  ValueOf<typeof ToolbarItems>,
  EditorActionType.ToggleHeading
>;
export interface ToolbarAction {
  type: ToolbarItemType | EditorActionType.ToggleHeading;
  onPress: () => void;
  active: boolean;
  disabled: boolean;
  image: any;
}

export const getToolbarActions = (
  editor: Editor,
  editorState: EditorState,
  changeToolBarContext: React.Dispatch<React.SetStateAction<ToolbarContext>>,
  toolbarContext: ToolbarContext
): Record<ToolbarItemType, ToolbarAction> => ({
  [ToolbarItems.ShowColor]: {
    type: ToolbarItems.ShowColor,
    onPress: () => {
      changeToolBarContext((prev) => {
        if (prev === ToolbarContext.Color) {
          editor.webviewRef.current?.requestFocus();
          return ToolbarContext.Main;
        } else {
          return ToolbarContext.Color;
        }
      });
    },
    active: toolbarContext === ToolbarContext.Color,
    disabled: false,
    image: Images.platte,
  },
  [ToolbarItems.Link]: {
    type: EditorActionType.Link,
    onPress: () => {
      changeToolBarContext(ToolbarContext.Link);
    },
    active: editorState.isLinkActive,
    disabled: !editorState.isLinkActive && !editorState.canAddLink,
    image: Images.link,
  },
  [ToolbarItems.ToggleBold]: {
    type: EditorActionType.ToggleBold,
    onPress: () => editor.toggleBold(),
    active: editorState.isBoldActive,
    disabled: !editorState.canToggleBold,
    image: Images.bold,
  },
  [ToolbarItems.ToggleItalic]: {
    type: EditorActionType.ToggleItalic,
    onPress: () => editor.toggleItalic(),
    active: editorState.isItalicActive,
    disabled: !editorState.canToggleItalic,
    image: Images.italic,
  },
  [ToolbarItems.ToggleUnderline]: {
    type: EditorActionType.ToggleUnderline,
    onPress: () => editor.toggleUnderline(),
    active: editorState.isUnderlineActive,
    disabled: !editorState.canToggleUnderline,
    image: Images.underline,
  },
  [ToolbarItems.ToggleStrikethrough]: {
    type: EditorActionType.ToggleStrikethrough,
    onPress: () => editor.toggleStrikethrough(),
    active: editorState.isStrikethroughActive,
    disabled: !editorState.canToggleStrikethrough,
    image: Images.strikethrough,
  },
  [ToolbarItems.ToggleH1]: {
    type: EditorActionType.ToggleHeading,
    onPress: () => editor.toggleHeading(1),
    active: editorState.headingLevel === 1,
    disabled: !editorState.canToggleHeading,
    image: Images.h1,
  },
  [ToolbarItems.ToggleH2]: {
    type: EditorActionType.ToggleHeading,
    onPress: () => editor.toggleHeading(2),
    active: editorState.headingLevel === 2,
    disabled: !editorState.canToggleHeading,
    image: Images.h2,
  },
  [ToolbarItems.ToggleH3]: {
    type: EditorActionType.ToggleHeading,
    onPress: () => editor.toggleHeading(3),
    active: editorState.headingLevel === 3,
    disabled: !editorState.canToggleHeading,
    image: Images.h3,
  },
  [ToolbarItems.ToggleH4]: {
    type: EditorActionType.ToggleHeading,
    onPress: () => editor.toggleHeading(4),
    active: editorState.headingLevel === 4,
    disabled: !editorState.canToggleHeading,
    image: Images.h4,
  },
  [ToolbarItems.ToggleH5]: {
    type: EditorActionType.ToggleHeading,
    onPress: () => editor.toggleHeading(5),
    active: editorState.headingLevel === 5,
    disabled: !editorState.canToggleHeading,
    image: Images.h5,
  },
  [ToolbarItems.ToggleH6]: {
    type: EditorActionType.ToggleHeading,
    onPress: () => editor.toggleHeading(6),
    active: editorState.headingLevel === 6,
    disabled: !editorState.canToggleHeading,
    image: Images.h6,
  },
  [ToolbarItems.ToggleOrderedList]: {
    type: EditorActionType.ToggleOrderedList,
    onPress: () => editor.toggleOrderedList(),
    active: editorState.isOrderedListActive,
    disabled: !editorState.canToggleOrderedList,
    image: Images.orderedList,
  },
  [ToolbarItems.ToggleBulletList]: {
    type: EditorActionType.ToggleBulletList,
    onPress: () => editor.toggleBulletList(),
    active: editorState.isBulletListActive,
    disabled: !editorState.canToggleBulletList,
    image: Images.bulletList,
  },
  [ToolbarItems.ToggleCheckList]: {
    type: EditorActionType.ToggleCheckList,
    onPress: () => editor.toggleCheckList(),
    active: editorState.isCheckListActive,
    disabled: !editorState.canToggleCheckList,
    image: Images.checkList,
  },
  [ToolbarItems.Sink]: {
    type: EditorActionType.Sink,
    onPress: () => editor.sink(),
    active: false,
    disabled: !editorState.canSink,
    image: Images.indent,
  },
  [ToolbarItems.Lift]: {
    type: EditorActionType.Lift,
    onPress: () => editor.lift(),
    active: false,
    disabled: !editorState.canLift,
    image: Images.outdent,
  },

  [ToolbarItems.Undo]: {
    type: EditorActionType.Undo,
    onPress: () => editor.undo(),
    active: false,
    disabled: !editorState.canUndo,
    image: Images.undo,
  },
  [ToolbarItems.Redo]: {
    type: EditorActionType.Redo,
    onPress: () => editor.redo(),
    active: false,
    disabled: !editorState.canRedo,
    image: Images.redo,
  },
});

export const DEFAULT_TOOLBAR_ITEMS: ToolbarItemType[] = [
  ToolbarItems.ShowColor,
  ToolbarItems.Link,
  ToolbarItems.ToggleBold,
  ToolbarItems.ToggleItalic,
  ToolbarItems.ToggleUnderline,
  ToolbarItems.ToggleStrikethrough,
  ToolbarItems.ToggleH1,
  ToolbarItems.ToggleH2,
  ToolbarItems.ToggleH3,
  ToolbarItems.ToggleOrderedList,
  ToolbarItems.ToggleBulletList,
  ToolbarItems.ToggleCheckList,
  ToolbarItems.Lift,
  ToolbarItems.Sink,
  ToolbarItems.Undo,
  ToolbarItems.Redo,
];
