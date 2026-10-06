import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useKeyboard } from '../../utils/useKeyboard';

export interface EditorKeyboardAvoidingViewProps extends ViewProps {
  /** Distance in dp between the bottom of this view and the bottom of the window. */
  keyboardVerticalOffset?: number;
  enabled?: boolean;
}

/**
 * Pads its bottom by the part of the window whichever keyboard covers,
 * system or custom (`useKeyboard().keyboardCoverHeight`, which counts the
 * navigation bar an edge-to-edge Android keyboard also covers). The height
 * holds through swaps, so content above does not move when a
 * `CustomKeyboard` with `layout="overlay"` replaces the system keyboard.
 * Where the window resizes for the system keyboard (Android adjustResize),
 * only the custom keyboard is padded.
 */
export const EditorKeyboardAvoidingView = ({
  keyboardVerticalOffset = 0,
  enabled = true,
  style,
  ...props
}: EditorKeyboardAvoidingViewProps) => {
  const { keyboardCoverHeight } = useKeyboard();
  const paddingBottom = enabled
    ? Math.max(0, keyboardCoverHeight - keyboardVerticalOffset)
    : 0;
  return <View style={[style, { paddingBottom }]} {...props} />;
};
