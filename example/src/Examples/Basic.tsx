import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';
import { ScreenHeader } from '../ui/ScreenHeader';
import { EditorPaper } from '../ui/keyboardLayout';
import { layoutStyles } from '../ui/styles';

export const Basic = (_props: NativeStackScreenProps<any, any, any>) => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });

  return (
    <SafeAreaView style={layoutStyles.fullScreen}>
      <ScreenHeader />
      <EditorPaper>
        <RichText editor={editor} />
      </EditorPaper>
      <KeyboardAvoidingView
        behavior={'padding'}
        style={layoutStyles.keyboardAvoidingView}
      >
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const initialContent = `<p>This is a basic example</p>`;
