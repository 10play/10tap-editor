import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RichText, useEditorBridge } from '@10play/tentap-editor';

const longContent = Array.from(
  { length: 15 },
  (_, i) => `<p>Line ${i + 1}</p>`
).join('');

/**
 * `dynamicHeight` editors size themselves to their content. The second one is
 * capped by its parent and scrolls inside it.
 */
export const DynamicHeight = () => {
  const editor = useEditorBridge({
    dynamicHeight: true,
    initialContent: '<p>Type here: the editor grows with its content.</p>',
  });
  const cappedEditor = useEditorBridge({
    dynamicHeight: true,
    initialContent: longContent,
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.caption}>Grows with its content</Text>
      <View style={styles.editorFrame}>
        <RichText editor={editor} />
      </View>
      <Text style={styles.caption}>Capped at 150pt</Text>
      <View style={[styles.editorFrame, styles.capped]}>
        <RichText editor={cappedEditor} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 8,
    gap: 8,
  },
  editorFrame: {
    borderWidth: 1,
    borderColor: '#c4c4c4',
  },
  capped: {
    maxHeight: 150,
  },
  caption: {
    color: '#666',
  },
});
