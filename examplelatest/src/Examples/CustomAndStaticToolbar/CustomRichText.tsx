import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { RichText, useBridgeState } from '../../../../src/RichText';
import type { EditorBridge } from '../../../../src/types';
import { icons } from '../../assets';
import { Icon } from '../Icon';
import { useKeyboard } from '../../../../src/utils';

interface ComposeRichTextProps {
  editor: EditorBridge;
  onSendClick: () => void;
}
export const ComposeRichText = ({
  editor,
  onSendClick,
}: ComposeRichTextProps) => {
  return (
    <>
      <View style={composeStyles.compose}>
        <RichText editor={editor} />
      </View>
      <KeyboardAvoidingView
        behavior={'padding'}
        style={composeStyles.keyboardAvoidingView}
      >
        <ComposeToolbar editor={editor} onSendClick={onSendClick} />
      </KeyboardAvoidingView>
    </>
  );
};

interface ComposeToolbarProps {
  editor: EditorBridge;
  onSendClick: () => void;
}
interface CustomToolbarAction {
  isActive: boolean;
  isDisabled: boolean;
  onPress: () => void;
  icon: keyof typeof icons;
}
enum ToolbarType {
  Main,
  Link,
  Formatting,
}
const ComposeToolbar = ({ editor, onSendClick }: ComposeToolbarProps) => {
  const editorState = useBridgeState(editor);
  const { isKeyboardUp } = useKeyboard();
  const [toolbarType, setToolbar] = useState<ToolbarType>(ToolbarType.Main);

  const hideToolbar = !isKeyboardUp || !editorState.isFocused;

  useEffect(() => {
    if (hideToolbar) {
      setToolbar(ToolbarType.Main);
    }
  }, [hideToolbar]);

  const formattingOptions: CustomToolbarAction[] = useMemo(
    () => [
      {
        isActive: true,
        isDisabled: false,
        onPress: () => {
          setToolbar(ToolbarType.Main);
        },
        icon: 'formatting',
      },
      {
        isActive: editorState.isBoldActive,
        isDisabled: !editorState.canToggleBold,
        onPress: editor.toggleBold,
        icon: 'bold',
      },
      {
        isActive: editorState.headingLevel === 1,
        isDisabled: !editorState.canToggleHeading,
        onPress: () => editor.toggleHeading(1),
        icon: 'h1',
      },
    ],
    [editor, editorState]
  );

  if (toolbarType === ToolbarType.Main) {
    return (
      <View
        style={[hideToolbar && composeStyles.hidden, composeStyles.mainToolbar]}
      >
        <TouchableOpacity onPress={() => setToolbar(ToolbarType.Formatting)}>
          <Icon name={'formatting'} style={composeStyles.button} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSendClick}>
          <Icon name={'send'} style={composeStyles.button} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        hideToolbar && composeStyles.hidden,
        composeStyles.formattingToolbar,
      ]}
    >
      {formattingOptions.map(({ isDisabled, isActive, icon, onPress }) => (
        <TouchableOpacity
          onPress={onPress}
          disabled={isDisabled}
          style={isActive ? composeStyles.activeButton : undefined}
          key={icon}
        >
          <Icon
            name={icon}
            fill={isDisabled ? 'gray' : 'black'}
            style={composeStyles.button}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const composeStyles = StyleSheet.create({
  compose: {
    flex: 1,
    paddingHorizontal: 14,
    backgroundColor: 'white',
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
  mainToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'lightgray',
  },
  formattingToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: 'white',
    borderTopWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
    borderTopColor: 'lightgray',
  },
  button: {
    width: 24,
    margin: 4,
    padding: 5,
  },
  activeButton: {
    backgroundColor: 'lightblue',
    borderRadius: 10,
  },
  hidden: {
    display: 'none',
  },
});
