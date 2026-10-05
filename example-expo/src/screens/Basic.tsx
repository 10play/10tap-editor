import React from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';
import { useKeyboardVerticalOffset } from '../screenOffset';

export const Basic = () => {
  const keyboardVerticalOffset = useKeyboardVerticalOffset();
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: '<p>This is a basic example</p>',
  });

  return (
    <View style={styles.fullScreen}>
      <RichText editor={editor} />
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
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});
