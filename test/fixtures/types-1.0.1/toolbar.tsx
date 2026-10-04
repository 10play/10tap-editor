// 1.0.1 toolbar customisation: custom items, the default items and contexts.
import React from 'react';
import { Platform } from 'react-native';
import {
  DEFAULT_TOOLBAR_ITEMS,
  Images,
  Toolbar,
  ToolbarItems,
  type EditorBridge,
  type ToolbarItem,
} from '@10play/tentap-editor';

export const customItem: ToolbarItem = {
  onPress:
    ({ editor, editorState, setToolbarContext, toolbarContext }) =>
    () => {
      editor.toggleBold();
      setToolbarContext(toolbarContext);
      setToolbarContext((previous) => previous);
      return editorState.isBoldActive;
    },
  active: ({ editorState }) => editorState.isBoldActive,
  disabled: ({ editorState }) => !editorState.canToggleBold,
  image: () => Images.bold,
};

export const imageKeys = [
  Images.indent,
  Images.outdent,
  Images.bold,
  Images.italic,
  Images.underline,
  Images.strikethrough,
  Images.h1,
  Images.h2,
  Images.h3,
  Images.h4,
  Images.h5,
  Images.h6,
  Images.orderedList,
  Images.bulletList,
  Images.checkList,
  Images.undo,
  Images.redo,
  Images.link,
  Images.palette,
  Images.code,
  Images.quote,
  Images.Aa,
  Images.a,
  Images.close,
];

export const toolbarItemValues: string[] = [
  ToolbarItems.ChangeHighlight,
  ToolbarItems.ChangeColor,
  ToolbarItems.Link,
  ToolbarItems.ToggleUnderline,
  ToolbarItems.SetHardBreak,
  ToolbarItems.ToggleH1,
  ToolbarItems.ToggleH6,
];

export const Toolbars = ({ editor }: { editor: EditorBridge }) => (
  <>
    <Toolbar editor={editor} />
    <Toolbar
      editor={editor}
      hidden={Platform.OS === 'web'}
      items={[customItem, ...DEFAULT_TOOLBAR_ITEMS]}
      shouldHideDisabledToolbarItems
    />
  </>
);
