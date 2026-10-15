import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet,
  View,
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
import { ScreenHeader } from '../ui/ScreenHeader';
import { layoutStyles } from '../ui/styles';

const EDITOR_BACKGROUND_COLOR = '#1C1C1E';
const headerColors = {
  text: '#F2F2F7',
  textSecondary: '#9C9CA3',
  accent: '#7C8CFF',
};

export const DarkEditor = (_props: NativeStackScreenProps<any, any, any>) => {
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
    <SafeAreaView style={exampleStyles.screen}>
      <StatusBar barStyle="light-content" />
      <ScreenHeader colors={headerColors} />
      <View style={exampleStyles.editor}>
        <RichText editor={editor} />
      </View>
      <KeyboardAvoidingView
        behavior={'padding'}
        style={layoutStyles.keyboardAvoidingView}
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
  screen: {
    flex: 1,
    backgroundColor: EDITOR_BACKGROUND_COLOR,
  },
  editor: {
    flex: 1,
    paddingHorizontal: 16,
  },
});

const initialContent = `<p>dark</p>`;
