import { useColorScheme } from 'react-native';

const light = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfacePressed: '#E8E8ED',
  text: '#1C1C1E',
  textSecondary: '#6C6C72',
  separator: 'rgba(60, 60, 67, 0.18)',
  accent: '#3D5AFE',
  /** Filled buttons and bubbles, with accentText on top. */
  accentFill: '#3D5AFE',
  accentText: '#FFFFFF',
  accentSoft: 'rgba(61, 90, 254, 0.12)',
  chip: '#E9E9EE',
};

export type Colors = typeof light;

const dark: Colors = {
  background: '#000000',
  surface: '#1C1C1E',
  surfacePressed: '#2C2C2E',
  text: '#F2F2F7',
  textSecondary: '#9C9CA3',
  separator: 'rgba(84, 84, 88, 0.6)',
  accent: '#7C8CFF',
  accentFill: '#4457E8',
  accentText: '#FFFFFF',
  accentSoft: 'rgba(124, 140, 255, 0.18)',
  chip: '#2C2C2E',
};

/**
 * The editor, its toolbars and custom keyboards keep the library's light
 * look in both modes, so the screens frame them as a sheet of paper.
 */
export const paper = {
  background: '#FFFFFF',
  bar: '#F7F7F9',
  border: '#DADADF',
  text: '#1C1C1E',
  textSecondary: '#6C6C72',
  placeholder: '#A1A1A8',
  chip: '#FFFFFF',
  chipActive: '#E3E7FF',
  chipActiveText: '#2539C9',
};

export const darkEditorBackground = '#1C1C1E';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radii = { sm: 8, md: 12, lg: 16, pill: 999 };

export const type = {
  largeTitle: { fontSize: 30, fontWeight: '700', letterSpacing: 0.2 },
  title: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 16 },
  subhead: { fontSize: 14 },
  footnote: { fontSize: 13 },
  caption: { fontSize: 12 },
  sectionHeader: { fontSize: 13, fontWeight: '600', letterSpacing: 0.4 },
} as const;

export const useTheme = () => {
  const isDark = useColorScheme() === 'dark';
  return { isDark, colors: isDark ? dark : light };
};
