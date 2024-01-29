import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { type Editor } from '../useEditor';
import { useEditorState } from '../useEditorState';
import React, { useEffect, useMemo, type RefObject } from 'react';
import {
  type ToolbarAction,
  type ToolbarItemType,
  DEFAULT_TOOLBAR_ITEMS,
  getToolbarActions,
} from './actions';
import { EditLinkBar } from './EditLinkBar';
import { Platform } from 'react-native';
import { CustomKeyboard } from '../Keyboard';

interface ToolbarProps {
  editor: Editor;
  rootRef: RefObject<any>;
  visible?: boolean;
  keyboardAware?: boolean;
  items?: ToolbarItemType[];
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

  const toolbarItems: ToolbarAction[] = useMemo(() => {
    const allActions = getToolbarActions(
      editor,
      editorState,
      setToolbarContext,
      toolbarContext
    );
    return items.map((item) => allActions[item]);
  }, [editor, editorState, items, setToolbarContext, toolbarContext]);

  useEffect(() => {
    if (editorState.isFocused) {
      // When focused on editor toolbar should be main
      setToolbarContext(ToolbarContext.Main);
    }
  }, [editorState.isFocused]);

  const renderToolbar = () => {
    switch (toolbarContext) {
      case ToolbarContext.Main:
      case ToolbarContext.Color:
        return (
          <FlatList
            data={toolbarItems}
            style={[
              toolbarStyles.toolbar,
              !visible ? toolbarStyles.hidden : undefined,
            ]}
            renderItem={({ item: { onPress, disabled, active, image } }) => {
              return (
                <TouchableOpacity
                  onPress={onPress}
                  disabled={disabled}
                  style={[
                    toolbarStyles.toolbarButton,
                    active ? toolbarStyles.active : undefined,
                    disabled ? toolbarStyles.disabled : undefined,
                  ]}
                >
                  <Image source={image} width={40} />
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
              editor.editLink(link);
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={toolbarStyles.keyboardAvoidingView}
      >
        {toolbar}
      </KeyboardAvoidingView>
    );
  }

  return toolbar;
}
