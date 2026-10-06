import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  type FlatListProps,
  type ListRenderItem,
} from 'react-native';
import { useBridgeState } from '../useBridgeState';
import {
  DEFAULT_TOOLBAR_ITEMS,
  HEADING_ITEMS,
  ToolbarContext,
  type ArgsToolbarCB,
  type ToolbarItem,
} from './actions';
import { EditLinkBar } from './EditLinkBar';
import { useKeyboard } from '../../utils';
import type { EditorBridge } from '../../types';
import { ToolbarItemComp } from './ToolbarItemComp';
import { WebToolbar } from './WebToolbar';

export interface ToolbarProps {
  editor: EditorBridge;
  /** Defaults to hidden while the keyboard is down or the editor is blurred. */
  hidden?: boolean;
  items?: ToolbarItem[];
  /** Items of the heading sub-toolbar, `HEADING_ITEMS` by default. */
  headingItems?: ToolbarItem[];
  /** Hides disabled items in both the main and the heading toolbar. */
  shouldHideDisabledToolbarItems?: boolean;
  /**
   * Renders the main and heading toolbars, `FlatList` by default. Use it to
   * plug in a list such as a bottom-sheet `FlatList`.
   */
  ListComponent?: ComponentType<FlatListProps<ToolbarItem>>;
}

export const toolbarStyles = StyleSheet.create({});

// Android hides the IME if the focused link input unmounts before the editor
// has taken focus back.
const ANDROID_LINK_CLOSE_DELAY_MS = 100;

const keyExtractor = (_item: ToolbarItem, index: number) => String(index);

export function Toolbar({
  editor,
  hidden = undefined,
  items = DEFAULT_TOOLBAR_ITEMS,
  headingItems = HEADING_ITEMS,
  shouldHideDisabledToolbarItems = false,
  ListComponent = FlatList,
}: ToolbarProps) {
  const editorState = useBridgeState(editor);
  const { isKeyboardUp } = useKeyboard();
  const [toolbarContext, setToolbarContext] = useState<ToolbarContext>(
    ToolbarContext.Main
  );
  const closeLinkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  useEffect(() => () => clearTimeout(closeLinkTimer.current), []);

  // Android can collapse the editor selection when the link input takes
  // focus, so the link is applied to the last range selected in the editor,
  // which the user may change while the bar stays open.
  const linkSelection = useRef(editorState.selection);
  const { selection, isFocused } = editorState;
  useEffect(() => {
    const reselected = isFocused && selection.from !== selection.to;
    if (toolbarContext !== ToolbarContext.Link || reselected) {
      linkSelection.current = selection;
    }
  }, [selection, isFocused, toolbarContext]);

  const hideToolbar =
    hidden === undefined ? !isKeyboardUp || !editorState.isFocused : hidden;

  const args = useMemo<ArgsToolbarCB>(
    () => ({ editor, editorState, setToolbarContext, toolbarContext }),
    [editor, editorState, toolbarContext]
  );

  const contextItems =
    toolbarContext === ToolbarContext.Heading ? headingItems : items;
  const visibleItems = useMemo(
    () =>
      shouldHideDisabledToolbarItems
        ? contextItems.filter((item) => !item.disabled(args))
        : contextItems,
    [contextItems, shouldHideDisabledToolbarItems, args]
  );

  const { theme } = editor;
  const renderItem = useCallback<ListRenderItem<ToolbarItem>>(
    ({ item }) => <ToolbarItemComp {...item} args={args} editor={editor} />,
    [args, editor]
  );

  const closeLinkBar = () => {
    clearTimeout(closeLinkTimer.current);
    setToolbarContext(ToolbarContext.Main);
  };

  if (toolbarContext === ToolbarContext.Link) {
    return (
      <EditLinkBar
        theme={theme}
        initialLink={editorState.activeLink}
        onLinkIconClick={() => {
          closeLinkBar();
          editor.focus();
        }}
        onEditLink={(link) => {
          if (Platform.OS !== 'android') {
            editor.setLink(link);
            editor.focus();
            closeLinkBar();
            return;
          }
          const { from, to } = linkSelection.current;
          editor.setSelection(from, to);
          editor.setLink(link);
          editor.focus();
          clearTimeout(closeLinkTimer.current);
          closeLinkTimer.current = setTimeout(
            closeLinkBar,
            ANDROID_LINK_CLOSE_DELAY_MS
          );
        }}
      />
    );
  }

  if (Platform.OS === 'web') {
    return (
      <WebToolbar
        items={visibleItems}
        args={args}
        editor={editor}
        hidden={hidden}
      />
    );
  }

  return (
    <ListComponent
      // A fresh list per context starts scrolled to the beginning (#298).
      key={toolbarContext}
      data={visibleItems}
      style={[theme.toolbar.toolbarBody, hideToolbar && theme.toolbar.hidden]}
      renderItem={renderItem}
      // Items read their styles from the editor theme.
      extraData={theme}
      keyExtractor={keyExtractor}
      horizontal
    />
  );
}
