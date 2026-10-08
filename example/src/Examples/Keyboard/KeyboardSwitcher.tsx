import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ColorKeyboard,
  useCustomKeyboard,
  useKeyboardAccessory,
  type AnyCustomKeyboardExtension,
  type EditorBridge,
} from '@10play/tentap-editor';
import { paper, radii, spacing, type } from '../../ui/theme';

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
  // The editor keeps the caret above the switcher too.
  const accessory = useKeyboardAccessory();
  return (
    <View style={styles.switcher} onLayout={accessory.onLayout}>
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
            <Text style={[styles.label, active && styles.labelActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  switcher: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: paper.bar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: paper.border,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: paper.border,
    backgroundColor: paper.chip,
  },
  buttonActive: {
    borderColor: paper.chipActive,
    backgroundColor: paper.chipActive,
  },
  label: {
    ...type.footnote,
    fontWeight: '600',
    color: paper.text,
  },
  labelActive: {
    color: paper.chipActiveText,
  },
});
