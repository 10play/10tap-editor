import {
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  View,
} from 'react-native';
import { useBridgeState } from '../useBridgeState';
import React from 'react';
import {
  DEFAULT_TOOLBAR_ITEMS,
  HEADING_ITEMS,
  type ToolbarItem,
} from './actions';
import { EditLinkBar } from './EditLinkBar';
import { useKeyboard } from '../../utils';
import type { EditorBridge } from '../../types';

interface ToolbarProps {
  editor: EditorBridge;
  hidden?: boolean;
  items?: ToolbarItem[];
}

const toolbarStyles = StyleSheet.create({
  toolbar: {
    flex: 1,
    borderTopWidth: 0.5,
    borderTopColor: '#DEE0E3',
    minWidth: '100%',
  },
  toolbarButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignContent: 'center',
    backgroundColor: 'white',
  },
  disabled: {
    opacity: 0.3,
  },
  active: {
    backgroundColor: 'lightgray',
  },
  hidden: {
    display: 'none',
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
  iconWrapper: {
    padding: 4,
    borderRadius: 4,
  },
});

export enum ToolbarContext {
  Main,
  Link,
  Heading,
}

const IMAGE_DIM = { height: 16, width: 16 };

export function Toolbar({
  editor,
  hidden = undefined,
  items = DEFAULT_TOOLBAR_ITEMS,
}: ToolbarProps) {
  const editorState = useBridgeState(editor);
  const { isKeyboardUp } = useKeyboard();
  const [toolbarContext, setToolbarContext] = React.useState<ToolbarContext>(
    ToolbarContext.Main
  );

  const hideToolbar =
    hidden || !isKeyboardUp || (!editorState.isFocused && hidden !== false);

  const args = {
    editor,
    editorState,
    setToolbarContext,
    toolbarContext,
  };

  switch (toolbarContext) {
    case ToolbarContext.Main:
    case ToolbarContext.Heading:
      return (
        <FlatList
          data={toolbarContext === ToolbarContext.Main ? items : HEADING_ITEMS}
          style={[
            toolbarStyles.toolbar,
            hideToolbar ? toolbarStyles.hidden : undefined,
          ]}
          renderItem={({ item: { onPress, disabled, active, image } }) => {
            return (
              <TouchableOpacity
                onPress={onPress(args)}
                disabled={disabled(args)}
                style={[toolbarStyles.toolbarButton]}
              >
                <View
                  style={[
                    toolbarStyles.iconWrapper,
                    active(args) ? toolbarStyles.active : undefined,
                    disabled(args) ? toolbarStyles.disabled : undefined,
                  ]}
                >
                  <Image
                    source={image(args)}
                    style={[IMAGE_DIM]}
                    resizeMode="contain"
                  />
                </View>
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
