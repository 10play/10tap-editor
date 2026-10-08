import React, { type ComponentType } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type ParamListBase,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Basic } from './Examples/Basic';
import { EditorStickToKeyboardExample } from './Examples/EditorStickToKeyboardExample';
import { Advanced } from './Examples/Advanced/AdvancedRichText';
import { CustomAndStaticToolbar } from './Examples/CustomAndStaticToolbar/CustomAndStaticToolbar';
import { CustomCss } from './Examples/CustomCss';
import { ConfigureExtensions } from './Examples/ConfigureExtentions';
import { NavigationHeader } from './Examples/NavigationHeader';
import { DarkEditor } from './Examples/DarkEditor';
import { keyboardExamples } from './Examples/Keyboard';
import { reproExamples } from './Examples/Repro';
import { radii, spacing, type, useTheme, type Colors } from './ui/theme';

type ScreenProps = NativeStackScreenProps<ParamListBase>;
type Example = {
  name: string;
  description: string;
  component: ComponentType<ScreenProps>;
};
type Section = { title: string; examples: Example[] };

const [keyboardColor, keyboardCustom, keyboardOverlay, keyboardModal] =
  keyboardExamples;
const [smoke, readiness, autofocus, dynamicHeight, contentApi] = reproExamples;

// The names are also the Maestro entry points (example/.maestro).
const sections: Section[] = [
  {
    title: 'Basics',
    examples: [
      {
        name: 'Basic',
        description: 'The default toolbar on top of the keyboard',
        component: Basic,
      },
      {
        name: 'Configure Extensions',
        description: 'Placeholder, link and drop cursor options',
        component: ConfigureExtensions,
      },
    ],
  },
  {
    title: 'Toolbar & Styling',
    examples: [
      {
        name: 'Custom CSS',
        description: 'A custom font and code block CSS at runtime',
        component: CustomCss,
      },
      {
        name: 'Dark Editor',
        description: 'The dark editor theme and CSS',
        component: DarkEditor,
      },
      {
        name: 'CustomAndStaticToolbar',
        description: 'A mail composer with its own toolbars',
        component: CustomAndStaticToolbar,
      },
    ],
  },
  {
    title: 'Keyboard',
    examples: [
      {
        ...keyboardColor,
        description: 'ColorKeyboard opened from a toolbar item',
      },
      {
        ...keyboardCustom,
        description: 'A sticker keyboard next to the color keyboard',
      },
      {
        ...keyboardOverlay,
        description: 'A custom keyboard drawn over the window',
      },
      {
        ...keyboardModal,
        description: 'An editor and custom keyboard inside a Modal',
      },
    ],
  },
  {
    title: 'Layout & Dynamic Height',
    examples: [
      {
        name: 'NavigationHeader',
        description: 'The toolbar on the keyboard below a native header',
        component: NavigationHeader,
      },
      {
        name: 'EditorStickToKeyboardExample',
        description: 'A chat composer that sticks to the keyboard',
        component: EditorStickToKeyboardExample,
      },
      {
        ...dynamicHeight,
        description: 'Editors that grow with their content',
      },
    ],
  },
  {
    title: 'Advanced setup',
    examples: [
      {
        name: 'Advanced',
        description: 'A custom editor bundle with its own bridge',
        component: Advanced,
      },
    ],
  },
  {
    title: 'Issue repros',
    examples: [
      { ...smoke, description: 'Typing, formatting and undo' },
      { ...readiness, description: 'A read-only editor without autofocus' },
      { ...autofocus, description: 'Autofocus opens the keyboard' },
      { ...contentApi, description: 'Content and selection APIs' },
    ],
  },
];

const examples = sections.flatMap((section) => section.examples);

// Android rows show a ripple instead.
const isIos = Platform.OS === 'ios';

const isNewArch = !!(globalThis as { nativeFabricUIManager?: unknown })
  .nativeFabricUIManager;

const HomeScreen = ({ navigation }: ScreenProps) => {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.home}>
        <View style={styles.hero}>
          <Text style={[styles.title, { color: colors.text }]}>
            10Tap Rich Text Editor!
          </Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Rich text editing for React Native, built on Tiptap.
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.badgeText, { color: colors.accent }]}>
              {isNewArch ? 'New architecture' : 'Old architecture'}
            </Text>
          </View>
        </View>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              {section.title}
            </Text>
            <View style={[styles.group, { backgroundColor: colors.surface }]}>
              {section.examples.map((example, index) => (
                <ExampleRow
                  key={example.name}
                  example={example}
                  colors={colors}
                  first={index === 0}
                  onPress={() =>
                    navigation.navigate(example.name, {
                      description: example.description,
                    })
                  }
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

interface ExampleRowProps {
  example: Example;
  colors: Colors;
  first: boolean;
  onPress: () => void;
}

const ExampleRow = ({ example, colors, first, onPress }: ExampleRowProps) => (
  <Pressable
    // The label is the name alone, so flows can tap the row by it.
    accessibilityRole="button"
    accessibilityLabel={example.name}
    accessibilityHint={example.description}
    android_ripple={{ color: colors.surfacePressed }}
    onPress={onPress}
    style={({ pressed }) => [
      styles.row,
      pressed && isIos && { backgroundColor: colors.surfacePressed },
    ]}
  >
    <View
      style={[
        styles.rowContent,
        !first && styles.rowDivider,
        { borderTopColor: colors.separator },
      ]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>
          {example.name}
        </Text>
        <Text
          style={[styles.rowDescription, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {example.description}
        </Text>
      </View>
      <View style={[styles.chevron, { borderColor: colors.textSecondary }]} />
    </View>
  </Pressable>
);

const Stack = createNativeStackNavigator();

const App = () => {
  const { isDark, colors } = useTheme();
  const base = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.separator,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Stack.Navigator
        screenOptions={({ route }) => ({
          headerShown: route.name === 'NavigationHeader',
          headerShadowVisible: false,
        })}
      >
        <Stack.Screen name="Examples" component={HomeScreen} />
        {examples.map(({ name, description, component }) => (
          <Stack.Screen
            key={name}
            name={name}
            component={component}
            initialParams={{ description }}
          />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  home: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  hero: {
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  title: type.largeTitle,
  tagline: type.body,
  badge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  badgeText: {
    ...type.caption,
    fontWeight: '600',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...type.sectionHeader,
    paddingHorizontal: spacing.lg,
  },
  group: {
    borderRadius: radii.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  row: {
    paddingLeft: spacing.lg,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...type.body,
    fontWeight: '500',
  },
  rowDescription: type.footnote,
  chevron: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
});

export default App;
