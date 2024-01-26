import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { type Editor } from '../useEditor';
import { useEditorState } from '../useEditorState';
import React, { useMemo } from 'react';
import {
  type ToolbarAction,
  type ToolbarItemType,
  DEFAULT_TOOLBAR_ITEMS,
  getToolbarActions,
} from './actions';
import { EditLinkBar } from './EditLinkBar';

interface ToolbarProps {
  editor: Editor;
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
}

export function Toolbar({
  editor,
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
      setToolbarContext
    );
    console.log('ddd3323', items);
    return items.map((item) => allActions[item]);
  }, [editor, editorState, items, setToolbarContext]);

  const toolbar =
    toolbarContext === ToolbarContext.Main ? (
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
    ) : (
      <EditLinkBar
        initialLink={editorState.activeLink}
        onBlur={() => setToolbarContext(ToolbarContext.Main)}
        onEditLink={(link) => {
          editor.editLink(link);
          editor.webviewRef.current && editor.webviewRef.current.requestFocus();
          setToolbarContext(ToolbarContext.Main);
        }}
      />
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
