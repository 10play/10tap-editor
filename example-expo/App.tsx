import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { examples, type Example } from './src/examples';

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
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onBack();
        return true;
      }
    );
    return () => subscription.remove();
  }, [onBack]);

  const Screen = example.component;
  return (
    <>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text style={styles.linkText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>{example.name}</Text>
      </View>
      <Screen />
    </>
  );
};

export default function App() {
  const [example, setExample] = useState<Example>();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.fullScreen}>
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
