import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { radii, spacing, typography, useTheme } from './theme';

type EditorCardProps = {
  label: string;
  children: ReactNode;
  /** Applied to the card around the editor. */
  style?: ViewStyle;
};

/** A labelled card that frames an editor on a grouped background. */
export const EditorCard = ({ label, children, style }: EditorCardProps) => {
  const { colors } = useTheme();

  return (
    <>
      <Text
        style={[
          typography.sectionLabel,
          styles.label,
          { color: colors.secondaryText },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.separator },
          style,
        ]}
      >
        {children}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  label: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  card: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
