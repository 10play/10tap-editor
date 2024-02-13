import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { Basic } from './Examples/Basic';
import { CustomKeyboardExample } from './Examples/CustomKeyboardExample';
import { EditorStickToKeyboardExample } from './Examples/EditorStickToKeyboardExample';
import { Advanced } from './Examples/Advanced/AdvancedRichText';
import { CustomAndStaticToolbar } from './Examples/CustomAndStaticToolbar/CustomAndStaticToolbar';
import { WithKeyboard } from './Examples/WithKeyboard';
import { CustomCss } from './Examples/CustomCss';
import { ConfigureExtensions } from './Examples/ConfigureExtentions';
import { NavigationHeader } from './Examples/NavigationHeader';

const examples = [
  {
    name: 'Basic',
    component: Basic,
  },
  {
    name: 'With Color Keyboard',
    component: WithKeyboard,
  },
  {
    name: 'Custom CSS',
    component: CustomCss,
  },
  {
    name: 'Configure Extensions',
    component: ConfigureExtensions,
  },
  {
    name: 'CustomKeyboard',
    component: CustomKeyboardExample,
  },
  {
    name: 'EditorStickToKeyboardExample',
    component: EditorStickToKeyboardExample,
  },
  {
    name: 'NavigationHeader',
    component: NavigationHeader,
  },
  {
    name: 'CustomAndStaticToolbar',
    component: CustomAndStaticToolbar,
  },
  {
    name: 'Advanced',
    component: Advanced,
  },
];

const HomeScreen = ({ navigation }: NativeStackScreenProps<any, any, any>) => {
  return (
    <View style={homeStyles.container}>
      <Text>10Tap Rich Text Editor!</Text>
      {examples.map((example) => (
        <Button
          key={example.name}
          title={example.name}
          onPress={() => navigation.navigate(example.name)}
        />
      ))}
    </View>
  );
};

const Stack = createNativeStackNavigator();
const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ route }) => {
          return {
            headerShown: route.name === 'NavigationHeader',
          };
        }}
      >
        <Stack.Screen name="Examples" component={HomeScreen} />
        {examples.map((example) => (
          <Stack.Screen
            key={example.name}
            name={example.name}
            component={example.component}
          />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default App;
