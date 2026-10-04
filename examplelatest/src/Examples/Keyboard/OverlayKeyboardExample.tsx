import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ColorKeyboard,
  CustomKeyboard,
  DEFAULT_TOOLBAR_ITEMS,
  EditorKeyboardAvoidingView,
  Images,
  RichText,
  Toolbar,
  useEditorBridge,
} from '@10play/tentap-editor';

/**
 * `layout="overlay"`: the keyboard is drawn over the bottom of the window and
 * `EditorKeyboardAvoidingView` reserves its space. The padding follows
 * `useKeyboard().keyboardHeight`, which holds through the swap, so nothing
 * depends on KeyboardAvoidingView timing. Suits edge-to-edge apps and
 * react-native-keyboard-controller layouts.
 */
export const OverlayKeyboardExample = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: '<p>The toolbar should not move when you switch.</p>',
  });
  const [activeKeyboard, setActiveKeyboard] = useState<string>();

  return (
    <SafeAreaView style={styles.fullScreen} edges={['top']}>
      <EditorKeyboardAvoidingView style={styles.fullScreen}>
        <RichText editor={editor} testID="keyboard-example-editor" />
        <Toolbar
          editor={editor}
          items={[
            {
              onPress: () => () =>
                setActiveKeyboard((current) =>
                  current === ColorKeyboard.id ? undefined : ColorKeyboard.id
                ),
              active: () => activeKeyboard === ColorKeyboard.id,
              disabled: () => false,
              image: () => Images.palette,
            },
            ...DEFAULT_TOOLBAR_ITEMS,
          ]}
        />
      </EditorKeyboardAvoidingView>
      <CustomKeyboard
        editor={editor}
        layout="overlay"
        keyboards={[ColorKeyboard]}
        activeKeyboardID={activeKeyboard}
        setActiveKeyboardID={setActiveKeyboard}
        androidKeyboardMode="stable"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: 'white',
  },
});
