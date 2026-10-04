import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ColorKeyboard,
  CustomKeyboard,
  DEFAULT_TOOLBAR_ITEMS,
  Images,
  RichText,
  Toolbar,
  useEditorBridge,
  type EditorBridge,
} from '@10play/tentap-editor';

/**
 * The documented ColorKeyboard setup: a palette toolbar item toggles the
 * keyboard, and the toolbar and `CustomKeyboard` share a bottom
 * KeyboardAvoidingView.
 */
export const WithKeyboard = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });
  const [activeKeyboard, setActiveKeyboard] = useState<string>();

  return (
    <SafeAreaView style={styles.fullScreen} edges={['top']}>
      <View style={styles.editor}>
        <RichText editor={editor} testID="keyboard-example-editor" />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ToolbarWithColor
          editor={editor}
          activeKeyboard={activeKeyboard}
          setActiveKeyboard={setActiveKeyboard}
        />
        <CustomKeyboard
          editor={editor}
          keyboards={[ColorKeyboard]}
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface ToolbarWithColorProps {
  editor: EditorBridge;
  activeKeyboard: string | undefined;
  setActiveKeyboard: (id: string | undefined) => void;
}

const ToolbarWithColor = ({
  editor,
  activeKeyboard,
  setActiveKeyboard,
}: ToolbarWithColorProps) => (
  // The toolbar stays up while the custom keyboard is open: useKeyboard()
  // counts it as a keyboard.
  <Toolbar
    editor={editor}
    items={[
      {
        onPress: () => () => {
          const isActive = activeKeyboard === ColorKeyboard.id;
          if (isActive) editor.focus();
          setActiveKeyboard(isActive ? undefined : ColorKeyboard.id);
        },
        active: () => activeKeyboard === ColorKeyboard.id,
        disabled: () => false,
        image: () => Images.palette,
      },
      ...DEFAULT_TOOLBAR_ITEMS,
    ]}
  />
);

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: 'white',
  },
  editor: {
    flex: 1,
    paddingHorizontal: 12,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});

const initialContent = `<p>This is a basic <a href="https://google.com">example</a> of using ColorKeyboard</p><p></p>`;
