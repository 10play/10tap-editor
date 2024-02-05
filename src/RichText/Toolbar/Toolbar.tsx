import {
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useNativeEditorState } from '../useNativeEditorState';
import React from 'react';
import { DEFAULT_TOOLBAR_ITEMS, type ToolbarItem } from './actions';
import { EditLinkBar } from './EditLinkBar';
import { useKeyboard } from '../../utils';
import type { EditorInstance } from '../../types';

interface ToolbarProps {
  editor: EditorInstance;
  hidden?: boolean;
  items?: ToolbarItem[];
  setActiveKeyboard: (id: string | undefined) => void;
  activeKeyboard?: string;
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
  items = DEFAULT_TOOLBAR_ITEMS,
  setActiveKeyboard,
  activeKeyboard,
}: ToolbarProps) {
  const editorState = useNativeEditorState(editor);
  const { isKeyboardUp: isNativeKeyboardUp } = useKeyboard();
  const [toolbarContext, setToolbarContext] = React.useState<ToolbarContext>(
    ToolbarContext.Main
  );

  const customKeyboardOpen = activeKeyboard !== undefined;
  const isKeyboardUp = isNativeKeyboardUp || customKeyboardOpen;

  const hideToolbar =
    hidden || !isKeyboardUp || (!editorState.isFocused && !customKeyboardOpen);

  const args = {
    editor,
    editorState,
    setToolbarContext,
    toolbarContext,
    setActiveKeyboard,
    activeKeyboard,
  };

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

            if (Platform.OS === 'android') {
              // On android we dont want to hide the link input before we finished focus on editor
              // Add here 100ms and we can try to find better solution later
              setTimeout(() => {
                setToolbarContext(ToolbarContext.Main);
              }, 100);
            } else {
              setToolbarContext(ToolbarContext.Main);
            }
          }}
        />
      );
  }
}
