import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Platform,
  StyleSheet,
  Button,
  Keyboard,
  type KeyboardEvent,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
} from 'react-native';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';

const useKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    function onKeyboardDidShow(e: KeyboardEvent) {
      // Remove type here if not using TypeScript
      setKeyboardHeight(e.endCoordinates.height);
    }

    function onKeyboardDidHide() {
      setKeyboardHeight(0);
    }

    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      onKeyboardDidShow
    );
    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      onKeyboardDidHide
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardHeight;
};

export const WithBottomSheet = ({}: NativeStackScreenProps<any, any, any>) => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const keyboardHeight = useKeyboard();
  const editor = useEditorBridge({
    // autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });
  const openBottomSheet = () => {
    bottomSheetRef.current?.snapToIndex(0);
  };

  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  return (
    <SafeAreaView style={exampleStyles.fullScreen}>
      <Button title="Open Bottom Sheet" onPress={openBottomSheet} />
      <Portal>
        <BottomSheet
          snapPoints={['90%']}
          ref={bottomSheetRef}
          keyboardBehavior="extend"
          android_keyboardInputMode="adjustResize"
          keyboardBlurBehavior="restore"
          bottomInset={0.2}
        >
          <BottomSheetScrollView
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
            <BottomSheetView>
              <TouchableOpacity
                onPress={closeBottomSheet}
                style={exampleStyles.closeButton}
              >
                <Text style={exampleStyles.closeButtonText}>
                  Close BottomSheet
                </Text>
              </TouchableOpacity>
            </BottomSheetView>
            <BottomSheetView style={exampleStyles.editorContainer}>
              <RichText editor={editor} hideKeyboardAccessoryView={false} />
            </BottomSheetView>
          </BottomSheetScrollView>
          <Portal>
            <KeyboardAvoidingView
              style={{
                position: 'absolute',
                bottom: Keyboard.isVisible()
                  ? Platform.OS === 'android'
                    ? 0
                    : keyboardHeight
                  : -100,
                width: '100%',
              }}
            >
              <Toolbar editor={editor} />
            </KeyboardAvoidingView>
          </Portal>
        </BottomSheet>
      </Portal>
    </SafeAreaView>
  );
};

const exampleStyles = StyleSheet.create({
  closeButton: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 8,
  },
  closeButtonText: {
    textAlign: 'center',
  },
  editorContainer: {
    height: 100,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const initialContent = `<p>This is a basic example!</p>`;
