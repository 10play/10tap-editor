import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { examples, type Example } from './src/examples';
import { ScreenOffsetContext } from './src/screenOffset';

const Home = ({ onOpen }: { onOpen: (example: Example) => void }) => (
  <View style={styles.home}>
    <Text style={styles.title}>10Tap Rich Text Editor</Text>
    {examples.map((example) => (
      <Pressable
        key={example.name}
        accessibilityRole="button"
        onPress={() => onOpen(example)}
        style={styles.link}
      >
        <Text style={styles.linkText}>{example.name}</Text>
      </Pressable>
    ))}
  </View>
);

const ExampleScreen = ({
  example,
  onBack,
}: {
  example: Example;
  onBack: () => void;
}) => {
  const { top } = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);

  const Screen = example.component;
  return (
    <ScreenOffsetContext.Provider value={top + headerHeight}>
      <View
        style={styles.header}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text style={styles.linkText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>{example.name}</Text>
      </View>
      <Screen />
    </ScreenOffsetContext.Provider>
  );
};

export default function App() {
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
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.fullScreen}>
        {example ? (
          <ExampleScreen
            example={example}
            onBack={() => setExample(undefined)}
          />
        ) : (
          <Home onOpen={setExample} />
        )}
      </SafeAreaView>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: 'white',
  },
  home: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#c4c4c4',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    paddingVertical: 8,
  },
  linkText: {
    color: '#1a73e8',
    fontSize: 16,
  },
});
