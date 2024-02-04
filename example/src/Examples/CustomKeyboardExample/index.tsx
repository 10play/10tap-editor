import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useRef } from 'react';
import {
  SafeAreaView,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  RichText,
  TenTapStartKit,
  Toolbar,
  useNativeEditor,
  type ToolbarItem,
} from 'tentap';
import { CustomKeyboard } from '../../../../src/RichText/Keyboard';
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
  const editor = useNativeEditor({
    plugins: [TenTapStartKit],
  });
  const TapRef = useRef(null);
  const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

  // Add a toolbar item to toggle our custom keyboard
  const toolbarItems: ToolbarItem[] = useMemo(
    () => [
      {
        onPress:
          ({ editor, setActiveKeyboard, activeKeyboard }) =>
          () => {
            const isActive = activeKeyboard === StickerKeyboard.id;
            if (isActive) editor.webviewRef.current?.requestFocus();
            setActiveKeyboard(isActive ? undefined : StickerKeyboard.id);
          },
        active: ({ activeKeyboard }) => activeKeyboard === StickerKeyboard.id,
        disabled: () => false,
        image: () => Images.platte,
      },
    ],
    []
  );

  return (
    <SafeAreaView style={exampleStyles.fullScreen} ref={TapRef}>
      <View style={exampleStyles.fullScreen}>
        <RichText avoidIosKeyboard editor={editor} DEV />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={exampleStyles.keyboardAvoidingView}
      >
        <Toolbar
          activeKeyboard={activeKeyboard}
          setActiveKeyboard={setActiveKeyboard}
          editor={editor}
          items={toolbarItems}
          hidden={false}
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
