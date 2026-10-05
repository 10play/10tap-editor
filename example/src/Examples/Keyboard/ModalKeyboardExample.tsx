import React, { useState } from 'react';
import {
  Button,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  ColorKeyboard,
  CustomKeyboard,
  RichText,
  Toolbar,
  useEditorBridge,
  type KeyboardDriverKind,
} from '@10play/tentap-editor';
import { KeyboardDebugBar } from './KeyboardDebugBar';
import { KeyboardSwitcher, colorKeyboardEntry } from './KeyboardSwitcher';

/**
 * An editor inside a React Native `Modal`. On Android the Modal is a separate
 * Dialog window the native module does not touch, so the keyboard switches to
 * the fallback driver there. Driver failures are shown in the header.
 */
export const ModalKeyboardExample = () => {
  const [visible, setVisible] = useState(false);
  return (
    <SafeAreaView style={styles.fullScreen}>
      <Button
        testID="open-editor-modal"
        title="Open editor"
        onPress={() => setVisible(true)}
      />
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        {/* A Modal is its own root view and needs its own insets provider. */}
        <SafeAreaProvider>
          <ModalEditor onClose={() => setVisible(false)} />
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  );
};

const ModalEditor = ({ onClose }: { onClose: () => void }) => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: '<p>Editing inside a Modal.</p>',
  });
  const [activeKeyboard, setActiveKeyboard] = useState<string>();
  const [failedDriver, setFailedDriver] = useState<KeyboardDriverKind>();

  return (
    <SafeAreaView style={styles.fullScreen} edges={['top']}>
      <View style={styles.header}>
        <Button testID="close-editor-modal" title="Done" onPress={onClose} />
        {failedDriver && <Text>{`The ${failedDriver} driver failed`}</Text>}
      </View>
      <KeyboardDebugBar editor={editor} />
      <View style={styles.fullScreen}>
        <RichText editor={editor} testID="keyboard-example-editor" />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <KeyboardSwitcher editor={editor} entries={[colorKeyboardEntry]} />
        <Toolbar editor={editor} />
        <CustomKeyboard
          editor={editor}
          keyboards={[ColorKeyboard]}
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
          onKeyboardError={(event) => setFailedDriver(event.driver)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});
