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
  useEditorBridge,
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

const customFont = `
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap');
* {
  font-family: 'Roboto', sans-serif;
}
`;

const initialContent = `<p>This is a basic <a href="https://google.com">example</a> of implementing images.</p><img src="https://source.unsplash.com/8xznAGy4HcY/800x400" /><p>s</p>`;

export const Basic = ({}: NativeStackScreenProps<any, any, any>) => {
  const editor = useEditorBridge({
    autofocus: true,
    DEV: true,
    avoidIosKeyboard: true,
    initialContent,
    plugins: [
      // Here we define all the plugins that we want to use
      CoreBridge.configureCSS(customFont), // If we want to add custom css - we can configure it here on the core bridge
      TenTapStartKit,
      UnderlineBridge,
      ImageBridge,
      TaskListBridge,
      PlaceholderBridge.configureExtension({
        placeholder: 'Type something...',
      }),
      LinkBridge.configureExtension({ openOnClick: false }),
      ColorBridge,
      HighlightBridge,
    ],
  });

  const rootRef = useRef(null);
  const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

  return (
    <SafeAreaView style={exampleStyles.fullScreen} ref={rootRef}>
      <View style={exampleStyles.fullScreen}>
        <RichText editor={editor} />
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
          rootRef={rootRef}
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
          keyboards={[ColorKeyboard]}
          editor={editor}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
