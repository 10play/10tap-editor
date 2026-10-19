import React, { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useBridgeState,
  useKeyboard,
  type EditorBridge,
} from '@10play/tentap-editor';
import { useCompactKeyboardLayout } from '../../ui/keyboardLayout';
import { radii, useTheme } from '../../ui/theme';

/**
 * Test hooks for the E2E flows: the bridge state and keyboard state as text,
 * the document HTML on demand, and a row of screen-specific actions. Hidden
 * like the screen header while a keyboard is up in a short landscape window.
 */
export const EditorProbe = ({
  editor,
  children,
}: {
  editor: EditorBridge;
  children?: ReactNode;
}) => {
  const { isReady, editable } = useBridgeState(editor);
  const { isKeyboardUp } = useKeyboard();
  const [html, setHtml] = useState('');
  const { colors } = useTheme();
  const compact = useCompactKeyboardLayout();

  if (compact) return null;
  return (
    <View style={[styles.probe, { backgroundColor: colors.surface }]}>
      <Text testID="editor-status" style={{ color: colors.text }}>
        {`ready:${isReady} editable:${editable} keyboard:${isKeyboardUp ? 'up' : 'down'}`}
      </Text>
      <View style={styles.actions}>
        <ProbeButton
          label="Read state"
          testID="read-editor-state"
          onPress={async () => setHtml(await editor.getHTML())}
        />
        {children}
      </View>
      <Text
        testID="editor-html"
        style={[styles.html, { color: colors.textSecondary }]}
      >
        {html}
      </Text>
    </View>
  );
};

export const ProbeButton = ({
  label,
  testID,
  onPress,
}: {
  label: string;
  testID: string;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? colors.accentSoft : colors.chip },
      ]}
    >
      <Text style={[styles.label, { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  probe: {
    padding: 8,
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  label: {
    fontWeight: '600',
  },
  html: {
    fontSize: 10,
  },
});
