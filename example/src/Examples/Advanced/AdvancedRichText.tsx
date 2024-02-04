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
  ImageBridge,
  LinkBridge,
  RichText,
  TaskListBridge,
  TenTapStartKit,
  Toolbar,
  UnderlineBridge,
  useNativeEditor,
} from 'tentap';

// @ts-ignore
import AdvancedEditor from './Editor/build/index.html';
import { CustomKeyboard } from '../../../../src/RichText/Keyboard';
import { ColorKeyboard } from '../../../../src/RichText/Keyboard/ColorKeyboard';
import { BubbleMenuBridge } from './BubbleMenuBridge';

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

export const Advanced = ({}: NativeStackScreenProps<any, any, any>) => {
  const editor = useNativeEditor({
    initialContent: `<p>This is a basic example of implementing images.</p><img src="https://source.unsplash.com/8xznAGy4HcY/800x400" /><p>s sdfdsf fd dsfd ssdfd dsfdsfdsfdsfd</p>`,
    plugins: [
      TenTapStartKit,
      UnderlineBridge,
      ImageBridge,
      TaskListBridge,
      LinkBridge,
      ColorBridge,
      HighlightBridge,
      BubbleMenuBridge,
    ],
  });
  const TapRef = useRef(null);
  const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

  return (
    <SafeAreaView style={exampleStyles.fullScreen} ref={TapRef}>
      <View style={exampleStyles.fullScreen}>
        <RichText
          avoidIosKeyboard
          editor={editor}
          DEV
          autofocus
          customSource={AdvancedEditor}
        />
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
