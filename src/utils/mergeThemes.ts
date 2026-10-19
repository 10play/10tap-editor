import merge from 'lodash/merge';
import type { EditorTheme } from '../types';
import type { RecursivePartial } from '../types/utility';
import { replaceColorSelections } from '../RichText/Keyboard/keyboardTheme';

/** Deep-merges `theme2` into `theme1` (mutating it) and returns the result. */
export const mergeThemes = <T extends EditorTheme>(
  theme1: T,
  theme2: RecursivePartial<EditorTheme> | undefined
): T => {
  const merged = merge(theme1, theme2);
  if (merged.colorKeyboard) {
    replaceColorSelections(merged.colorKeyboard, theme2?.colorKeyboard);
  }
  return merged;
};
