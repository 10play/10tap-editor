import type { ConfigContext, ExpoConfig } from 'expo/config'

import { version } from './package.json'

type BuildType = 'development' | 'production'

type ExpoPlugins = ExpoConfig['plugins']

const appIcons = {
	development: './src/assets/images/icon.png',
	production: './src/assets/images/icon.png',
} as const satisfies Record<BuildType, string>

const appNames = {
	development: 'example-expo',
	production: 'example-expo',
} as const satisfies Record<BuildType, string>

const slugs = {
	development: 'example-expo',
	production: 'example-expo',
} as const satisfies Record<BuildType, string>

const getPlugins = (): NonNullable<ExpoPlugins> => [
	[
		'expo-build-properties',
		{
			android: {
				minSdkVersion: 29,
			},
		},
	],
	'expo-router',
	'expo-web-browser',
]

const buildType =
	(process.env.EXPO_PUBLIC_ENVIRONMENT as BuildType) ?? 'development'

export default ({ config }: ConfigContext): ExpoConfig => {
	const appIcon = appIcons[buildType]
	const appName = appNames[buildType]
	const slug = slugs[buildType]

	return {
		name: appName,
		slug,
		version,
		orientation: 'portrait',
		icon: appIcon,
		userInterfaceStyle: 'automatic',
		ios: {
			supportsTablet: true,
		},
		android: {
			adaptiveIcon: {
				foregroundImage: './src/assets/images/adaptive-icon.png',
				backgroundColor: '#ffffff',
			},
			edgeToEdgeEnabled: true,
		},
		web: {
			bundler: 'metro',
			output: 'static',
			favicon: './src/assets/images/favicon.png',
		},
		plugins: getPlugins(),
		experiments: {
			typedRoutes: true,
		},
		scheme: 'exampleexpo',
	}
}
