---
sidebar_position: 2
---

# With Bottom Sheet

In this example we will be creating a basic editor that contains all of the pre-built bridgeExtensions and a keyboard aware toolbar which works with [@gorhom/bottom-sheet](https://ui.gorhom.dev/components/bottom-sheet).

[Jump To Full Example](#full-example)

## Adding [@gorhom/bottom-sheet](https://ui.gorhom.dev/components/bottom-sheet) to your react-native project

First, you need to follow the step-by-step process to add @gorhom/bottom-sheet to your react-native provided in the [documentation](https://ui.gorhom.dev/components/bottom-sheet#installation).

## Creating The Editor Bridge

Next we want to create our [EditorBridge](../api/EditorBridge.md).
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
const bottomSheetRef = React.useRef<BottomSheet>(null);

const openBottomSheet = () => {
  bottomSheetRef.current?.expand();
};

const closeBottomSheet = () => {
  bottomSheetRef.current?.close();
};

...

<SafeAreaView style={exampleStyles.fullScreen}>
  <Button title="Open Bottom Sheet" onPress={openBottomSheet} />
  <BottomSheet snapPoints={['70%']} ref={bottomSheetRef}>
    <Button title="Close Bottom Sheet" onPress={closeBottomSheet} />
    <RichText editor={editor} />
  </BottomSheet>
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
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={exampleStyles.keyboardAvoidingView}
>
  <Toolbar editor={editor} />
</KeyboardAvoidingView>
```

> The exact configuration of your KeyboardAvoidingView will differ depending on how you build you app, and you might need to alter the `keyboardVerticalOffset` prop. For an example of this case check out [this example](./navHeader.md)

## Full Example

```tsx
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Button,
} from 'react-native';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';

export const WithBottomSheet = ({}: NativeStackScreenProps<any, any, any>) => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });

  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  return (
    <SafeAreaView style={exampleStyles.fullScreen}>
      <Button title="Open Bottom Sheet" onPress={openBottomSheet} />
      <BottomSheet snapPoints={['70%']} ref={bottomSheetRef}>
        <Button title="Close Bottom Sheet" onPress={closeBottomSheet} />
        <RichText editor={editor} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={exampleStyles.keyboardAvoidingView}
        >
          <Toolbar editor={editor} ListComponent={BottomSheetFlatList} />
        </KeyboardAvoidingView>
      </BottomSheet>
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
