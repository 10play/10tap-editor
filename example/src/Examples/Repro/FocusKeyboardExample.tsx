import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  EditorKeyboardAvoidingView,
  RichText,
  Toolbar,
  useEditorBridge,
} from '@10play/tentap-editor';
import { useTheme } from '../../ui/theme';
import { EditorProbe, ProbeButton } from './EditorProbe';

/** Seconds for a D-pad key press to take the device out of touch mode. */
const REMOUNT_DELAY_MS = 3000;

const Editor = ({
  searchOpen,
  setSearchOpen,
  remount,
}: {
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  remount: () => void;
}) => {
  const editor = useEditorBridge({
    autofocus: true,
    initialContent: '<p>Focus keyboard</p>',
  });
  const { colors } = useTheme();

  return (
    <>
      <EditorProbe editor={editor}>
        <ProbeButton
          label="Search"
          testID="open-search"
          onPress={() => setSearchOpen(true)}
        />
        <ProbeButton
          label="Back to editor"
          testID="close-search"
          onPress={() => {
            // Unmounts the focused input in the same tick, as apps do.
            setSearchOpen(false);
            editor.focus();
          }}
        />
        <ProbeButton
          label="Select word"
          testID="select-word"
          onPress={() => editor.setSelection(1, 6)}
        />
        <ProbeButton
          label="Remount"
          testID="remount-editor"
          onPress={remount}
        />
      </EditorProbe>
      {searchOpen && (
        <TextInput
          testID="search-input"
          autoFocus
          placeholder="Search"
          placeholderTextColor={colors.textSecondary}
          style={[styles.search, { color: colors.text }]}
        />
      )}
      <View style={styles.fullScreen}>
        <RichText editor={editor} testID="focus-keyboard-editor" />
      </View>
      <EditorKeyboardAvoidingView>
        <View style={styles.toolbar}>
          <Toolbar editor={editor} />
        </View>
      </EditorKeyboardAvoidingView>
    </>
  );
};

/**
 * Android: focusing the editor must bring up the soft keyboard after a
 * search input that had it unmounts, after inserting a link from the link
 * bar, and when autofocus runs while the device is not in touch mode
 * (Remount waits a few seconds for a D-pad key press).
 */
export const FocusKeyboardExample = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [key, setKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  return (
    <SafeAreaView style={styles.fullScreen} edges={['bottom']}>
      <Editor
        key={key}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        remount={() => {
          clearTimeout(timer.current);
          timer.current = setTimeout(
            () => setKey((value) => value + 1),
            REMOUNT_DELAY_MS
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  search: {
    padding: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolbar: {
    flexDirection: 'row',
  },
});
