---
sidebar_position: 9
---

# Using The ColorKeyboard

In this example we will add the ColorKeyboard, and a custom button to toggle it in the Toolbar

## Adding CustomKeyboard Component

First we need a state of the current active keyboard id (used inside the toolbar to show and hide the color keyboard)

```tsx
const [activeKeyboard, setActiveKeyboard] = React.useState<string>();
```

Then, into our `KeyboardAvoidingView` we want to add the `CustomKeyboard` component, right under the toolbar

```tsx
<KeyboardAvoidingView
  behavior={'padding'}
  style={exampleStyles.keyboardAvoidingView}
>
  <Toolbar
    ...
  />
  <CustomKeyboard
    activeKeyboardID={activeKeyboard}
    setActiveKeyboardID={setActiveKeyboard}
    keyboards={[ColorKeyboard]} // <-- here we add the color keyboard
    editor={editor}
  />
</KeyboardAvoidingView>
```

## Adding Custom Toolbar

Now that we have added the custom keyboard, we need to add a button to the toolbar so we can open it.
We create a new component `ToolbarWithColor` that adds a button toggling the color keyboard in front of the default items.

```tsx
interface ToolbarWithColorProps {
  editor: EditorBridge;
  activeKeyboard: string | undefined;
  setActiveKeyboard: (id: string | undefined) => void;
}
const ToolbarWithColor = ({
  editor,
  activeKeyboard,
  setActiveKeyboard,
}: ToolbarWithColorProps) => {
  return (
    <Toolbar
      editor={editor}
      items={[
        {
          onPress: () => () => {
            const isActive = activeKeyboard === ColorKeyboard.id;
            if (isActive) editor.focus();
            setActiveKeyboard(isActive ? undefined : ColorKeyboard.id);
          },
          active: () => activeKeyboard === ColorKeyboard.id,
          disabled: () => false,
          image: () => Images.palette,
        },
        ...DEFAULT_TOOLBAR_ITEMS,
      ]}
    />
  );
};
```

The toolbar stays visible while the color keyboard is open. Picking a color applies it and brings the system keyboard back, and tapping the editor closes the color keyboard too.

Then all that is left to replace `Toolbar` with our new `ToolbarWithColor` and we're done!

```tsx
<ToolbarWithColor
  editor={editor}
  activeKeyboard={activeKeyboard}
  setActiveKeyboard={setActiveKeyboard}
/>
```

## Full Example

```tsx
import React from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ColorKeyboard,
  CustomKeyboard,
  DEFAULT_TOOLBAR_ITEMS,
  Images,
  RichText,
  Toolbar,
  useEditorBridge,
  type EditorBridge,
} from '@10play/tentap-editor';

export const WithColorKeyboard = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: '<p>Select some text and pick a color</p>',
  });
  const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

  return (
    <SafeAreaView style={exampleStyles.fullScreen}>
      <View style={exampleStyles.fullScreen}>
        <RichText editor={editor} />
      </View>
      <KeyboardAvoidingView
        behavior={'padding'}
        style={exampleStyles.keyboardAvoidingView}
      >
        <ToolbarWithColor
          editor={editor}
          activeKeyboard={activeKeyboard}
          setActiveKeyboard={setActiveKeyboard}
        />
        <CustomKeyboard
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
          keyboards={[ColorKeyboard]}
          editor={editor}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface ToolbarWithColorProps {
  editor: EditorBridge;
  activeKeyboard: string | undefined;
  setActiveKeyboard: (id: string | undefined) => void;
}

const ToolbarWithColor = ({
  editor,
  activeKeyboard,
  setActiveKeyboard,
}: ToolbarWithColorProps) => {
  return (
    <Toolbar
      editor={editor}
      items={[
        {
          onPress: () => () => {
            const isActive = activeKeyboard === ColorKeyboard.id;
            if (isActive) editor.focus();
            setActiveKeyboard(isActive ? undefined : ColorKeyboard.id);
          },
          active: () => activeKeyboard === ColorKeyboard.id,
          disabled: () => false,
          image: () => Images.palette,
        },
        ...DEFAULT_TOOLBAR_ITEMS,
      ]}
    />
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
```

## Customizing the colors

The colors, their labels and the keyboard's styles come from the `colorKeyboard` key of the editor theme. See [Color keyboard theme](./customTheme.md#color-keyboard-theme).
