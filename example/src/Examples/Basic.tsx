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
  ColorBridge,
  HighlightBridge,
  LinkBridge,
  RichText,
  TaskListBridge,
  TenTapStartKit,
  Toolbar,
  UnderlineBridge,
  useEditor,
} from 'tentap';
import { ColorKeyboard } from '../../../src/RichText/Keyboard/ColorKeyboard';
import { CustomKeyboard } from '../../../src/RichText/Keyboard';

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

export const Basic = ({}: NativeStackScreenProps<any, any, any>) => {
  const editor = useEditor({
    plugins: [
      TenTapStartKit,
      UnderlineBridge,
      TaskListBridge,
      LinkBridge,
      ColorBridge,
      HighlightBridge,
    ],
  });
  const TapRef = useRef(null);
  const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

  return (
    <SafeAreaView style={exampleStyles.fullScreen} ref={TapRef}>
      <View style={exampleStyles.fullScreen}>
        <RichText avoidIosKeyboard editor={editor} autofocus DEV />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={exampleStyles.keyboardAvoidingView}
      >
        <Toolbar
          activeKeyboard={activeKeyboard}
          setActiveKeyboard={setActiveKeyboard}
          editor={editor}
          hidden={false}
        />
        <CustomKeyboard
          rootRef={TapRef}
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
          keyboards={[ColorKeyboard]}
          editor={editor}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
