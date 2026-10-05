import React from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native';
import {
  RichText,
  Toolbar,
  useBridgeState,
  useEditorBridge,
} from '@10play/tentap-editor';

/**
 * Two independent editors on one screen. The toolbar follows whichever editor
 * has focus.
 */
export const TwoEditors = () => {
  const first = useEditorBridge({
    initialContent: '<p>First editor</p>',
  });
  const second = useEditorBridge({
    initialContent: '<p>Second editor</p>',
  });
  const secondFocused = useBridgeState(second).isFocused;
  const active = secondFocused ? second : first;

  return (
    <View style={styles.fullScreen}>
      <Text style={styles.caption}>First</Text>
      <View style={styles.editorFrame}>
        <RichText editor={first} />
      </View>
      <Text style={styles.caption}>Second</Text>
      <View style={styles.editorFrame}>
        <RichText editor={second} />
      </View>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardAvoidingView}
      >
        <Toolbar editor={active} />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    padding: 8,
    gap: 8,
  },
  editorFrame: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#c4c4c4',
  },
  caption: {
    color: '#666',
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});
