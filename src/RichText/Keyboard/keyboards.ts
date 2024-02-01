import { AppRegistry } from 'react-native';
import { ColorKeyboard } from './ColorKeyboard';

export const register = () => {
  AppRegistry.registerComponent('keyboard.color', () => ColorKeyboard);
};
