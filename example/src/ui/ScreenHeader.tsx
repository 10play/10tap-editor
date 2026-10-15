import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCompactKeyboardLayout } from './keyboardLayout';
import { spacing, type, useTheme, type Colors } from './theme';

export type ExampleParams = { description?: string } | undefined;

interface ScreenHeaderProps {
  /** Overrides the theme, e.g. on a screen that is always dark. */
  colors?: Pick<Colors, 'text' | 'textSecondary' | 'accent'>;
  right?: ReactNode;
}

/**
 * Back button, the example's name and its one-line description. Hidden while
 * a keyboard is up in a short landscape window, to leave the editor room.
 */
export const ScreenHeader = ({ colors, right }: ScreenHeaderProps) => {
  const theme = useTheme().colors;
  const { text, textSecondary, accent } = colors ?? theme;
  const navigation = useNavigation();
  const route = useRoute();
  const description = (route.params as ExampleParams)?.description;
  const compact = useCompactKeyboardLayout();

  if (compact) return null;
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        onPress={navigation.goBack}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <View style={[styles.chevron, { borderColor: accent }]} />
      </Pressable>
      <View style={styles.titles}>
        <Text style={[styles.title, { color: text }]} numberOfLines={1}>
          {route.name}
        </Text>
        {description ? (
          <Text
            style={[styles.subtitle, { color: textSecondary }]}
            numberOfLines={1}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingRight: spacing.lg,
    gap: spacing.xs,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.4,
  },
  chevron: {
    width: 12,
    height: 12,
    marginLeft: 4,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  titles: {
    flex: 1,
  },
  title: type.title,
  subtitle: {
    ...type.footnote,
    marginTop: 1,
  },
});
