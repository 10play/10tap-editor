import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  EditorKeyboardAvoidingView,
  RichText,
  Toolbar,
  useBridgeState,
  useKeyboard,
} from '@10play/tentap-editor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EditorCard } from '../EditorCard';
import { spacing, useTheme } from '../theme';
import { useExampleEditor } from '../useExampleEditor';

/**
 * Two independent editors on one screen. The toolbar follows whichever editor
 * has focus. `EditorKeyboardAvoidingView` shrinks the column above the
 * keyboard, so the second editor stays on screen while it is edited.
 */
export const TwoEditors = () => {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { isKeyboardUp } = useKeyboard();
  const first = useExampleEditor({
    initialContent: '<p>First editor</p>',
  });
  const second = useExampleEditor({
    initialContent: '<p>Second editor</p>',
  });
  const secondFocused = useBridgeState(second).isFocused;
  const active = secondFocused ? second : first;

  return (
    <EditorKeyboardAvoidingView
      style={[styles.fullScreen, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.editors,
          // Clear the home indicator while the toolbar is hidden.
          { paddingBottom: isKeyboardUp ? spacing.sm : bottom + spacing.sm },
        ]}
      >
        <EditorCard label="First" style={styles.editorCard}>
          <RichText editor={first} />
        </EditorCard>
        <EditorCard label="Second" style={styles.editorCard}>
          <RichText editor={second} />
        </EditorCard>
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
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  editorCard: {
    flex: 1,
  },
  toolbarRow: {
    flexDirection: 'row',
  },
});
