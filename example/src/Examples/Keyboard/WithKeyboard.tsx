import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ColorKeyboard,
  CustomKeyboard,
  EditorKeyboardAvoidingView,
  DEFAULT_TOOLBAR_ITEMS,
  Images,
  RichText,
  Toolbar,
  useEditorBridge,
  type EditorBridge,
} from '@10play/tentap-editor';
import { EditorPaper, TOP_AND_SIDES } from '../../ui/keyboardLayout';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { layoutStyles } from '../../ui/styles';

/**
 * The documented ColorKeyboard setup: a palette toolbar item toggles the
 * keyboard, and the toolbar and `CustomKeyboard` share a bottom
 * EditorKeyboardAvoidingView.
 */
export const WithKeyboard = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });
  const [activeKeyboard, setActiveKeyboard] = useState<string>();

  return (
    <SafeAreaView style={layoutStyles.fullScreen} edges={TOP_AND_SIDES}>
      <ScreenHeader />
      <EditorPaper>
        <RichText editor={editor} testID="keyboard-example-editor" />
      </EditorPaper>
      <EditorKeyboardAvoidingView style={layoutStyles.keyboardAvoidingView}>
        <ToolbarWithColor
          editor={editor}
          activeKeyboard={activeKeyboard}
          setActiveKeyboard={setActiveKeyboard}
        />
        <CustomKeyboard
          editor={editor}
          keyboards={[ColorKeyboard]}
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
        />
      </EditorKeyboardAvoidingView>
    </SafeAreaView>
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
  // The toolbar stays up while the custom keyboard is open: useKeyboard()
  // counts it as a keyboard.
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
        label: 'Colors',
      },
      ...DEFAULT_TOOLBAR_ITEMS,
    ]}
  />
);

const initialContent = `<p>This is a basic <a href="https://google.com">example</a> of using ColorKeyboard</p><p></p>`;
