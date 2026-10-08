import React from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { RichText, Toolbar } from '@10play/tentap-editor';
import { useKeyboardVerticalOffset } from '../screenOffset';
import { spacing, useTheme } from '../theme';
import { useExampleEditor } from '../useExampleEditor';

export const Basic = () => {
  const keyboardVerticalOffset = useKeyboardVerticalOffset();
  const { colors } = useTheme();
  const editor = useExampleEditor({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: '<p>This is a basic example</p>',
  });

  return (
    <View style={[styles.fullScreen, { backgroundColor: colors.surface }]}>
      <View style={styles.editor}>
        <RichText editor={editor} />
      </View>
      <KeyboardAvoidingView
        keyboardVerticalOffset={keyboardVerticalOffset}
        behavior="padding"
        style={styles.keyboardAvoidingView}
      >
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  editor: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});
