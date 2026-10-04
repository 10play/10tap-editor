import type {
  ImageStyle,
  ViewStyle,
  StyleProp,
  TextStyle,
  ColorValue,
} from 'react-native';

export interface EditorTheme {
  toolbar: ToolbarTheme;
  /**
   * Styles for `ColorKeyboard`. Optional so a full 1.0 `EditorTheme` still
   * compiles; the built-in themes always provide it and readers fall back to
   * `defaultColorKeyboardTheme`.
   */
  colorKeyboard?: ColorKeyboardTheme;
  webview: StyleProp<ViewStyle>;
  webviewContainer: StyleProp<ViewStyle>;
}

export type ToolbarTheme = {
  toolbarBody: StyleProp<ViewStyle>;
  toolbarButton: StyleProp<ViewStyle>;
  iconDisabled: StyleProp<ImageStyle>;
  iconActive: StyleProp<ImageStyle>;
  icon: StyleProp<ImageStyle>;
  iconWrapper: StyleProp<ViewStyle>;
  iconWrapperDisabled: StyleProp<ViewStyle>;
  iconWrapperActive: StyleProp<ViewStyle>;
  hidden: StyleProp<ViewStyle>;
  keyboardAvoidingView: StyleProp<ViewStyle>;
  linkBarTheme: LinkBarTheme;
};

export type LinkBarTheme = {
  addLinkContainer: StyleProp<ViewStyle>;
  linkInput: StyleProp<TextStyle>;
  placeholderTextColor?: ColorValue;
  doneButton: StyleProp<ViewStyle>;
  doneButtonText: StyleProp<TextStyle>;
  linkToolbarButton: StyleProp<ViewStyle>;
};

export interface Color {
  name: string;
  /** Value passed to the editor; `undefined` unsets the color. */
  value?: ColorValue;
  /** Color shown in the keyboard, defaults to `value`. */
  displayColor?: ColorValue;
}

export type ColorKeyboardTheme = {
  scrollViewContainer: StyleProp<ViewStyle>;
  keyboardContainer: StyleProp<ViewStyle>;
  colorRow: StyleProp<ViewStyle>;
  colorButton: StyleProp<ViewStyle>;
  activeButton: StyleProp<ViewStyle>;
  iconContainer: StyleProp<ViewStyle>;
  textIcon: StyleProp<ImageStyle>;
  highlight: StyleProp<ViewStyle>;
  colorText: StyleProp<TextStyle>;
  sectionTitle: StyleProp<TextStyle>;
  bottomSpacer: StyleProp<ViewStyle>;
  colorSelection: Color[];
  highlightSelection: Color[];
  keyboardRootColor: ColorValue;
};
