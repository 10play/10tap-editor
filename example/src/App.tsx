import { PortalProvider } from '@gorhom/portal';
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Basic } from './Examples/Basic';
import { CustomKeyboardExample } from './Examples/CustomKeyboardExample';
import { EditorStickToKeyboardExample } from './Examples/EditorStickToKeyboardExample';
import { Advanced } from './Examples/Advanced/AdvancedRichText';
import { CustomAndStaticToolbar } from './Examples/CustomAndStaticToolbar/CustomAndStaticToolbar';
import { WithBottomSheet } from './Examples/WithBottomSheet';
import { WithKeyboard } from './Examples/WithKeyboard';
import { CustomCss } from './Examples/CustomCss';
import { ConfigureExtensions } from './Examples/ConfigureExtentions';
import { NavigationHeader } from './Examples/NavigationHeader';
import { DarkEditor } from './Examples/DarkEditor';

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
    name: 'With @gorhom/bottom-sheet',
    component: WithBottomSheet,
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
    name: 'Dark Editor',
    component: DarkEditor,
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
    <GestureHandlerRootView style={homeStyles.root}>
      <PortalProvider>
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
      </PortalProvider>
    </GestureHandlerRootView>
  );
};

const homeStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default App;
