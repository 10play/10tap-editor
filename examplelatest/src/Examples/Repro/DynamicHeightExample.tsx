import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RichText, useEditorBridge } from '@10play/tentap-editor';
import { EditorProbe, ProbeButton } from './EditorProbe';

const shortContent = '<p>One line</p>';
const longContent = Array.from(
  { length: 15 },
  (_, i) => `<p>Line ${i + 1}</p>`
).join('');

type Check = { kind: 'grow' | 'shrink'; from: number };

const MIN_CHANGE = 100;

/**
 * `dynamicHeight` editors must follow their content as it grows and shrinks
 * (#342, #336). The second editor is capped by its parent: typing at its end
 * must keep the caret in view instead of jumping to the top (#323).
 */
export const DynamicHeightExample = () => {
  const editor = useEditorBridge({
    dynamicHeight: true,
    initialContent: shortContent,
  });
  const cappedEditor = useEditorBridge({
    dynamicHeight: true,
    initialContent: longContent,
  });
  const [height, setHeight] = useState(0);
  const [check, setCheck] = useState<Check>();

  const passed =
    check &&
    (check.kind === 'grow'
      ? height > check.from + MIN_CHANGE
      : height < check.from - MIN_CHANGE);
  const status = check ? ` ${check.kind}:${passed ? 'ok' : 'pending'}` : '';

  const resize = (kind: Check['kind']) => {
    setCheck({ kind, from: height });
    editor.setContent(kind === 'grow' ? longContent : shortContent);
  };

  return (
    <SafeAreaView style={styles.fullScreen}>
      <EditorProbe editor={editor}>
        <ProbeButton
          label="Grow"
          testID="grow-content"
          onPress={() => resize('grow')}
        />
        <ProbeButton
          label="Shrink"
          testID="shrink-content"
          onPress={() => resize('shrink')}
        />
      </EditorProbe>
      <Text testID="dynamic-height-status">{`height:${Math.round(height)}${status}`}</Text>
      <ScrollView keyboardDismissMode="none">
        <View
          style={styles.editorFrame}
          onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
        >
          <RichText editor={editor} testID="dynamic-height-editor" />
        </View>
        <Text style={styles.caption}>Capped at 150pt</Text>
        <View style={[styles.editorFrame, styles.capped]}>
          <RichText editor={cappedEditor} testID="capped-dynamic-editor" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  editorFrame: {
    margin: 8,
    borderWidth: 1,
    borderColor: '#c4c4c4',
  },
  capped: {
    maxHeight: 150,
  },
  caption: {
    marginHorizontal: 8,
  },
});
