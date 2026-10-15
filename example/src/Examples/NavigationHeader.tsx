import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import {
  EditorKeyboardAvoidingView,
  RichText,
  Toolbar,
  useEditorBridge,
} from '@10play/tentap-editor';
import {
  EditorPaper,
  TOP_AND_SIDES,
  useCompactKeyboardLayout,
} from '../ui/keyboardLayout';
import { spacing } from '../ui/theme';

/**
 * Below a navigation header, `EditorKeyboardAvoidingView` keeps the toolbar
 * on the keyboard without a `keyboardVerticalOffset`: it measures how far
 * the keyboard reaches into it. The header hides while a keyboard is up in a
 * short landscape window, like the other screens' headers; the screen then
 * keeps clear of the status bar itself.
 */
export const NavigationHeader = ({
  navigation,
}: NativeStackScreenProps<any, any, any>) => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
  });
  const compact = useCompactKeyboardLayout();

  useEffect(() => {
    navigation.setOptions({ headerShown: !compact });
  }, [compact, navigation]);

  return (
    <SafeAreaView
      style={exampleStyles.fullScreen}
      edges={compact ? TOP_AND_SIDES : NO_EDGES}
    >
      <EditorKeyboardAvoidingView style={exampleStyles.fullScreen}>
        <EditorPaper style={exampleStyles.paper}>
          <RichText editor={editor} />
        </EditorPaper>
        <View style={exampleStyles.toolbarRow}>
          <Toolbar editor={editor} />
        </View>
      </EditorKeyboardAvoidingView>
    </SafeAreaView>
  );
};

const NO_EDGES: Edge[] = [];

const exampleStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  paper: {
    marginTop: spacing.sm,
  },
  // The toolbar's default flex: 1 would share the column with the editor;
  // in a row it only fills the width.
  toolbarRow: {
    flexDirection: 'row',
  },
});
