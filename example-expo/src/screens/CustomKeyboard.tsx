import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import {
  ColorKeyboard,
  CustomKeyboard as CustomKeyboardView,
  DEFAULT_TOOLBAR_ITEMS,
  Images,
  RichText,
  Toolbar,
  useEditorBridge,
  type EditorBridge,
} from '@10play/tentap-editor';

/**
 * A palette toolbar item toggles ColorKeyboard in place of the system
 * keyboard. The toolbar and the custom keyboard share a bottom
 * KeyboardAvoidingView.
 */
export const CustomKeyboard = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent:
      '<p>Select some text and tap the palette to open ColorKeyboard.</p>',
  });
  const [activeKeyboard, setActiveKeyboard] = useState<string>();

  return (
    <View style={styles.fullScreen}>
      <View style={styles.editor}>
        <RichText editor={editor} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
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
      </KeyboardAvoidingView>
    </View>
  );
};

interface ToolbarWithColorProps {
  editor: EditorBridge;
  activeKeyboard: string | undefined;
  setActiveKeyboard: (id: string | undefined) => void;
}

const ToolbarWithColor = ({
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
      },
      ...DEFAULT_TOOLBAR_ITEMS,
    ]}
  />
);

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: 'white',
  },
  editor: {
    flex: 1,
    paddingHorizontal: 12,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});
