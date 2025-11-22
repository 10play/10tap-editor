import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React from 'react';
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
  DEFAULT_TOOLBAR_ITEMS,
  TenTapStartKit,
  CoreBridge,
} from '@10play/tentap-editor';

export const WithKeyboard = ({}: NativeStackScreenProps<any, any, any>) => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(`
      * {
          font-family: 'Rubik', sans-serif;
      }
    `),
    ],
  });

  return (
    <SafeAreaView
      style={{...exampleStyles.fullScreen, backgroundColor: 'white'}}>
      <View style={{...exampleStyles.fullScreen, paddingHorizontal: 12}}>
        <RichText editor={editor} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={exampleStyles.keyboardAvoidingView}>
        <Toolbar editor={editor} items={DEFAULT_TOOLBAR_ITEMS} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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

const initialContent = `<p>This is a basic <a href='https://google.com'>example</a></p><img src="https://source.unsplash.com/8xznAGy4HcY/800x400" /><p></p>`;

export default WithKeyboard;
