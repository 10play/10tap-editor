import React from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  RichText,
  TenTapStartKit,
  Toolbar,
  useEditorBridge,
  CollaborationBridge,
} from '@10play/tentap-editor';

export const CollaborationExample = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    DEV: true,
    bridgeExtensions: [
      ...TenTapStartKit,
      CollaborationBridge.configureExtension({
        appId: 'rm8noqmo',
        name: 'document.tentap',
        token: 'your_token',
      }),
    ],
  });

  return (
    <SafeAreaView style={exampleStyles.fullScreen}>
      <RichText editor={editor} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={exampleStyles.keyboardAvoidingView}
      >
        <Toolbar editor={editor} />
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
