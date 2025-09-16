import { type Href, Link } from 'expo-router'
import React from 'react'
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native'

const examples: { name: string; href: Href }[] = [
	{ name: 'Basic', href: '/(examples)/basic' as Href },
	// { name: 'With Color Keyboard', href: '/with-color-keyboard' },
	{ name: 'Custom CSS', href: '/(examples)/custom-css' as Href },

	// { name: 'Configure Extensions', href: '/configure-extensions' },
	// { name: 'CustomKeyboard', href: '/custom-keyboard' },
	// { name: 'Dark Editor', href: '/dark-editor' },
	// {
	// 	name: 'EditorStickToKeyboardExample',
	// 	href: '/editor-stick-to-keyboard-example',
	// },
	// { name: 'NavigationHeader', href: '/navigation-header' },
	// { name: 'CustomAndStaticToolbar', href: '/custom-and-static-toolbar' },
	// { name: 'Advanced', href: '/advanced' },
]

const HomeScreen = () => {
	return (
		<ScrollView>
			<View style={homeStyles.container}>
				<Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
					10Tap Rich Text Editor Examples
				</Text>
				{examples.map(example => (
					<Link href={example.href} key={example.name} asChild>
						<View style={{ marginVertical: 5 }}>
							<Button title={example.name} />
						</View>
					</Link>
				))}
			</View>
		</ScrollView>
	)
}

const homeStyles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 40,
	},
})

export default HomeScreen
