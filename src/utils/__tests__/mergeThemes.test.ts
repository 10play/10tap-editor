import cloneDeep from 'lodash/cloneDeep';
import { mergeThemes } from '../mergeThemes';
import { darkEditorTheme, defaultEditorTheme } from '../../RichText/theme';
import {
  darkColorKeyboardTheme,
  defaultColorKeyboardTheme,
  resolveColorKeyboardTheme,
} from '../../RichText/Keyboard/keyboardTheme';
import {
  darkToolbarTheme,
  defaultToolbarTheme,
} from '../../RichText/Toolbar/toolbarTheme';
import type { Color, EditorTheme } from '../../types';

const customColors: Color[] = [
  { name: 'Custom Color', value: '#E5112B', displayColor: '#E5112B' },
];

const defaults = () => cloneDeep(defaultEditorTheme);

describe('mergeThemes', () => {
  it('replaces colorSelection instead of merging it by index', () => {
    const merged = mergeThemes(defaults(), {
      colorKeyboard: { colorSelection: customColors },
    });

    expect(merged.colorKeyboard?.colorSelection).toEqual(customColors);
    expect(merged.colorKeyboard?.highlightSelection).toEqual(
      defaultColorKeyboardTheme.highlightSelection
    );
  });

  it('replaces highlightSelection instead of merging it by index', () => {
    const merged = mergeThemes(defaults(), {
      colorKeyboard: { highlightSelection: customColors },
    });

    expect(merged.colorKeyboard?.highlightSelection).toEqual(customColors);
    expect(merged.colorKeyboard?.colorSelection).toEqual(
      defaultColorKeyboardTheme.colorSelection
    );
  });

  it('copies the replacement lists instead of aliasing them', () => {
    const merged = mergeThemes(defaults(), {
      colorKeyboard: { colorSelection: customColors },
    });

    expect(merged.colorKeyboard?.colorSelection).not.toBe(customColors);
    expect(merged.colorKeyboard?.colorSelection[0]).not.toBe(customColors[0]);
  });

  it('accepts an empty replacement list', () => {
    const merged = mergeThemes(defaults(), {
      colorKeyboard: { colorSelection: [] },
    });

    expect(merged.colorKeyboard?.colorSelection).toEqual([]);
  });

  it('deep merges every other colorKeyboard key', () => {
    const merged = mergeThemes(defaults(), {
      colorKeyboard: {
        keyboardRootColor: 'white',
        colorText: { color: 'red' },
      },
    });

    expect(merged.colorKeyboard).toMatchObject({
      keyboardRootColor: 'white',
      colorText: { color: 'red' },
      sectionTitle: defaultColorKeyboardTheme.sectionTitle,
    });
  });

  it('keeps the 1.0 lodash merge for the rest of the theme', () => {
    const merged = mergeThemes(defaults(), {
      toolbar: { toolbarBody: { borderTopWidth: 0 } },
      webview: { backgroundColor: 'black' },
    });

    expect(merged.toolbar.toolbarBody).toEqual({
      ...(defaultToolbarTheme.toolbarBody as object),
      borderTopWidth: 0,
    });
    expect(merged.webview).toEqual({ backgroundColor: 'black' });
  });

  it('merges into and returns the first theme', () => {
    const base = defaults();
    expect(mergeThemes(base, { webview: { opacity: 1 } })).toBe(base);
  });

  it('returns the base theme for an undefined override', () => {
    expect(mergeThemes(defaults(), undefined)).toEqual(defaultEditorTheme);
  });

  it('merges a full 1.0 theme that has no colorKeyboard', () => {
    const v1Theme: EditorTheme = {
      toolbar: defaultToolbarTheme,
      webview: { backgroundColor: 'black' },
      webviewContainer: {},
    };

    const merged = mergeThemes(defaults(), v1Theme);

    expect(merged.colorKeyboard).toEqual(defaultColorKeyboardTheme);
    expect(merged.webview).toEqual({ backgroundColor: 'black' });
  });

  it('leaves a base theme without colorKeyboard untouched', () => {
    const { colorKeyboard: _omitted, ...base } = defaults();

    expect(mergeThemes(base, { webview: {} }).colorKeyboard).toBeUndefined();
  });

  it('never mutates the built-in themes', () => {
    const snapshot = cloneDeep(defaultEditorTheme);

    mergeThemes(defaults(), {
      colorKeyboard: { colorSelection: customColors, colorText: { color: 0 } },
    });

    expect(defaultEditorTheme).toEqual(snapshot);
  });
});

describe('built-in themes', () => {
  it('include the 0.7 color keyboard theme', () => {
    expect(defaultEditorTheme.colorKeyboard).toBe(defaultColorKeyboardTheme);
    expect(defaultColorKeyboardTheme.keyboardRootColor).toBe('#F5F5F5');
    expect(
      defaultColorKeyboardTheme.colorSelection.map(({ name }) => name)
    ).toEqual([
      'Default',
      'Red',
      'Yellow',
      'Orange',
      'Blue',
      'Green',
      'Purple',
      'Pink',
      'Black',
    ]);
  });

  it('complete the dark theme from the default one', () => {
    expect(darkEditorTheme.webview).toEqual({ backgroundColor: '#1C1C1E' });
    expect(darkEditorTheme.colorKeyboard).toMatchObject(darkColorKeyboardTheme);
    expect(darkEditorTheme.colorKeyboard?.keyboardRootColor).toBe('#313132');
    expect(darkEditorTheme.colorKeyboard?.bottomSpacer).toEqual(
      defaultColorKeyboardTheme.bottomSpacer
    );
    expect(darkEditorTheme.toolbar).toMatchObject(darkToolbarTheme);
    expect(darkEditorTheme.toolbar.keyboardAvoidingView).toEqual(
      defaultToolbarTheme.keyboardAvoidingView
    );
    expect(Object.keys(darkEditorTheme.toolbar).sort()).toEqual(
      Object.keys(defaultToolbarTheme).sort()
    );
  });

  it('give the same editor theme whether dark is merged or used as is', () => {
    expect(mergeThemes(defaults(), darkEditorTheme)).toEqual(darkEditorTheme);
  });
});

describe('resolveColorKeyboardTheme', () => {
  it('falls back to the default theme when colorKeyboard is missing', () => {
    expect(resolveColorKeyboardTheme(undefined)).toBe(
      defaultColorKeyboardTheme
    );
    expect(resolveColorKeyboardTheme({})).toBe(defaultColorKeyboardTheme);
  });

  it('completes a partial theme with the defaults', () => {
    const partial = {
      colorKeyboard: {
        keyboardRootColor: '#313132',
        colorSelection: customColors,
      },
    } as Pick<EditorTheme, 'colorKeyboard'>;

    expect(resolveColorKeyboardTheme(partial)).toEqual({
      ...defaultColorKeyboardTheme,
      keyboardRootColor: '#313132',
      colorSelection: customColors,
    });
  });

  it('memoises the resolved theme per colorKeyboard object', () => {
    const theme = cloneDeep(darkEditorTheme);

    expect(resolveColorKeyboardTheme(theme)).toBe(
      resolveColorKeyboardTheme(theme)
    );
    expect(resolveColorKeyboardTheme(theme)).toEqual(theme.colorKeyboard);
  });
});
