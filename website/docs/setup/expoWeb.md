---
sidebar_position: 3
---

# Expo Web Setup

Some additional steps are necessary for supporting expo web

### Step 1 - Install required deps

`npx expo install @10play/react-native-web-webview expo-crypto`

### Step 2 - Customize webpack.config.js

`npx expo customize webpack.config.js`

Into your `webpack.config.js` add the following configuration

```js
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Alias react-native-web and react-native-webview on web
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native': 'react-native-web',
    'react-native-webview': '@10play/react-native-web-webview',
    'crypto': 'expo-crypto',
  };

  // Shim codegenNativeComponent and add crypto
  config.resolve.fallback = {
    ...config.resolve.fallback,
    'react-native/Libraries/Utilities/codegenNativeComponent':
      '@10play/react-native-web-webview/shim',
  };

  return config;
};
```

### Step 3 - Restart Metro

Restart metro for changes to take effect and the editor should load
