import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ColorKeyboard,
  CustomKeyboard as CustomKeyboardView,
  DEFAULT_TOOLBAR_ITEMS,
  EditorKeyboardAvoidingView,
  Images,
  RichText,
  Toolbar,
  type EditorBridge,
} from '@10play/tentap-editor';
import { spacing, useTheme } from '../theme';
import { useExampleEditor } from '../useExampleEditor';

/**
 * A palette toolbar item toggles ColorKeyboard in place of the system
 * keyboard. The toolbar and the custom keyboard share a bottom
 * EditorKeyboardAvoidingView.
 */
export const CustomKeyboard = () => {
  const { colors } = useTheme();
  const editor = useExampleEditor({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent:
      '<p>Select some text and tap the palette to open ColorKeyboard.</p>',
  });
  const [activeKeyboard, setActiveKeyboard] = useState<string>();

  return (
    <View style={[styles.fullScreen, { backgroundColor: colors.surface }]}>
      <View style={styles.editor}>
        <RichText editor={editor} />
      </View>
      <EditorKeyboardAvoidingView style={styles.keyboardAvoidingView}>
        <ToolbarWithColor
          editor={editor}
          activeKeyboard={activeKeyboard}
          setActiveKeyboard={setActiveKeyboard}
        />
        <CustomKeyboardView
          editor={editor}
          keyboards={[ColorKeyboard]}
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
        />
      </EditorKeyboardAvoidingView>
    </View>
  );
};

interface ToolbarWithColorProps {
  editor: EditorBridge;
  activeKeyboard: string | undefined;
  setActiveKeyboard: (id: string | undefined) => void;
}

export const ToolbarWithColor = ({
  editor,
  activeKeyboard,
  setActiveKeyboard,
}: ToolbarWithColorProps) => (
  <Toolbar
    editor={editor}
    items={[
      {
        onPress: () => () => {
          const isActive = activeKeyboard === ColorKeyboard.id;
          if (isActive) editor.focus();
          setActiveKeyboard(isActive ? undefined : ColorKeyboard.id);
        },
        active: () => activeKeyboard === ColorKeyboard.id,
        disabled: () => false,
        image: () => Images.palette,
        label: 'Color keyboard',
      },
      ...DEFAULT_TOOLBAR_ITEMS,
    ]}
  />
);

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  editor: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});
