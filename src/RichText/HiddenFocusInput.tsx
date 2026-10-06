import React, { forwardRef } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

/**
 * An invisible TextInput that Android can focus to bring up the IME for the
 * editor WebView. It must not be `display: none`: Android never focuses such
 * a view (#321).
 */
export const HiddenFocusInput = forwardRef<
  TextInput,
  Omit<TextInputProps, 'style'>
>(function HiddenFocusInput(props, ref) {
  return (
    <TextInput
      ref={ref}
      caretHidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...props}
      style={styles.input}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: 'none',
  },
});
