import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor'
import React from 'react'
import {
	KeyboardAvoidingView,
	Platform,
	SafeAreaView,
	StyleSheet,
} from 'react-native'

export default function Basic() {
	const editor = useEditorBridge({
		autofocus: true,
		avoidIosKeyboard: true,
		initialContent,
	})

	return (
		<SafeAreaView style={exampleStyles.fullScreen}>
			<RichText editor={editor} />
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={exampleStyles.keyboardAvoidingView}
			>
				<Toolbar editor={editor} />
			</KeyboardAvoidingView>
		</SafeAreaView>
	)
}

const exampleStyles = StyleSheet.create({
	fullScreen: {
		flex: 1,
	},
	keyboardAvoidingView: {
		position: 'absolute',
		width: '100%',
		bottom: 0,
	},
})

const initialContent = `<p>This is a basic example</p>`
