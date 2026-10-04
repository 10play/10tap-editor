import React, { type ComponentType } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import {
  NavigationContainer,
  type ParamListBase,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Basic } from '../examplelatest/src/Examples/Basic';
import { ConfigureExtensions } from '../examplelatest/src/Examples/ConfigureExtentions';
import { CustomAndStaticToolbar } from '../examplelatest/src/Examples/CustomAndStaticToolbar/CustomAndStaticToolbar';
import { CustomCss } from '../examplelatest/src/Examples/CustomCss';
import { DarkEditor } from '../examplelatest/src/Examples/DarkEditor';
import { EditorStickToKeyboardExample } from '../examplelatest/src/Examples/EditorStickToKeyboardExample';
import { keyboardExamples } from '../examplelatest/src/Examples/Keyboard';
import { NavigationHeader } from '../examplelatest/src/Examples/NavigationHeader';
import { reproExamples } from '../examplelatest/src/Examples/Repro';

type ScreenProps = NativeStackScreenProps<ParamListBase>;
type Example = { name: string; component: ComponentType<ScreenProps> };

// The examplelatest screens, minus Advanced (it needs its own web bundle).
const examples: Example[] = [
  { name: 'Basic', component: Basic },
  { name: 'Custom CSS', component: CustomCss },
  { name: 'Configure Extensions', component: ConfigureExtensions },
  { name: 'Dark Editor', component: DarkEditor },
  {
    name: 'EditorStickToKeyboardExample',
    component: EditorStickToKeyboardExample,
  },
  { name: 'NavigationHeader', component: NavigationHeader },
  { name: 'CustomAndStaticToolbar', component: CustomAndStaticToolbar },
  ...keyboardExamples,
  ...reproExamples,
];

const HomeScreen = ({ navigation }: ScreenProps) => (
  <ScrollView contentContainerStyle={styles.home}>
    <Text style={styles.title}>10Tap on React Native 0.76</Text>
    {examples.map(({ name }) => (
      <Pressable
        key={name}
        accessibilityRole="button"
        onPress={() => navigation.navigate(name)}
        style={styles.link}
      >
        <Text style={styles.linkText}>{name}</Text>
      </Pressable>
    ))}
  </ScrollView>
);

const Stack = createNativeStackNavigator();

const App = () => (
  <SafeAreaProvider>
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ route }) => ({
          headerShown: route.name === 'NavigationHeader',
        })}
      >
        <Stack.Screen name="Examples" component={HomeScreen} />
        {examples.map(({ name, component }) => (
          <Stack.Screen key={name} name={name} component={component} />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  </SafeAreaProvider>
);

const styles = StyleSheet.create({
  home: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 48,
  },
  title: {
    marginBottom: 12,
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

export default App;
