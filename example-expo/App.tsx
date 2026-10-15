import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Chevron } from './src/Chevron';
import type { Example } from './src/examples';
import { Home } from './src/Home';
import { ScreenOffsetContext } from './src/screenOffset';
import { spacing, typography, useTheme } from './src/theme';

const ExampleScreen = ({
  example,
  onBack,
}: {
  example: Example;
  onBack: () => void;
}) => {
  const { top } = useSafeAreaInsets();
  const { colors } = useTheme();
  const scheme = useColorScheme();
  const [headerHeight, setHeaderHeight] = useState(0);

  const Screen = example.component;
  return (
    <ScreenOffsetContext.Provider value={top + headerHeight}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.separator,
          },
        ]}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={spacing.sm}
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Chevron color={colors.accent} direction="left" />
          {Platform.OS === 'ios' && (
            <Text style={[typography.body, { color: colors.accent }]}>
              Examples
            </Text>
          )}
        </Pressable>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={[typography.headline, styles.title, { color: colors.text }]}
        >
          {example.name}
        </Text>
      </View>
      {/* The editors read the color scheme once, so a change remounts them. */}
      <Screen key={scheme ?? 'light'} />
    </ScreenOffsetContext.Provider>
  );
};

export default function App() {
  const { dark, colors } = useTheme();
  const [example, setExample] = useState<Example>();
  const exampleRef = useRef(example);

  useEffect(() => {
    exampleRef.current = example;
  }, [example]);

  // Registered once, before any screen mounts, so back handlers added by a
  // screen (a custom keyboard closing on back) run before this one.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!exampleRef.current) return false;
        setExample(undefined);
        return true;
      }
    );
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      {/* The keyboards rise from the window bottom, so the screens extend
          under the home indicator. */}
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[
          styles.fullScreen,
          {
            backgroundColor: example ? colors.surface : colors.background,
          },
        ]}
      >
        {example ? (
          <ExampleScreen
            example={example}
            onBack={() => setExample(undefined)}
          />
        ) : (
          <Home onOpen={setExample} />
        )}
      </SafeAreaView>
      <StatusBar style={dark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  pressed: {
    opacity: 0.5,
  },
  title: Platform.select({
    ios: {
      ...StyleSheet.absoluteFill,
      paddingHorizontal: 120,
      textAlign: 'center',
      textAlignVertical: 'center',
      lineHeight: 48,
      pointerEvents: 'none',
    },
    default: {
      flex: 1,
      marginLeft: spacing.xs,
      fontSize: 20,
      fontWeight: '500',
    },
  }),
});
