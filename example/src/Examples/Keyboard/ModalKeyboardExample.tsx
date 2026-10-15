import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  ColorKeyboard,
  CustomKeyboard,
  EditorKeyboardAvoidingView,
  RichText,
  Toolbar,
  useEditorBridge,
  type KeyboardDriverKind,
} from '@10play/tentap-editor';
import { EditorPaper, TOP_AND_SIDES } from '../../ui/keyboardLayout';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { layoutStyles } from '../../ui/styles';
import { radii, spacing, type, useTheme } from '../../ui/theme';
import { KeyboardDebugBar } from './KeyboardDebugBar';
import { KeyboardSwitcher, colorKeyboardEntry } from './KeyboardSwitcher';

/**
 * An editor inside a React Native `Modal`. On Android the Modal is a separate
 * Dialog window the native module does not touch, so the keyboard switches to
 * the fallback driver there. Driver failures are shown in the header.
 */
export const ModalKeyboardExample = () => {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();
  return (
    <SafeAreaView style={styles.fullScreen}>
      <ScreenHeader />
      <View style={[styles.intro, { backgroundColor: colors.surface }]}>
        <Text style={[styles.introText, { color: colors.textSecondary }]}>
          A Modal is a separate window. On Android the custom keyboard falls
          back to its JS driver there.
        </Text>
        <Pressable
          testID="open-editor-modal"
          accessibilityRole="button"
          onPress={() => setVisible(true)}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.accentFill },
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[styles.primaryButtonText, { color: colors.accentText }]}
          >
            Open editor
          </Text>
        </Pressable>
      </View>
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
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.fullScreen, { backgroundColor: colors.background }]}
      edges={TOP_AND_SIDES}
    >
      <KeyboardDebugBar
        editor={editor}
        header={(readButton) => (
          <View style={styles.header}>
            <View style={styles.titles}>
              <Text style={[styles.title, { color: colors.text }]}>
                Editor in a Modal
              </Text>
              {failedDriver && (
                <Text style={styles.error}>
                  {`The ${failedDriver} driver failed`}
                </Text>
              )}
            </View>
            {readButton}
            <Pressable
              testID="close-editor-modal"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={[styles.done, { color: colors.accent }]}>Done</Text>
            </Pressable>
          </View>
        )}
      />
      <EditorPaper>
        <RichText editor={editor} testID="keyboard-example-editor" />
      </EditorPaper>
      <EditorKeyboardAvoidingView style={layoutStyles.keyboardAvoidingView}>
        <KeyboardSwitcher editor={editor} entries={[colorKeyboardEntry]} />
        <Toolbar editor={editor} />
        <CustomKeyboard
          editor={editor}
          keyboards={[ColorKeyboard]}
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
          onKeyboardError={(event) => setFailedDriver(event.driver)}
        />
      </EditorKeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  intro: {
    margin: spacing.md,
    padding: spacing.lg,
    gap: spacing.lg,
    borderRadius: radii.lg,
  },
  introText: type.subhead,
  primaryButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  primaryButtonText: {
    ...type.body,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  titles: {
    flex: 1,
  },
  title: type.title,
  error: {
    ...type.footnote,
    color: '#E5484D',
  },
  done: {
    ...type.body,
    fontWeight: '600',
  },
});
