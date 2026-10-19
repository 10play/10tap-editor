/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// The home screen shows the architecture; on the old one, RN's deprecation
// toast would cover the last rows the Maestro flows tap.
LogBox.ignoreLogs(['The app is running using the Legacy Architecture']);

AppRegistry.registerComponent(appName, () => App);
