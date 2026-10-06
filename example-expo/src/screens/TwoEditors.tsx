import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  EditorKeyboardAvoidingView,
  RichText,
  Toolbar,
  useBridgeState,
  useEditorBridge,
} from '@10play/tentap-editor';

/**
 * Two independent editors on one screen. The toolbar follows whichever editor
 * has focus. `EditorKeyboardAvoidingView` shrinks the column above the
 * keyboard, so the second editor stays on screen while it is edited.
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
    <EditorKeyboardAvoidingView style={styles.fullScreen}>
      <View style={styles.editors}>
        <Text style={styles.caption}>First</Text>
        <View style={styles.editorFrame}>
          <RichText editor={first} />
        </View>
        <Text style={styles.caption}>Second</Text>
        <View style={styles.editorFrame}>
          <RichText editor={second} />
        </View>
      </View>
      <View style={styles.toolbarRow}>
        <Toolbar editor={active} />
      </View>
    </EditorKeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  editors: {
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
  toolbarRow: {
    flexDirection: 'row',
  },
});
