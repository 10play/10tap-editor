---
sidebar_position: 3
---

# Expo Web Setup (Beta)

Some additional steps are necessary for supporting expo web - see working example [here](https://github.com/10play/10tap-web-example)

### Step 1 - Install required deps

`npx expo install @10play/react-native-web-webview expo-crypto`

### Step 2 - Configuring your bundler

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Which bundler are you using?

<Tabs>
  <TabItem value="metro" label="Metro">
Create config file if not already `npx expo customize metro.config.js`

Into your `metro.config.js` add the following configuration

```js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const webAliases = {
  'react-native': 'react-native-web',
  'react-native-webview': '@10play/react-native-web-webview',
  'react-native/Libraries/Utilities/codegenNativeComponent':
    '@10play/react-native-web-webview/shim',
  'crypto': 'expo-crypto',
};

config.resolver.resolveRequest = (
  context,
  realModuleName,
  platform,
  moduleName
) => {
  if (platform === 'web') {
    const alias = webAliases[realModuleName];
    if (alias) {
      return {
        filePath: require.resolve(alias),
        type: 'sourceFile',
      };
    }
  }
  return context.resolveRequest(context, realModuleName, platform, moduleName);
};

module.exports = config;
```

  </TabItem>
  <TabItem value="webpack" label="Webpack">
Create config file if not already `npx expo customize webpack.config.js`

Into your `webpack.config.js` add the following configuration

```js
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Alias react-native-webview and crypto
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native': 'react-native-web',
    'react-native-webview': '@10play/react-native-web-webview',
    'crypto': 'expo-crypto',
  };

  // Shim codegenNativeComponent
  config.resolve.fallback = {
    ...config.resolve.fallback,
    'react-native/Libraries/Utilities/codegenNativeComponent':
      '@10play/react-native-web-webview/shim',
  };

  return config;
};
```

  </TabItem>
</Tabs>

### Step 3 - Restart Metro

Restart metro for changes to take effect and the editor should load
