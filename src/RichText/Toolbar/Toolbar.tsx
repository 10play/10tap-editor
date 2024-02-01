import { FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useEditorState } from '../useEditorState';
import React from 'react';
import { DEFAULT_TOOLBAR_ITEMS, type ToolbarItem } from './actions';
import { EditLinkBar } from './EditLinkBar';
import { useKeyboard } from '../../utils';
import type { EditorInstance } from '../../types';

interface ToolbarProps {
  editor: EditorInstance;
  hidden?: boolean;
  keyboardAware?: boolean;
  items?: ToolbarItem[];
}

const toolbarStyles = StyleSheet.create({
  toolbar: {
    display: 'flex',
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: 'lightgray',
    minWidth: '100%',
  },
  toolbarButton: {
    padding: 12,
    alignContent: 'center',
    backgroundColor: 'white',
  },
  disabled: {
    backgroundColor: 'lightgray',
  },
  active: {
    backgroundColor: 'lightblue',
  },
  hidden: {
    display: 'none',
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});

export enum ToolbarContext {
  Main,
  Link,
}

export function Toolbar({
  editor,
  hidden,
  keyboardAware = true,
  items = DEFAULT_TOOLBAR_ITEMS,
}: ToolbarProps) {
  const editorState = useEditorState(editor);
  const { isKeyboardUp } = useKeyboard();
  const [toolbarContext, setToolbarContext] = React.useState<ToolbarContext>(
    ToolbarContext.Main
  );

  const hideToolbar =
    hidden || (keyboardAware && !isKeyboardUp && !editorState.isFocused);

  const args = { editor, editorState, setToolbarContext, toolbarContext };

  switch (toolbarContext) {
    case ToolbarContext.Main:
      return (
        <FlatList
          data={items}
          style={[
            toolbarStyles.toolbar,
            hideToolbar ? toolbarStyles.hidden : undefined,
          ]}
          renderItem={({ item: { onPress, disabled, active, image } }) => {
            return (
              <TouchableOpacity
                onPress={onPress(args)}
                disabled={disabled(args)}
                style={[
                  toolbarStyles.toolbarButton,
                  active(args) ? toolbarStyles.active : undefined,
                  disabled(args) ? toolbarStyles.disabled : undefined,
                ]}
              >
                <Image source={image(args)} width={40} />
              </TouchableOpacity>
            );
          }}
          horizontal
        />
      );
    case ToolbarContext.Link:
      return (
        <EditLinkBar
          initialLink={editorState.activeLink}
          onBlur={() => setToolbarContext(ToolbarContext.Main)}
          onEditLink={(link) => {
            editor.setLink(link);
            editor.webviewRef.current &&
              editor.webviewRef.current.requestFocus();
            setToolbarContext(ToolbarContext.Main);
          }}
        />
      );
  }
}
