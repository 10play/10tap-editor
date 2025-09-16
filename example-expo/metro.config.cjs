/**
 * Documentation at https://docs.expo.io/guides/customizing-metro
 */
const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '..') // Points to the monorepo root (10tap-editor)

let config = getDefaultConfig(projectRoot, {
	// [Web-only]: Enables CSS support in Metro.
	isCSSEnabled: true,
})

config = {
	...config,
	projectRoot,
	// 1. Watch all files within the monorepo for changes
	watchFolders: [monorepoRoot],
	resolver: {
		...config.resolver,
		unstable_enablePackageExports: true,
		// 2. Let Metro know where to resolve packages (local first, then monorepo root)
		nodeModulesPaths: [
			path.resolve(projectRoot, 'node_modules'),
			path.resolve(monorepoRoot, 'node_modules'),
		],
		extraNodeModules: {
			...config.resolver.extraNodeModules,
			assets: path.resolve(projectRoot, 'src/assets'),
		},
	},
}

const webAliases = {
	'react-native': 'react-native-web',
	'react-native-webview': '@10play/react-native-web-webview',
	'react-native/Libraries/Utilities/codegenNativeComponent':
		'@10play/react-native-web-webview/shim',
	crypto: 'expo-crypto',
}

const originalResolveRequest = config.resolver.resolveRequest

// Chain the custom resolveRequest to handle web aliases without overriding Expo Router's logic
config.resolver.resolveRequest = (
	context,
	realModuleName,
	platform,
	moduleName,
) => {
	if (platform === 'web') {
		const alias = webAliases[realModuleName]
		if (alias) {
			return {
				filePath: require.resolve(alias),
				type: 'sourceFile',
			}
		}
	}
	// Fall back to the original (includes Expo Router's overrides)
	if (typeof originalResolveRequest === 'function') {
		return originalResolveRequest(context, realModuleName, platform, moduleName)
	}
	return context.resolveRequest(context, realModuleName, platform, moduleName)
}

module.exports = config
