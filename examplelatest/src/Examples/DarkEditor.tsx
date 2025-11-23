import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  View,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  RichText,
  Toolbar,
  useEditorBridge,
  DEFAULT_TOOLBAR_ITEMS,
  useKeyboard,
  type EditorBridge,
  useBridgeState,
  TenTapStartKit,
  CoreBridge,
  darkEditorTheme,
  darkEditorCss,
} from '@10play/tentap-editor';

const EDITOR_BACKGROUND_COLOR = '#1C1C1E';

export const DarkEditor = ({}: NativeStackScreenProps<any, any, any>) => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(darkEditorCss),
    ],
    theme: darkEditorTheme,
  });

  return (
    <SafeAreaView
      style={{
        ...exampleStyles.fullScreen,
        backgroundColor: EDITOR_BACKGROUND_COLOR,
      }}
    >
      <View
        style={{
          ...exampleStyles.fullScreen,
          paddingHorizontal: 12,
          backgroundColor: EDITOR_BACKGROUND_COLOR,
        }}
      >
        <RichText editor={editor} />
      </View>
      <KeyboardAvoidingView
        behavior={'padding'}
        style={exampleStyles.keyboardAvoidingView}
      >
        <ToolbarWithColor editor={editor} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface ToolbarWithColorProps {
  editor: EditorBridge;
}
const ToolbarWithColor = ({ editor }: ToolbarWithColorProps) => {
  // Get updates of editor state
  const editorState = useBridgeState(editor);

  const { isKeyboardUp: isNativeKeyboardUp } = useKeyboard();
  const hideToolbar = !isNativeKeyboardUp || !editorState.isFocused;

  return (
    <Toolbar
      editor={editor}
      hidden={hideToolbar}
      items={DEFAULT_TOOLBAR_ITEMS}
    />
  );
};

const exampleStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});

const initialContent = `<p>dark</p>`;
