import type {
  ImageStyle,
  ViewStyle,
  StyleProp,
  TextStyle,
  ColorValue,
} from 'react-native';

export interface EditorTheme {
  toolbar: ToolbarTheme;
  colorKeyboard: ColorKeyboardTheme;
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
  section: StyleProp<ViewStyle>;
  stickyKeyboardContainer: StyleProp<ViewStyle>;
  flatList: StyleProp<ViewStyle>;
  separatorContainer: StyleProp<ViewStyle>;
  separatorLine: StyleProp<ViewStyle>;
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
  value?: ColorValue;
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
