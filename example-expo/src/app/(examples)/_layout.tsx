import { Stack } from 'expo-router'
import React from 'react'

export default function ExamplesLayout() {
	return (
		<Stack>
			<Stack.Screen name='index' options={{ title: 'Examples' }} />
		</Stack>
	)
}
