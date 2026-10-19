import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RichText, useEditorBridge } from '@10play/tentap-editor';
import { useTheme } from '../../ui/theme';
import { EditorProbe, ProbeButton } from './EditorProbe';

const initialContent = '<p>Hello world</p>';
const image =
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707657441/skel_uv9mo1.png';

// ProseMirror positions of "Hello" in the initial paragraph.
const hello = { from: 1, to: 6 };

/**
 * Content and selection APIs: insertContent (#62), getSelectedText (#338),
 * link normalisation (#255), a paragraph after an inserted image (#273) and
 * whitespace-preserving parse options (#327).
 */
export const ContentApiExample = () => {
  const editor = useEditorBridge({ initialContent });
  const [selected, setSelected] = useState('');
  const { colors } = useTheme();

  return (
    <SafeAreaView style={styles.fullScreen}>
      <EditorProbe editor={editor}>
        <ProbeButton
          label="Insert"
          testID="insert-content"
          onPress={() => editor.insertContent('<strong>inserted</strong>')}
        />
        <ProbeButton
          label="Selected text"
          testID="get-selected-text"
          onPress={async () => {
            editor.setSelection(hello.from, hello.to);
            setSelected(await editor.getSelectedText());
          }}
        />
        <ProbeButton
          label="Link"
          testID="set-link"
          onPress={() => {
            editor.setSelection(hello.from, hello.to);
            editor.setLink('www.example.com');
          }}
        />
        <ProbeButton
          label="Image"
          testID="set-image"
          onPress={() => {
            editor.focus('end');
            editor.setImage(image);
          }}
        />
        <ProbeButton
          label="Whitespace"
          testID="set-whitespace-content"
          onPress={() =>
            editor.setContent('<p>a   b</p>', {
              parseOptions: { preserveWhitespace: 'full' },
            })
          }
        />
      </EditorProbe>
      <Text
        testID="selected-text"
        style={[styles.selected, { color: colors.textSecondary }]}
      >{`selected:${selected}`}</Text>
      <View style={styles.fullScreen}>
        <RichText editor={editor} testID="content-api-editor" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  selected: {
    paddingHorizontal: 8,
  },
});
