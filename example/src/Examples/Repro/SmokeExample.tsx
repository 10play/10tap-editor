import React from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';
import { EditorProbe, ProbeButton } from './EditorProbe';

/** Editor basics for the smoke flow: type, format, undo, read the HTML. */
export const SmokeExample = () => {
  const editor = useEditorBridge({
    avoidIosKeyboard: true,
    initialContent: '<p>Smoke test</p>',
  });

  return (
    <SafeAreaView style={styles.fullScreen}>
      <EditorProbe editor={editor}>
        <ProbeButton
          label="Bold"
          testID="toggle-bold"
          onPress={() => editor.toggleBold()}
        />
        <ProbeButton label="Undo" testID="undo" onPress={() => editor.undo()} />
      </EditorProbe>
      <View style={styles.fullScreen}>
        <RichText editor={editor} testID="smoke-editor" />
      </View>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardAvoidingView}
      >
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </SafeAreaView>
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
