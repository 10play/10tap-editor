import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useEditorState } from '../useEditorState';
import React, { useEffect, type RefObject } from 'react';
import { DEFAULT_TOOLBAR_ITEMS, type ToolbarItem } from './actions';
import { EditLinkBar } from './EditLinkBar';
import { CustomKeyboard } from '../CustomKeyboard';
import type { EditorInstance } from '../../types';

interface ToolbarProps {
  editor: EditorInstance;
  rootRef: RefObject<any>;
  visible?: boolean;
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
  Color,
}

export function Toolbar({
  editor,
  rootRef,
  visible,
  keyboardAware = true,
  items = DEFAULT_TOOLBAR_ITEMS,
}: ToolbarProps) {
  const editorState = useEditorState(editor);
  const [toolbarContext, setToolbarContext] = React.useState<ToolbarContext>(
    ToolbarContext.Main
  );

  useEffect(() => {
    if (editorState.isFocused) {
      // When focused on editor toolbar should be main
      setToolbarContext(ToolbarContext.Main);
    }
  }, [editorState.isFocused]);

  const args = { editor, editorState, setToolbarContext, toolbarContext };

  const renderToolbar = () => {
    switch (toolbarContext) {
      case ToolbarContext.Main:
      case ToolbarContext.Color:
        return (
          <FlatList
            data={items}
            style={[
              toolbarStyles.toolbar,
              !visible ? toolbarStyles.hidden : undefined,
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
  };

  const toolbar = (
    <>
      {renderToolbar()}
      <CustomKeyboard
        rootRef={rootRef}
        color={toolbarContext === ToolbarContext.Color}
      />
    </>
  );

  if (keyboardAware) {
    return (
      <KeyboardAvoidingView
        behavior="padding" // TODO android
        style={toolbarStyles.keyboardAvoidingView}
      >
        {toolbar}
      </KeyboardAvoidingView>
    );
  }

  return toolbar;
}
