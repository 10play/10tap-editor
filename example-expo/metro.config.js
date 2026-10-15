const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const appRoot = __dirname;
const repoRoot = path.resolve(appRoot, '..');
const librarySource = path.join(repoRoot, 'src', 'index');

const config = getDefaultConfig(appRoot);

// The library source (../src) sits next to the root node_modules, which hold
// the library's own dev copies of React and React Native. React and every
// package with native code must come from this app, so imports of these
// packages from outside the app resolve as if they were made from the app.
const appOwnedPackages = new Set([
  'react',
  'react-dom',
  'react-native',
  'react-native-web',
  'react-native-webview',
  'react-native-safe-area-context',
]);

const webAliases = {
  'react-native-webview': '@10play/react-native-web-webview',
  'react-native/Libraries/Utilities/codegenNativeComponent':
    '@10play/react-native-web-webview/shim',
};

const packageName = (request) => {
  const parts = request.split('/');
  return request.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
};

const appEntry = path.join(appRoot, 'index.ts');

config.watchFolders = [repoRoot];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@10play/tentap-editor') {
    return context.resolveRequest(context, librarySource, platform);
  }
  const fromApp = context.originModulePath.startsWith(appRoot + path.sep);
  const appContext = fromApp
    ? context
    : { ...context, originModulePath: appEntry };
  if (platform === 'web' && webAliases[moduleName]) {
    return context.resolveRequest(appContext, webAliases[moduleName], platform);
  }
  if (appOwnedPackages.has(packageName(moduleName))) {
    return context.resolveRequest(appContext, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
