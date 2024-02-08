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
  useEditorBridge,
  ColorKeyboard,
  CustomKeyboard,
  CoreBridge,
  TenTapStartKit,
} from '@10play/tentap-editor';

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

// Todo: add example with custom font
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
    avoidIosKeyboard: true,
    initialContent,
    bridgeExtensions: [...TenTapStartKit, CoreBridge.configureCSS(customFont)],
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
