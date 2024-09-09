import type { EditorBridge } from '../../types';
import { type BridgeState } from '../../types/EditorBridge';
import { type ToolbarContext } from './Toolbar';

export type ArgsToolbarCB = {
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

export interface ToolbarProps {
  editor: EditorBridge;
  hidden?: boolean;
  items?: ToolbarItem[];
  contexts?: Record<ToolbarContext, ToolbarContextConfig>;
  sections?: Record<string, ToolbarSection>;
  itemRenderer?: (item: ToolbarItem) => React.ReactNode | null;
  showStickyKeyboard?: boolean;
  stickyKeyboardPosition?: 'left' | 'right';
}

export interface ToolbarContextConfig {
  component?: React.ComponentType<ArgsToolbarCB>;
  sections?: Record<string, ToolbarSection>;
}
