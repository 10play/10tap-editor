import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ColorKeyboard,
  CustomKeyboard as CustomKeyboardView,
  EditorKeyboardAvoidingView,
  RichText,
} from '@10play/tentap-editor';
import { spacing, useTheme } from '../theme';
import { useExampleEditor } from '../useExampleEditor';
import { ToolbarWithColor } from './CustomKeyboard';

/**
 * `layout="overlay"`: ColorKeyboard is drawn over the bottom of the window
 * and EditorKeyboardAvoidingView reserves the space of whichever keyboard is
 * up, so the toolbar holds still through a swap.
 */
export const OverlayKeyboard = () => {
  const { colors } = useTheme();
  const editor = useExampleEditor({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: '<p>The toolbar stays put when the keyboards swap.</p>',
  });
  const [activeKeyboard, setActiveKeyboard] = useState<string>();

  return (
    <View style={[styles.fullScreen, { backgroundColor: colors.surface }]}>
      <EditorKeyboardAvoidingView style={styles.fullScreen}>
        <View style={styles.editor}>
          <RichText editor={editor} />
        </View>
        <View style={styles.toolbarRow}>
          <ToolbarWithColor
            editor={editor}
            activeKeyboard={activeKeyboard}
            setActiveKeyboard={setActiveKeyboard}
          />
        </View>
      </EditorKeyboardAvoidingView>
      <CustomKeyboardView
        editor={editor}
        layout="overlay"
        keyboards={[ColorKeyboard]}
        activeKeyboardID={activeKeyboard}
        setActiveKeyboardID={setActiveKeyboard}
        androidKeyboardMode="stable"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  editor: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  toolbarRow: {
    flexDirection: 'row',
  },
});
