// 1.0.1 themes: a complete EditorTheme literal (no colorKeyboard, which 1.0
// removed) and the partial themes accepted by useEditorBridge.
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import {
  darkEditorTheme,
  defaultEditorTheme,
  useEditorBridge,
  type EditorTheme,
  type LinkBarTheme,
  type RecursivePartial,
  type ToolbarTheme,
} from '@10play/tentap-editor';

const view: ViewStyle = { backgroundColor: 'white' };
const image: ImageStyle = { tintColor: '#898989' };
const text: TextStyle = { color: '#0085FF' };

export const linkBarTheme: LinkBarTheme = {
  addLinkContainer: view,
  linkInput: text,
  placeholderTextColor: '#898989',
  doneButton: view,
  doneButtonText: text,
  linkToolbarButton: view,
};

export const toolbarTheme: ToolbarTheme = {
  toolbarBody: view,
  toolbarButton: view,
  iconDisabled: image,
  iconActive: image,
  icon: image,
  iconWrapper: view,
  iconWrapperDisabled: view,
  iconWrapperActive: view,
  hidden: { display: 'none' },
  keyboardAvoidingView: { position: 'absolute', width: '100%', bottom: 0 },
  linkBarTheme,
};

export const fullTheme: EditorTheme = {
  toolbar: toolbarTheme,
  webview: { backgroundColor: '#1C1C1E' },
  webviewContainer: {},
};

export const partialTheme: RecursivePartial<EditorTheme> = {
  toolbar: {
    toolbarBody: { borderTopColor: '#C6C6C6' },
    linkBarTheme: { placeholderTextColor: 'gray' },
  },
  webview: { backgroundColor: '#1C1C1E' },
};

export const extendedDarkTheme: EditorTheme = {
  ...darkEditorTheme,
  toolbar: { ...darkEditorTheme.toolbar, ...toolbarTheme },
};

export const useThemes = () => [
  useEditorBridge({ theme: fullTheme }),
  useEditorBridge({ theme: partialTheme }),
  useEditorBridge({ theme: defaultEditorTheme }),
  useEditorBridge({ theme: extendedDarkTheme }),
];
