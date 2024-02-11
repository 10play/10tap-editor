import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef } from 'react';
import {
  SafeAreaView,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  RichText,
  Toolbar,
  useBridgeState,
  useEditorBridge,
  useKeyboard,
  type EditorBridge,
  TenTapStartKit,
  ImageBridge,
} from '@10play/tentap-editor';
import { CustomKeyboard } from '../../../../src/RichText/Keyboard/CustomKeyboardBase';
import { StickerKeyboard } from './StickerKeyboard';
import { Images } from '../../../../src/assets';

const exampleStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});

export const CustomKeyboardExample = ({}: NativeStackScreenProps<
  any,
  any,
  any
>) => {
  const editor = useEditorBridge({
    avoidIosKeyboard: true,
    autofocus: true,
    DEV: true,
    bridgeExtensions: [
      ...TenTapStartKit,
      ImageBridge.configureExtension({
        inline: true,
      }),
    ],
  });
  const TapRef = useRef(null);
  const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

  return (
    <SafeAreaView style={exampleStyles.fullScreen} ref={TapRef}>
      <View style={exampleStyles.fullScreen}>
        <RichText editor={editor} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={exampleStyles.keyboardAvoidingView}
      >
        <StickerToolbar
          activeKeyboard={activeKeyboard}
          setActiveKeyboard={setActiveKeyboard}
          editor={editor}
        />
        <CustomKeyboard
          rootRef={TapRef}
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
          keyboards={[StickerKeyboard]} // Add our custom keyboard to keyboards prop
          editor={editor}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface ToolbarWithColorProps {
  editor: EditorBridge;
  activeKeyboard: string | undefined;
  setActiveKeyboard: (id: string | undefined) => void;
}
const StickerToolbar = ({
  editor,
  activeKeyboard,
  setActiveKeyboard,
}: ToolbarWithColorProps) => {
  // Get updates of editor state
  const editorState = useBridgeState(editor);

  const { isKeyboardUp: isNativeKeyboardUp } = useKeyboard();
  const customKeyboardOpen = activeKeyboard !== undefined;
  const isKeyboardUp = isNativeKeyboardUp || customKeyboardOpen;

  // Here we make sure not to hide the keyboard if our custom keyboard is visible
  const hideToolbar =
    !isKeyboardUp || (!editorState.isFocused && !customKeyboardOpen);

  return (
    <Toolbar
      editor={editor}
      hidden={hideToolbar}
      items={[
        {
          onPress: () => () => {
            const isActive = activeKeyboard === StickerKeyboard.id;
            if (isActive) editor.webviewRef.current?.requestFocus();
            setActiveKeyboard(isActive ? undefined : StickerKeyboard.id);
          },
          active: () => activeKeyboard === StickerKeyboard.id,
          disabled: () => false,
          image: () => Images.palette,
        },
      ]}
    />
  );
};
