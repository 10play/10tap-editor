import React, { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useBridgeState,
  useKeyboard,
  type EditorBridge,
} from '@10play/tentap-editor';

/**
 * Test hooks for the E2E flows: the bridge state and keyboard state as text,
 * the document HTML on demand, and a row of screen-specific actions.
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

  return (
    <View style={styles.probe}>
      <Text testID="editor-status">
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
      <Text testID="editor-html" style={styles.html}>
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
}) => (
  <Pressable
    testID={testID}
    accessibilityRole="button"
    onPress={onPress}
    style={styles.button}
  >
    <Text>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  probe: {
    padding: 8,
    gap: 6,
    backgroundColor: '#f2f2f2',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#dcdcdc',
  },
  html: {
    fontSize: 10,
  },
});
