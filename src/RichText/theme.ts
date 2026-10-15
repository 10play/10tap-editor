import cloneDeep from 'lodash/cloneDeep';
import type { ColorKeyboardTheme, EditorTheme } from '../types';
import { mergeThemes } from '../utils/mergeThemes';
import {
  darkColorKeyboardTheme,
  defaultColorKeyboardTheme,
} from './Keyboard/keyboardTheme';
import { darkToolbarTheme, defaultToolbarTheme } from './Toolbar/toolbarTheme';

type BuiltInEditorTheme = EditorTheme & { colorKeyboard: ColorKeyboardTheme };

export const defaultEditorTheme: BuiltInEditorTheme = {
  toolbar: defaultToolbarTheme,
  colorKeyboard: defaultColorKeyboardTheme,
  webview: {
    backgroundColor: 'white',
  },
  webviewContainer: {},
};

const DARK_EDITOR_BACKGROUND_COLOR = '#1C1C1E';
// The dark toolbar and keyboard themes only hold overrides, so complete them
// here to keep every key of `darkEditorTheme` defined when used on its own.
export const darkEditorTheme: BuiltInEditorTheme = mergeThemes(
  cloneDeep(defaultEditorTheme),
  {
    toolbar: darkToolbarTheme,
    colorKeyboard: darkColorKeyboardTheme,
    webview: {
      backgroundColor: DARK_EDITOR_BACKGROUND_COLOR,
    },
  }
);

export const darkEditorCss = `
  * {
    background-color: ${DARK_EDITOR_BACKGROUND_COLOR};
    color: white;
  }
  blockquote {
    border-left: 3px solid #babaca;
    padding-left: 1rem;
  }
  .highlight-background {
    background-color: #474749;
  }
`;
