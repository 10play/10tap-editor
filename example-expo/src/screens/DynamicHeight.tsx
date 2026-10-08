import React, { useRef } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import {
  EditorKeyboardAvoidingView,
  RichText,
  useScrollToCaret,
} from '@10play/tentap-editor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EditorCard } from '../EditorCard';
import { spacing, useTheme } from '../theme';
import { useExampleEditor } from '../useExampleEditor';

const longContent = Array.from(
  { length: 15 },
  (_, i) => `<p>Line ${i + 1}</p>`
).join('');

/**
 * `dynamicHeight` editors size themselves to their content. The second one is
 * capped by its parent and scrolls inside it. The first one grows inside the
 * ScrollView, which `useScrollToCaret` scrolls to keep the line being typed
 * above the keyboard.
 */
export const DynamicHeight = () => {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const editor = useExampleEditor({
    dynamicHeight: true,
    initialContent: '<p>Type here: the editor grows with its content.</p>',
  });
  const cappedEditor = useExampleEditor({
    dynamicHeight: true,
    initialContent: longContent,
  });
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollToCaret(editor, scrollViewRef);

  return (
    <EditorKeyboardAvoidingView
      style={[styles.fullScreen, { backgroundColor: colors.background }]}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottom + spacing.lg },
        ]}
      >
        <EditorCard label="Grows with its content">
          <RichText editor={editor} />
        </EditorCard>
        <EditorCard label="Capped at 150pt" style={styles.capped}>
          <RichText editor={cappedEditor} />
        </EditorCard>
      </ScrollView>
    </EditorKeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  capped: {
    maxHeight: 150,
    overflow: 'hidden',
  },
});
