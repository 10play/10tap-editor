import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ColorKeyboard,
  useCustomKeyboard,
  type AnyCustomKeyboardExtension,
  type EditorBridge,
} from '@10play/tentap-editor';

export interface SwitcherEntry {
  keyboard: AnyCustomKeyboardExtension;
  label: string;
  testID: string;
}

export const colorKeyboardEntry: SwitcherEntry = {
  keyboard: ColorKeyboard,
  label: 'Colors',
  testID: 'toggle-color-keyboard',
};

/**
 * Toggles custom keyboards with `useCustomKeyboard`: pressing the open
 * keyboard's button closes back to the system keyboard.
 */
export const KeyboardSwitcher = ({
  editor,
  entries,
}: {
  editor: EditorBridge;
  entries: readonly SwitcherEntry[];
}) => {
  const { activeKeyboardID, open, close } = useCustomKeyboard(editor);
  return (
    <View style={styles.switcher}>
      {entries.map(({ keyboard, label, testID }) => {
        const active = activeKeyboardID === keyboard.id;
        return (
          <Pressable
            key={keyboard.id}
            testID={testID}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => (active ? close() : open(keyboard.id))}
            style={[styles.button, active && styles.buttonActive]}
          >
            <Text>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  switcher: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C8C8C9',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  buttonActive: {
    backgroundColor: '#DEE0E3',
  },
});
