import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Button,
} from 'react-native';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';

export const WithBottomSheet = ({}: NativeStackScreenProps<any, any, any>) => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });

  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  return (
    <SafeAreaView style={exampleStyles.fullScreen}>
      <Button title="Open Bottom Sheet" onPress={openBottomSheet} />
      <BottomSheet snapPoints={['70%']} ref={bottomSheetRef}>
        <Button title="Close Bottom Sheet" onPress={closeBottomSheet} />
        <RichText editor={editor} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={exampleStyles.keyboardAvoidingView}
        >
          <Toolbar editor={editor} ListComponent={BottomSheetFlatList} />
        </KeyboardAvoidingView>
      </BottomSheet>
    </SafeAreaView>
  );
};

const exampleStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});

const initialContent = `<p>This is a basic example!</p>`;
