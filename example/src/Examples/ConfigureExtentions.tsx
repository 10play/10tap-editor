import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { SafeAreaView, View, StyleSheet, Button } from 'react-native';
import {
  LinkBridge,
  PlaceholderBridge,
  RichText,
  TenTapStartKit,
  useEditorBridge,
} from '@10play/tentap-editor';

export const ConfigureExtensions = ({}: NativeStackScreenProps<
  any,
  any,
  any
>) => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    bridgeExtensions: [
      PlaceholderBridge.configureExtension({
        placeholder: 'Hey there! Start typing...',
      }),
      LinkBridge.configureExtension({ openOnClick: false }),
      ...TenTapStartKit,
    ],
  });

  return (
    <SafeAreaView style={exampleStyles.fullScreen}>
      <View style={exampleStyles.fullScreen}>
        <RichText editor={editor} />
      </View>
      <View style={exampleStyles.fullScreen}>
        <Button
          title="Click Me To Add Link"
          onPress={() => {
            editor.setContent(
              '<a href="https://10play.github.io/10tap-editor">Link To TenTap!</a>'
            );
          }}
        />
        <Button
          title="Click Me To Show PlaceHolder"
          onPress={() => {
            editor.setContent('');
          }}
        />
      </View>
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
