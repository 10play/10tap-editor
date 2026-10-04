import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EditorBridge } from '@10play/tentap-editor';

interface KeyboardDebugBarProps {
  editor: EditorBridge;
  /** Extra state captured with the HTML, e.g. keyboard mount counters. */
  details?: () => string;
}

/** Shows the document HTML on demand, so E2E flows can check what was typed. */
export const KeyboardDebugBar = ({
  editor,
  details,
}: KeyboardDebugBarProps) => {
  const [html, setHtml] = useState('');
  const [detailText, setDetailText] = useState('');
  return (
    <View style={styles.bar}>
      <Pressable
        testID="read-editor-state"
        accessibilityRole="button"
        onPress={async () => {
          setHtml(await editor.getHTML());
          setDetailText(details?.() ?? '');
        }}
      >
        <Text>Read state</Text>
      </Pressable>
      {details && <Text testID="keyboard-details">{detailText}</Text>}
      <Text testID="editor-html" numberOfLines={3}>
        {html}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    padding: 8,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C8C8C9',
  },
});
