import type { ColorKeyboardTheme, EditorTheme, ToolbarTheme } from '../types';
import {
  darkColorKeyboardTheme,
  defaultColorKeyboardTheme,
} from './Keyboard/keyboardTheme';
import { darkToolbarTheme, defaultToolbarTheme } from './Toolbar/toolbarTheme';

export const defaultEditorTheme: EditorTheme = {
  toolbar: defaultToolbarTheme,
  colorKeyboard: defaultColorKeyboardTheme,
  richText: {
    style: {
      backgroundColor: 'white',
    },
    containerStyle: {},
  },
};

export const darkEditorTheme: EditorTheme = {
  toolbar: darkToolbarTheme as ToolbarTheme,
  colorKeyboard: darkColorKeyboardTheme as ColorKeyboardTheme,
  richText: {
    style: {
      backgroundColor: '#1C1C1E',
    },
    containerStyle: {},
  },
};
