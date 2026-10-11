import React, { type ReactNode } from 'react';
import {
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { useKeyboard } from '@10play/tentap-editor';
import { layoutStyles } from './styles';

/**
 * SafeAreaView edges of screens whose bottom bars follow the keyboard: in
 * landscape the sides keep controls out of the sensor housing, where iOS
 * does not deliver touches reliably.
 */
export const TOP_AND_SIDES: Edge[] = ['top', 'left', 'right'];

/** Below this window height a landscape screen is too short for chrome over the keyboard. */
const COMPACT_HEIGHT = 500;

/**
 * True while a keyboard is up in a short landscape window (a phone on its
 * side). The keyboard, the toolbar and a header would then leave the editor
 * no room for a line above the caret, so screens drop their header.
 */
export const useCompactKeyboardLayout = () => {
  const { width, height } = useWindowDimensions();
  const { isKeyboardUp } = useKeyboard();
  return isKeyboardUp && width > height && height < COMPACT_HEIGHT;
};

/**
 * Keeps bars at the bottom of the screen above the home indicator or the
 * navigation bar while no keyboard is up; a keyboard covers that inset.
 */
export const BottomInsetSpacer = () => {
  const { isKeyboardUp } = useKeyboard();
  const { bottom } = useSafeAreaInsets();
  const height = isKeyboardUp ? 0 : bottom;
  return <View style={{ height }} />;
};

/**
 * The editor's sheet of paper. In a short landscape window with a keyboard
 * up it drops its margin above the toolbar, which is a line of the editor.
 */
export const EditorPaper = ({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) => {
  const compact = useCompactKeyboardLayout();
  return (
    <View
      style={[layoutStyles.paper, compact && layoutStyles.compactPaper, style]}
    >
      {children}
    </View>
  );
};
