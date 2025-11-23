---
sidebar_position: 1
---

# Basic example

In this example we will be creating a basic editor that contains all of the pre-built bridgeExtensions and a keyboard aware toolbar. [Jump To Full Example](#full-example)

## Creating The Editor Bridge

The first thing we want to do is create our [EditorBridge](../api/EditorBridge.md).
To do this we will use the `useEditorBridge` hook. This by default will contain the `TenTapStartKit` which includes all of [the following bridge extensions](../api/BridgeExtensions.md).
Now we have added all of the pre-built bridgeExtensions provided by tentap, and our editor will support all of these bridgeExtensions features

```tsx
const editor = useEditorBridge();
```

This is the same as passing

```tsx
const editor = useEditorBridge({
  bridgeExtensions: TenTapStarterKit,
});
```

## Adding the RichText component

Now we will add our RichText component, this is simply a WebView that runs a pre-built tiptap bundle with some extensions, that is then communicated with via our bridgeExtensions

The RichText component receives the EditorBridge we created before

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={exampleStyles.fullScreen}>
  <RichText editor={editor} />
</SafeAreaView>
```

## Adding a Keyboard Aware Toolbar

Our RichText is pretty empty without a toolbar, so let's add one
We need wrap the entire the toolbar and keyboard in a `KeyboardAvoidingView` to display the toolbar right above the keyboard

```tsx
const exampleStyles = StyleSheet.create({
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});

...

<KeyboardAvoidingView
  behavior={'padding'}
  style={exampleStyles.keyboardAvoidingView}
>
  <Toolbar editor={editor} />
</KeyboardAvoidingView>
```

> The exact configuration of your KeyboardAvoidingView will differ depending on how you build you app, and you might need to alter the `keyboardVerticalOffset` prop. For an example of this case check out [this example](./navHeader.md)

## Full Example

```tsx
import React from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';

export const Basic = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });

  return (
    <SafeAreaView style={exampleStyles.fullScreen}>
      <RichText editor={editor} />
      <KeyboardAvoidingView
        behavior={'padding'}
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
