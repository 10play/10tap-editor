---
sidebar_position: 1
---

# Basic example

In this example we will be creating a basic editor that contains all of the pre-built bridgeExtensions and a keyboard aware toolbar. [Jump To Full Example](#full-example)

## Creating The Editor Bridge

The first thing we want to do is create our [EditorBridge](../api/EditorBridge.md) add link to editor bridge.
To do this we will use the `useEditorBridge` hook in our component. This by default will contain the `TenTapStartKit` (#TODO show link)
Now we have added all of the pre-built bridgeExtensions provided by tentap, and our editor will support all of these bridgeExtensions features

```tsx
const editor = useEditorBridge();
```

This is the same ass passing

```tsx
const editor = useEditorBridge({
  bridgeExtensions: TenTapStarterKit,
});
```

## Adding the RichText component

Now we will add our RichText component, this is simply a WebView that runs a pre-built tiptap bundle with some extensions, that is then communicated with via our bridgeExtensions

The RichText component receives the EditorBridge we created before

```tsx
<SafeAreaView style={exampleStyles.fullScreen}>
  <RichText editor={editor} />
</SafeAreaView>
```

## Adding a Keyboard Aware Toolbar

Our RichText is pretty empty without a toolbar, so let's add it
We need wrap the entire the toolbar and keyboard in a `KeyboardAvoidingView` to display the toolbar right above the keyboard

```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={exampleStyles.keyboardAvoidingView}
>
  <Toolbar editor={editor} />
</KeyboardAvoidingView>
```

## Full Example

```tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  SafeAreaView,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';

export const Basic = ({}: NativeStackScreenProps<any, any, any>) => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });

  return (
    <SafeAreaView style={exampleStyles.fullScreen}>
      <View style={exampleStyles.fullScreen}>
        <RichText editor={editor} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={exampleStyles.keyboardAvoidingView}
      >
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const exampleStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});

const initialContent = `<p>This is a basic example!</p>`;
```
