// Placeholder for WP-T's keyboardTheme.ts so WP-M compiles on its own branch.
// Integration: take WP-T's version of this file; it exports the same
// `defaultColorKeyboardTheme` and `resolveColorKeyboardTheme`.
import type { ColorKeyboardTheme, EditorTheme } from '../../types';

export const defaultColorKeyboardTheme: ColorKeyboardTheme = {
  keyboardRootColor: '#F5F5F5',
  scrollViewContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    padding: 8,
    backgroundColor: '#F5F5F5',
  },
  keyboardContainer: {
    flex: 1,
    gap: 8,
  },
  colorRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    gap: 10,
  },
  colorButton: {
    width: 114,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#DEE0E3',
    backgroundColor: 'white',
    gap: 16,
    padding: 12,
  },
  activeButton: {
    borderWidth: 1,
    borderColor: '#C8C8C9',
  },
  iconContainer: {
    height: 20,
    width: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'solid',
    backgroundColor: 'white',
    shadowColor: '#898989',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  textIcon: {
    height: 14,
  },
  highlight: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  colorText: {
    color: '#898989',
  },
  sectionTitle: {
    color: '#CACACA',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: 15,
    fontSize: 14,
  },
  bottomSpacer: {
    height: 30,
  },
  colorSelection: [
    {
      name: 'Default',
      displayColor: '#898989',
      value: undefined,
    },
    {
      name: 'Red',
      value: '#EF233C',
    },
    {
      name: 'Yellow',
      value: '#FFEE32',
    },
    {
      name: 'Orange',
      value: '#FB8500',
    },
    {
      name: 'Blue',
      value: '#0085FF',
    },
    {
      name: 'Green',
      value: '#00A896',
    },
    {
      name: 'Purple',
      value: '#A463F2',
    },
    {
      name: 'Pink',
      value: '#FF5D8F',
    },
    {
      name: 'Black',
      value: '#000000',
    },
  ],
  highlightSelection: [
    {
      name: 'Default',
      value: undefined,
      displayColor: '#8989894D',
    },
    {
      name: 'Red',
      value: '#EF233C4D',
    },
    {
      name: 'Yellow',
      value: '#FFEE324D',
    },
    {
      name: 'Orange',
      value: '#FB85004D',
    },
    {
      name: 'Blue',
      value: '#0085FF4D',
    },
    {
      name: 'Green',
      value: '#00A8964D',
    },
    {
      name: 'Purple',
      value: '#A463F24D',
    },
    {
      name: 'Pink',
      value: '#FF5D8F4D',
    },
    {
      name: 'Black',
      value: '#0000004D',
    },
  ],
};

/**
 * The color keyboard theme to render with: `theme.colorKeyboard` completed
 * with `defaultColorKeyboardTheme`, or the default when it is missing.
 */
export const resolveColorKeyboardTheme = (
  theme: Pick<EditorTheme, 'colorKeyboard'> | null | undefined
): ColorKeyboardTheme => ({
  ...defaultColorKeyboardTheme,
  ...theme?.colorKeyboard,
});
