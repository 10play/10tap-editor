import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ColorKeyboard,
  CustomKeyboard,
  EditorKeyboardAvoidingView,
  RichText,
  Toolbar,
  useEditorBridge,
} from '@10play/tentap-editor';
import {
  BottomInsetSpacer,
  useCompactKeyboardLayout,
  TOP_AND_SIDES,
} from '../../ui/keyboardLayout';
import { layoutStyles } from '../../ui/styles';
import { KeyboardDebugBar } from './KeyboardDebugBar';
import { KeyboardSwitcher, colorKeyboardEntry } from './KeyboardSwitcher';

/**
 * `layout="overlay"`: the keyboard is drawn over the bottom of the window and
 * `EditorKeyboardAvoidingView` reserves its space. The padding follows
 * `useKeyboard().keyboardHeight`, which holds through the swap, so nothing
 * depends on KeyboardAvoidingView timing. Suits edge-to-edge apps and
 * react-native-keyboard-controller layouts.
 */
export const OverlayKeyboardExample = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: '<p>The toolbar should not move when you switch.</p>',
  });
  const [activeKeyboard, setActiveKeyboard] = useState<string>();
  const compact = useCompactKeyboardLayout();

  return (
    <SafeAreaView style={styles.fullScreen} edges={TOP_AND_SIDES}>
      <KeyboardDebugBar editor={editor} />
      <EditorKeyboardAvoidingView style={styles.fullScreen}>
        <View style={layoutStyles.paper}>
          <RichText editor={editor} testID="keyboard-example-editor" />
        </View>
        {/* A short landscape window keeps a line of the editor above the
            caret by putting the switcher and the toolbar in one row. */}
        <View style={compact && styles.bars}>
          <KeyboardSwitcher editor={editor} entries={[colorKeyboardEntry]} />
          {/* The toolbar's default flex: 1 would share the column with the
              editor; in a row it only fills the width. */}
          <View style={[styles.toolbarRow, compact && styles.fill]}>
            <Toolbar editor={editor} />
          </View>
        </View>
        <BottomInsetSpacer />
      </EditorKeyboardAvoidingView>
      <CustomKeyboard
        editor={editor}
        layout="overlay"
        keyboards={[ColorKeyboard]}
        activeKeyboardID={activeKeyboard}
        setActiveKeyboardID={setActiveKeyboard}
        androidKeyboardMode="stable"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  toolbarRow: {
    flexDirection: 'row',
  },
  bars: {
    flexDirection: 'row',
  },
  fill: {
    flex: 1,
  },
});
