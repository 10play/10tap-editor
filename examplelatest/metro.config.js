const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const escape = require('escape-string-regexp');
let exclusionList;
try {
  exclusionList = require('metro-config/src/defaults/exclusionList');
} catch (e) {
  exclusionList = require('metro-config/private/defaults/exclusionList');
}
if (typeof exclusionList !== 'function') {
  exclusionList = exclusionList.default || exclusionList;
}
const pak = require('../package.json');

const root = path.resolve(__dirname, '..');
const modules = Object.keys({ ...pak.peerDependencies });

const config = {
  watchFolders: [root],
  resolver: {
    blacklistRE: exclusionList(
      modules.map((m) =>
        new RegExp(`^${escape(path.join(root, 'node_modules', m))}\\/.*$`)
      )
    ),
    extraNodeModules: modules.reduce((acc, name) => {
      acc[name] = path.join(__dirname, 'node_modules', name);
      return acc;
    }, {}),
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

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
