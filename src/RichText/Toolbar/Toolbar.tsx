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

export const toolbarStyles = StyleSheet.create({});

export enum ToolbarContext {
  Main,
  Link,
  Heading,
}

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
    hidden === undefined ? !isKeyboardUp || !editorState.isFocused : hidden;

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
            editor.theme.toolbar.toolbarBody,
            hideToolbar ? editor.theme.toolbar.hidden : undefined,
          ]}
          renderItem={({ item: { onPress, disabled, active, image } }) => {
            return (
              <TouchableOpacity
                onPress={onPress(args)}
                disabled={disabled(args)}
                style={[editor.theme.toolbar.toolbarButton]}
              >
                <View
                  style={[
                    editor.theme.toolbar.iconWrapper,
                    active(args)
                      ? editor.theme.toolbar.iconWrapperActive
                      : undefined,
                    disabled(args)
                      ? editor.theme.toolbar.iconWrapperDisabled
                      : undefined,
                  ]}
                >
                  <Image
                    source={image(args)}
                    style={[
                      editor.theme.toolbar.icon,
                      active(args)
                        ? editor.theme.toolbar.iconActive
                        : undefined,
                      disabled(args)
                        ? editor.theme.toolbar.iconDisabled
                        : undefined,
                    ]}
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
          theme={editor.theme}
          initialLink={editorState.activeLink}
          onBlur={() => setToolbarContext(ToolbarContext.Main)}
          onLinkIconClick={() => {
            setToolbarContext(ToolbarContext.Main);
            editor.focus();
          }}
          onEditLink={(link) => {
            editor.setLink(link);
            editor.focus();

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
