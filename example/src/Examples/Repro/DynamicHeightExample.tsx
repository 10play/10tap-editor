import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  EditorKeyboardAvoidingView,
  RichText,
  useEditorBridge,
  useScrollToCaret,
} from '@10play/tentap-editor';
import {
  TOP_AND_SIDES,
  useCompactKeyboardLayout,
} from '../../ui/keyboardLayout';
import { paper, radii, useTheme } from '../../ui/theme';
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
 * must keep the caret in view instead of jumping to the top (#323). The
 * first one grows in the ScrollView, which `useScrollToCaret` scrolls to keep
 * the line being typed above the keyboard; it follows the capped editor's
 * caret too, where the keyboard leaves less room than the cap.
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
  const scrollViewRef = useRef<ScrollView>(null);
  const { colors } = useTheme();
  useScrollToCaret(editor, scrollViewRef);
  useScrollToCaret(cappedEditor, scrollViewRef);
  const compact = useCompactKeyboardLayout();

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
    <SafeAreaView style={styles.fullScreen} edges={TOP_AND_SIDES}>
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
      {!compact && (
        <Text
          testID="dynamic-height-status"
          style={[styles.status, { color: colors.text }]}
        >{`height:${Math.round(height)}${status}`}</Text>
      )}
      <EditorKeyboardAvoidingView style={styles.fullScreen}>
        <ScrollView ref={scrollViewRef} keyboardDismissMode="none">
          <View
            style={styles.editorFrame}
            onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
          >
            <RichText editor={editor} testID="dynamic-height-editor" />
          </View>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>
            Capped at 150pt
          </Text>
          <View style={[styles.editorFrame, styles.capped]}>
            <RichText editor={cappedEditor} testID="capped-dynamic-editor" />
          </View>
        </ScrollView>
      </EditorKeyboardAvoidingView>
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
    borderColor: paper.border,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  capped: {
    maxHeight: 150,
  },
  caption: {
    marginHorizontal: 8,
  },
  status: {
    paddingHorizontal: 8,
  },
});
