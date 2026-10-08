import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { radii, spacing, type, useTheme } from './theme';

interface ChipProps {
  label: string;
  onPress: () => void;
  testID?: string;
}

/** A small action button for the example screens. */
export const Chip = ({ label, onPress, testID }: ChipProps) => {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: pressed ? colors.accentSoft : colors.surface },
      ]}
    >
      <Text style={[styles.label, { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  label: {
    ...type.subhead,
    fontWeight: '600',
  },
});
