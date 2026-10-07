import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  EditorKeyboardAvoidingView,
  RichText,
  Toolbar,
  useEditorBridge,
} from '@10play/tentap-editor';

/**
 * Below a navigation header, `EditorKeyboardAvoidingView` keeps the toolbar
 * on the keyboard without a `keyboardVerticalOffset`: it measures how far
 * the keyboard reaches into it.
 */
export const NavigationHeader = (
  _props: NativeStackScreenProps<any, any, any>
) => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
  });

  return (
    <EditorKeyboardAvoidingView style={exampleStyles.fullScreen}>
      <View style={exampleStyles.fullScreen}>
        <RichText editor={editor} />
      </View>
      <View style={exampleStyles.toolbarRow}>
        <Toolbar editor={editor} />
      </View>
    </EditorKeyboardAvoidingView>
  );
};

const exampleStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  // The toolbar's default flex: 1 would share the column with the editor;
  // in a row it only fills the width.
  toolbarRow: {
    flexDirection: 'row',
  },
});
