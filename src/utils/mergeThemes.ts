import merge from 'lodash/merge';
import type { EditorTheme } from '../types';
import type { RecursivePartial } from '../RichText';

export const mergeThemes = (
  theme1: EditorTheme,
  theme2: RecursivePartial<EditorTheme> | undefined
) => merge(theme1, theme2);
