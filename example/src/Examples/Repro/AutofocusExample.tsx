import React from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';
import { EditorProbe } from './EditorProbe';

/** `autofocus` must bring up the soft keyboard on Android too (#321). */
export const AutofocusExample = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: '<p>Autofocus</p>',
  });

  return (
    <SafeAreaView style={styles.fullScreen}>
      <EditorProbe editor={editor} />
      <View style={styles.fullScreen}>
        <RichText editor={editor} testID="autofocus-editor" />
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
