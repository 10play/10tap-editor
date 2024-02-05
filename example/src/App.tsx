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
import { Compose } from './Examples/Compose';

const examples = [
  {
    name: 'Basic',
    component: Basic,
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
    name: 'Compose',
    component: Compose,
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
        screenOptions={{
          headerShown: false,
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
