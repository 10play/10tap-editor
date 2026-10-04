import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useKeyboard } from '../../utils/useKeyboard';

export interface EditorKeyboardAvoidingViewProps extends ViewProps {
  /** Distance in dp between the bottom of this view and the bottom of the window. */
  keyboardVerticalOffset?: number;
  enabled?: boolean;
}

/**
 * Pads its bottom by the height of whichever keyboard is up, system or
 * custom. The height holds through swaps, so content above does not move
 * when a `CustomKeyboard` with `layout="overlay"` replaces the system
 * keyboard. Where the window resizes for the system keyboard (Android
 * adjustResize), only the custom keyboard is padded.
 */
export const EditorKeyboardAvoidingView = ({
  keyboardVerticalOffset = 0,
  enabled = true,
  style,
  ...props
}: EditorKeyboardAvoidingViewProps) => {
  const {
    windowOverlaysKeyboard,
    isKeyboardUp,
    keyboardHeight,
    customOpen,
    systemVisible,
  } = useKeyboard();
  const covered = !enabled
    ? 0
    : windowOverlaysKeyboard
      ? isKeyboardUp
        ? keyboardHeight
        : 0
      : customOpen && !systemVisible
        ? keyboardHeight
        : 0;
  const paddingBottom = Math.max(0, covered - keyboardVerticalOffset);
  return <View style={[style, { paddingBottom }]} {...props} />;
};
