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
  CoreBridge,
  HighlightBridge,
  ImageBridge,
  LinkBridge,
  PlaceholderBridge,
  RichText,
  TaskListBridge,
  TenTapStartKit,
  Toolbar,
  UnderlineBridge,
  useNativeEditor,
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
  const editor = useNativeEditor({
    autofocus: true,
    initialContent: `<p>This is a basic <a href="https://google.com">example</a> of implementing images.</p><img src="https://source.unsplash.com/8xznAGy4HcY/800x400" /><p>s</p>`,
    plugins: [
      CoreBridge,
      TenTapStartKit,
      UnderlineBridge,
      ImageBridge,
      TaskListBridge,
      PlaceholderBridge.configure({ placeholder: 'Type something...' }),
      LinkBridge.configure({ openOnClick: false }),
      ColorBridge,
      HighlightBridge,
    ],
  });
  const TapRef = useRef(null);
  const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

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
