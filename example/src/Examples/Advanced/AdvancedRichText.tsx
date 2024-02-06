import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef } from 'react';
import { SafeAreaView, View, StyleSheet, Text } from 'react-native';
import {
  ColorBridge,
  HighlightBridge,
  ImageBridge,
  LinkBridge,
  RichText,
  TaskListBridge,
  TenTapStartKit,
  UnderlineBridge,
  useNativeEditor,
  useNativeEditorState,
  type EditorInstance,
} from 'tentap';

// @ts-ignore
import AdvancedEditor from './Editor/build/index.html';
import { CounterBridge } from './CounterBridge';

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

const Counter = ({ editor }: { editor: EditorInstance }) => {
  const state = useNativeEditorState(editor);
  return (
    <View>
      <Text>
        {state.wordCount} || {state.characterCount}
      </Text>
    </View>
  );
};

export const Advanced = ({}: NativeStackScreenProps<any, any, any>) => {
  const editor = useNativeEditor({
    autofocus: true,
    initialContent: `<p>This is a basic example of implementing images.</p><img src="https://source.unsplash.com/8xznAGy4HcY/800x400" /><p>s sdfdsf fd dsfd ssdfd dsfdsfdsfdsfd</p>`,
    plugins: [
      TenTapStartKit,
      UnderlineBridge,
      ImageBridge,
      TaskListBridge,
      LinkBridge,
      ColorBridge,
      HighlightBridge,
      CounterBridge,
    ],
  });
  const TapRef = useRef(null);

  return (
    <SafeAreaView style={exampleStyles.fullScreen} ref={TapRef}>
      <View style={exampleStyles.fullScreen}>
        <Counter editor={editor} />
        <RichText
          avoidIosKeyboard
          editor={editor}
          DEV
          customSource={AdvancedEditor}
        />
      </View>
    </SafeAreaView>
  );
};
