const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const appRoot = __dirname;
const repoRoot = path.resolve(appRoot, '..');

// The library source (../src) sits next to the root node_modules, which hold
// the library's own dev copies of React and React Native. React and every
// package with native code must come from this app, so imports of these
// packages from outside the app resolve as if they were made from the app.
const appOwnedPackages = new Set([
  'react',
  'react-native',
  'react-native-webview',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-svg',
  '@react-navigation/native',
  '@react-navigation/native-stack',
]);

const packageName = (request) => {
  const parts = request.split('/');
  return request.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
};

const appEntry = path.join(appRoot, 'index.js');

const config = {
  watchFolders: [repoRoot],
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      const fromOutsideApp = !context.originModulePath.startsWith(
        appRoot + path.sep
      );
      if (fromOutsideApp && appOwnedPackages.has(packageName(moduleName))) {
        return context.resolveRequest(
          { ...context, originModulePath: appEntry },
          moduleName,
          platform
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(appRoot), config);
