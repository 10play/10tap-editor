import { StyleSheet, useColorScheme } from 'react-native';

const lightColors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  pressed: '#E5E5EA',
  text: '#1C1C1E',
  secondaryText: '#6C6C70',
  separator: '#D1D1D6',
  accent: '#2F6FEB',
  chevron: '#B4B4BA',
};

export type Colors = typeof lightColors;

const darkColors: Colors = {
  background: '#000000',
  // The background of darkEditorTheme's WebView.
  surface: '#1C1C1E',
  pressed: '#2C2C2E',
  text: '#FFFFFF',
  secondaryText: '#98989F',
  separator: '#38383A',
  accent: '#5B9BFF',
  chevron: '#5A5A60',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
};

export const typography = StyleSheet.create({
  largeTitle: { fontSize: 30, fontWeight: '700', letterSpacing: 0.2 },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17 },
  subhead: { fontSize: 15 },
  footnote: { fontSize: 13, lineHeight: 18 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

export const useTheme = () => {
  const dark = useColorScheme() === 'dark';
  return { dark, colors: dark ? darkColors : lightColors };
};
