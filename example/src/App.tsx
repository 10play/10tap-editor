import React from 'react';
import { View, Text, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { Basic } from './Examples/Basic';
import { CustomKeyboardExample } from './Examples/CustomKeyboardExample';

const HomeScreen = ({ navigation }: NativeStackScreenProps<any, any, any>) => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>10Tap Rich Text Editor!</Text>
      <Button
        title="Basic Usage"
        onPress={() => navigation.navigate('Basic')}
      />
      <Button
        title="Custom Keyboard"
        onPress={() => navigation.navigate('CustomKeyboard')}
      />
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
        <Stack.Screen name="Basic" component={Basic} />
        <Stack.Screen name="CustomKeyboard" component={CustomKeyboardExample} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
