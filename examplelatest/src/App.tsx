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

type ScreenProps = NativeStackScreenProps<ParamListBase>;
type Example = { name: string; component: ComponentType<ScreenProps> };

// The names are also the Maestro entry points (examplelatest/.maestro).
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
  { name: 'Advanced', component: Advanced },
  ...keyboardExamples,
  ...reproExamples,
];

const HomeScreen = ({ navigation }: ScreenProps) => (
  <ScrollView contentContainerStyle={styles.home}>
    <Text style={styles.title}>10Tap Rich Text Editor!</Text>
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
