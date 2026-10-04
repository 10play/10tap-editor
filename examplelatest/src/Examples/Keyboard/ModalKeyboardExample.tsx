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
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ColorKeyboard,
  CustomKeyboard,
  DEFAULT_TOOLBAR_ITEMS,
  Images,
  RichText,
  Toolbar,
  useEditorBridge,
  type KeyboardDriverKind,
} from '@10play/tentap-editor';

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
        <ModalEditor onClose={() => setVisible(false)} />
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
      <View style={styles.fullScreen}>
        <RichText editor={editor} testID="keyboard-example-editor" />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Toolbar
          editor={editor}
          items={[
            {
              onPress: () => () =>
                setActiveKeyboard((current) =>
                  current === ColorKeyboard.id ? undefined : ColorKeyboard.id
                ),
              active: () => activeKeyboard === ColorKeyboard.id,
              disabled: () => false,
              image: () => Images.palette,
            },
            ...DEFAULT_TOOLBAR_ITEMS,
          ]}
        />
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
