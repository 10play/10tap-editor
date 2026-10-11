import React, { useState, type ReactElement, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { EditorBridge } from '@10play/tentap-editor';
import { useCompactKeyboardLayout } from '../../ui/keyboardLayout';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { radii, spacing, type, useTheme } from '../../ui/theme';

interface KeyboardDebugBarProps {
  editor: EditorBridge;
  /** Extra state captured with the HTML, e.g. keyboard mount counters. */
  details?: () => string;
  /** Renders the header row around the read button; a ScreenHeader by default. */
  header?: (readButton: ReactElement) => ReactNode;
}

const defaultHeader = (readButton: ReactElement) => (
  <ScreenHeader right={readButton} />
);

/**
 * The screen header with a button that shows the document HTML, so E2E flows
 * can check what was typed.
 */
export const KeyboardDebugBar = ({
  editor,
  details,
  header = defaultHeader,
}: KeyboardDebugBarProps) => {
  const { colors } = useTheme();
  const [html, setHtml] = useState('');
  const [detailText, setDetailText] = useState('');
  // Its output rows take room the editor needs, like the header.
  const compact = useCompactKeyboardLayout();
  const readButton = (
    <Pressable
      testID="read-editor-state"
      accessibilityRole="button"
      onPress={async () => {
        setHtml(await editor.getHTML());
        setDetailText(details?.() ?? '');
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? colors.accentSoft : colors.chip },
      ]}
    >
      <Text style={[styles.buttonText, { color: colors.accent }]}>
        Read state
      </Text>
    </Pressable>
  );
  return (
    <>
      {header(readButton)}
      {!compact && (
        <View style={styles.output}>
          {details && (
            <Text
              testID="keyboard-details"
              style={[styles.details, { color: colors.textSecondary }]}
            >
              {detailText}
            </Text>
          )}
          <Text
            testID="editor-html"
            numberOfLines={3}
            style={[styles.html, { color: colors.textSecondary }]}
          >
            {html}
          </Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  buttonText: {
    ...type.footnote,
    fontWeight: '600',
  },
  output: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  details: type.caption,
  html: {
    ...type.caption,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
});
