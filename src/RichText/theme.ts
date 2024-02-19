import type { ColorKeyboardTheme, EditorTheme, ToolbarTheme } from '../types';
import {
  darkColorKeyboardTheme,
  defaultColorKeyboardTheme,
} from './Keyboard/keyboardTheme';
import { darkToolbarTheme, defaultToolbarTheme } from './Toolbar/toolbarTheme';

export const defaultEditorTheme: EditorTheme = {
  toolbar: defaultToolbarTheme,
  colorKeyboard: defaultColorKeyboardTheme,
  webview: {
    backgroundColor: 'white',
  },
  webviewContainer: {},
};

const DARK_EDITOR_BACKGROUND_COLOR = '#1C1C1E';
export const darkEditorTheme: EditorTheme = {
  toolbar: darkToolbarTheme as ToolbarTheme,
  colorKeyboard: darkColorKeyboardTheme as ColorKeyboardTheme,
  webview: {
    backgroundColor: DARK_EDITOR_BACKGROUND_COLOR,
  },
  webviewContainer: {},
};

export const darkEditorCss = `
  * {
    background-color: ${DARK_EDITOR_BACKGROUND_COLOR};
    color: white;
  }
  blockquote {
    border-left: 3px solid #babaca;
    padding-left: 1rem;
  }
`;
