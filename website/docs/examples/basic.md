---
sidebar_position: 1
---

# Basic example

In this example we will be creating a basic editor that contains all of the pre-built bridgeExtensions and a toolbar on top of the keyboard. [Jump To Full Example](#full-example)

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
  bridgeExtensions: TenTapStartKit,
});
```

## Adding the RichText component

Now we will add our RichText component, this is simply a WebView that runs a pre-built tiptap bundle with some extensions, that is then communicated with via our bridgeExtensions

The RichText component receives the EditorBridge we created before

```tsx
<SafeAreaView style={exampleStyles.fullScreen}>
  <RichText editor={editor} />
</SafeAreaView>;
```

## Adding a Toolbar on the keyboard

Our RichText is pretty empty without a toolbar, so let's add one.
We wrap the editor and the toolbar in an `EditorKeyboardAvoidingView`, which makes room for the keyboard so the toolbar sits right on top of it:

```tsx
<SafeAreaView style={exampleStyles.fullScreen}>
  <EditorKeyboardAvoidingView style={exampleStyles.fullScreen}>
    <View style={exampleStyles.fullScreen}>
      <RichText editor={editor} />
    </View>
    <View style={exampleStyles.toolbarRow}>
      <Toolbar editor={editor} />
    </View>
  </EditorKeyboardAvoidingView>
</SafeAreaView>;
```

`EditorKeyboardAvoidingView` measures how far the keyboard reaches into it, so it needs no `keyboardVerticalOffset` below a navigation header and it also works on edge-to-edge Android. The `Toolbar` shows itself while the editor is focused and the keyboard is up, and the editor keeps the line being typed above it. See [Keyboard and caret](../setup/keyboard.md).

> The 1.0 version of this example, with React Native's `KeyboardAvoidingView` absolutely positioned at the bottom of the screen, keeps working. See [the 1.0 layout](../setup/keyboard.md#the-10-layout).

## Full Example

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  EditorKeyboardAvoidingView,
  RichText,
  Toolbar,
  useEditorBridge,
} from '@10play/tentap-editor';

export const Basic = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });

  return (
    <SafeAreaView style={exampleStyles.fullScreen}>
      <EditorKeyboardAvoidingView style={exampleStyles.fullScreen}>
        <View style={exampleStyles.fullScreen}>
          <RichText editor={editor} />
        </View>
        <View style={exampleStyles.toolbarRow}>
          <Toolbar editor={editor} />
        </View>
      </EditorKeyboardAvoidingView>
    </SafeAreaView>
  );
};

const exampleStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  toolbarRow: {
    flexDirection: 'row',
  },
});

const initialContent = `<p>This is a basic example!</p>`;
```

More screens, including custom keyboards, dynamic height and a navigation header, are in the example apps: [`example/`](https://github.com/10play/10tap-editor/tree/main/example) (React Native CLI) and [`example-expo/`](https://github.com/10play/10tap-editor/tree/main/example-expo) (Expo dev client).
