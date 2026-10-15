import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chevron } from './Chevron';
import { sections, type Example } from './examples';
import { radii, spacing, typography, useTheme } from './theme';

type HomeProps = { onOpen: (example: Example) => void };

export const Home = ({ onOpen }: HomeProps) => {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottom + spacing.xl },
      ]}
    >
      <View style={styles.intro}>
        <Text style={[typography.largeTitle, { color: colors.text }]}>
          10Tap Rich Text Editor
        </Text>
        <Text style={[typography.subhead, { color: colors.secondaryText }]}>
          Expo examples for @10play/tentap-editor
        </Text>
      </View>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[
              typography.sectionLabel,
              styles.sectionLabel,
              { color: colors.secondaryText },
            ]}
          >
            {section.title}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {section.examples.map((example, index) => (
              <ExampleRow
                key={example.name}
                example={example}
                first={index === 0}
                onPress={() => onOpen(example)}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

type ExampleRowProps = {
  example: Example;
  first: boolean;
  onPress: () => void;
};

const ExampleRow = ({ example, first, onPress }: ExampleRowProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={example.name}
      accessibilityHint={example.description}
      android_ripple={{ color: colors.pressed }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && Platform.OS === 'ios' && { backgroundColor: colors.pressed },
      ]}
    >
      <View
        style={[
          styles.rowInner,
          !first && {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.separator,
          },
        ]}
      >
        <View style={styles.rowText}>
          <Text style={[typography.body, { color: colors.text }]}>
            {example.name}
          </Text>
          <Text style={[typography.footnote, { color: colors.secondaryText }]}>
            {example.description}
          </Text>
        </View>
        <Chevron color={colors.chevron} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  intro: {
    gap: spacing.xs,
    paddingTop: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    paddingHorizontal: spacing.lg,
  },
  card: {
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  row: {
    paddingLeft: spacing.lg,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
