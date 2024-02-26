import merge from 'lodash/merge';
import type { Color, EditorTheme } from '../types';
import type { RecursivePartial } from '../RichText';

export const mergeThemes = (
  theme1: EditorTheme,
  theme2: RecursivePartial<EditorTheme> | undefined
) => {
  const merged = merge(theme1, theme2);

  const colorModified = !!theme2?.colorKeyboard?.colorSelection;
  const highlightModified = !!theme2?.colorKeyboard?.highlightSelection;
  // We have a special case with colorKeyboard, where if set we do not want default values
  if (colorModified)
    merged.colorKeyboard.colorSelection = theme2.colorKeyboard!
      .colorSelection as Color[];
  if (highlightModified)
    merged.colorKeyboard.highlightSelection = theme2.colorKeyboard!
      .highlightSelection as Color[];

  return merged;
};
