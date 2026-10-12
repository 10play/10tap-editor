---
sidebar_position: 10
---

# Custom Keyboard

In this example we will create and add a custom sticker keyboard 👯‍♀️
We go through the code in small chunks; the [full solution](#full-solution) is at the end. For the API reference see [Custom Keyboard Utils](../api/CustomKeyboardUtils.md). Runnable versions are in [`example/src/Examples/Keyboard`](https://github.com/10play/10tap-editor/tree/main/example/src/Examples/Keyboard) and [`example-expo/src/screens`](https://github.com/10play/10tap-editor/tree/main/example-expo/src/screens) (inline and overlay layouts).

<div style={{justifyContent: 'center', display: 'flex'}}>
  <img height="400" src="/10tap-editor/img/customkeyboard.gif"/>
</div>

### First, let's create a new CustomKeyboard

```tsx
const StickerKeyboardComp = ({ editor }: CustomKeyboardComponentProps) => {
  return (
    <View style={keyboardStyles.keyboardContainer}>
      <StickerRow stickers={stickersTop} editor={editor} />
      <StickerRow stickers={stickersBottom} editor={editor} />
    </View>
  );
};

export const StickerKeyboard = new CustomKeyboardExtension(
  'keyboard.sticker',
  StickerKeyboardComp
);
```

- `StickerKeyboardComp` is the view that is shown in place of the system keyboard. It is rendered in your app's own React tree, so it can use your context providers and state, and it re-renders like any other component.
- The keyboard component receives `editor`, `close` and `keyboardHeight` props, typed as `CustomKeyboardComponentProps`. Each sticker calls `editor.setImage(sticker)`.
- `CustomKeyboardExtension` gives the keyboard the id `keyboard.sticker`.

### Now we can use our custom keyboard

```tsx
export const CustomKeyboardExample = () => {
  const editor = useEditorBridge({
    avoidIosKeyboard: true,
    autofocus: true,
    bridgeExtensions: [
      ...TenTapStartKit,
      ImageBridge.configureExtension({ inline: true }),
    ],
  });
  const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

  return (
    <SafeAreaView style={exampleStyles.fullScreen} edges={['top']}>
      <View style={exampleStyles.fullScreen}>
        <RichText editor={editor} />
      </View>
      <EditorKeyboardAvoidingView style={exampleStyles.keyboardAvoidingView}>
        <StickerToolbar
          activeKeyboard={activeKeyboard}
          setActiveKeyboard={setActiveKeyboard}
          editor={editor}
        />
        <CustomKeyboard
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
          keyboards={[StickerKeyboard]} // <-- Add our custom keyboard to the keyboards prop
          editor={editor}
        />
      </EditorKeyboardAvoidingView>
    </SafeAreaView>
  );
};
```

- A react state controls which custom keyboard is shown. `CustomKeyboard` calls `setActiveKeyboard(undefined)` itself when the keyboard closes, for example when the user taps the editor.
- `CustomKeyboard` goes right under the toolbar, as the last child of the same `EditorKeyboardAvoidingView`, so the toolbar stays where it is when the keyboards switch. `EditorKeyboardAvoidingView` pads for the system keyboard and leaves out the space the open `CustomKeyboard` takes itself. It also works on edge-to-edge Android (the default in Expo), where the window does not resize for the keyboard, so a React Native `KeyboardAvoidingView` with `behavior="height"` or no behavior, as in 0.7.x, leaves the toolbar behind the keyboard.

### Add button that will toggle our custom keyboard

```tsx
const StickerToolbar = ({
  editor,
  activeKeyboard,
  setActiveKeyboard,
}: ToolbarWithStickersProps) => {
  return (
    <Toolbar
      editor={editor}
      items={[
        {
          onPress: () => () => {
            const isActive = activeKeyboard === StickerKeyboard.id;
            if (isActive) editor.focus();
            setActiveKeyboard(isActive ? undefined : StickerKeyboard.id);
          },
          active: () => activeKeyboard === StickerKeyboard.id,
          disabled: () => false,
          image: () => Images.palette,
        },
        ...DEFAULT_TOOLBAR_ITEMS,
      ]}
    />
  );
};
```

- The [Toolbar](../api/Components.md#toolbar) stays visible while a custom keyboard is open, so no extra `hidden` logic is needed.
- Pressing the button again calls `editor.focus()`, which brings the system keyboard back.

:::note Upgrading from 0.7.x
The 0.7.x version of this example still works: `rootRef` is ignored, and a toolbar that computes `hidden` from `useKeyboard()` and `activeKeyboard` keeps working. You can remove both.
:::

### Full solution

```tsx
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  RichText,
  Toolbar,
  useEditorBridge,
  type EditorBridge,
  TenTapStartKit,
  ImageBridge,
  CustomKeyboard,
  CustomKeyboardExtension,
  EditorKeyboardAvoidingView,
  DEFAULT_TOOLBAR_ITEMS,
  Images,
  type CustomKeyboardComponentProps,
} from '@10play/tentap-editor';

const stickersTop = [
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707657614/7c1d68c9-126c-4967-a6a4-7252e998802d.png',
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707657441/skel_uv9mo1.png',
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707657821/ecee86ed-6291-412c-9570-2b561314d723.png',
];
const stickersBottom = [
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707658182/53b06114-544c-4048-869f-fedbc6d51bb9.png',
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707658198/75fe11eb-1d93-45e4-bb97-d8e26dbe4335.png',
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707658214/c6cadcf3-785c-49ec-b34d-c6d8ea544153.png',
];

const StickerRow = ({
  stickers,
  editor,
}: {
  stickers: string[];
  editor: EditorBridge;
}) => {
  return (
    <View style={keyboardStyles.row}>
      {stickers.map((sticker) => (
        <TouchableOpacity
          key={sticker}
          style={keyboardStyles.sticker}
          onPress={() => editor.setImage(sticker)}
        >
          <Image source={{ uri: sticker }} style={keyboardStyles.image} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const StickerKeyboardComp = ({ editor }: CustomKeyboardComponentProps) => {
  return (
    <View style={keyboardStyles.keyboardContainer}>
      <StickerRow stickers={stickersTop} editor={editor} />
      <StickerRow stickers={stickersBottom} editor={editor} />
    </View>
  );
};

export const StickerKeyboard = new CustomKeyboardExtension(
  'keyboard.sticker',
  StickerKeyboardComp
);

export const CustomKeyboardExample = () => {
  const editor = useEditorBridge({
    avoidIosKeyboard: true,
    autofocus: true,
    bridgeExtensions: [
      ...TenTapStartKit,
      ImageBridge.configureExtension({ inline: true }),
    ],
  });
  const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

  return (
    <SafeAreaView style={exampleStyles.fullScreen} edges={['top']}>
      <View style={exampleStyles.fullScreen}>
        <RichText editor={editor} />
      </View>
      <EditorKeyboardAvoidingView style={exampleStyles.keyboardAvoidingView}>
        <StickerToolbar
          activeKeyboard={activeKeyboard}
          setActiveKeyboard={setActiveKeyboard}
          editor={editor}
        />
        <CustomKeyboard
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
          keyboards={[StickerKeyboard]}
          editor={editor}
        />
      </EditorKeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface ToolbarWithStickersProps {
  editor: EditorBridge;
  activeKeyboard: string | undefined;
  setActiveKeyboard: (id: string | undefined) => void;
}

const StickerToolbar = ({
  editor,
  activeKeyboard,
  setActiveKeyboard,
}: ToolbarWithStickersProps) => {
  return (
    <Toolbar
      editor={editor}
      items={[
        {
          onPress: () => () => {
            const isActive = activeKeyboard === StickerKeyboard.id;
            if (isActive) editor.focus();
            setActiveKeyboard(isActive ? undefined : StickerKeyboard.id);
          },
          active: () => activeKeyboard === StickerKeyboard.id,
          disabled: () => false,
          image: () => Images.palette,
        },
        ...DEFAULT_TOOLBAR_ITEMS,
      ]}
    />
  );
};

const keyboardStyles = StyleSheet.create({
  keyboardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sticker: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: 100, height: 100 },
});

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

## Layouts

### Inline (default)

The layout above: `CustomKeyboard` takes up the keyboard's height under the toolbar, and an `EditorKeyboardAvoidingView` around both keeps the toolbar in place for the system keyboard. This is the 0.7.x layout with `EditorKeyboardAvoidingView` in place of React Native's `KeyboardAvoidingView`; the 0.7.x version keeps working where the window resizes for the keyboard.

### Overlay with EditorKeyboardAvoidingView

`EditorKeyboardAvoidingView` pads its content by the height of whichever keyboard is up and keeps the same padding while switching, so it doesn't depend on the timing of React Native's keyboard events. Combine it with `layout="overlay"`, and render `CustomKeyboard` after it, outside the padded view:

```tsx
<SafeAreaView style={exampleStyles.fullScreen} edges={['top']}>
  <EditorKeyboardAvoidingView style={exampleStyles.fullScreen}>
    <View style={exampleStyles.fullScreen}>
      <RichText editor={editor} />
    </View>
    {/* In a row, the toolbar's default flex: 1 only fills the width */}
    <View style={{ flexDirection: 'row' }}>
      <StickerToolbar
        activeKeyboard={activeKeyboard}
        setActiveKeyboard={setActiveKeyboard}
        editor={editor}
      />
    </View>
  </EditorKeyboardAvoidingView>
  <CustomKeyboard
    layout="overlay"
    activeKeyboardID={activeKeyboard}
    setActiveKeyboardID={setActiveKeyboard}
    keyboards={[StickerKeyboard]}
    editor={editor}
  />
</SafeAreaView>
```

Here the toolbar is part of the layout instead of being absolutely positioned, and the editor shrinks to make room for whichever keyboard is up.

This is the recommended layout for edge-to-edge Android apps.

### With react-native-keyboard-controller

`react-native-keyboard-controller` only knows about the system keyboard, so its `KeyboardAvoidingView` and `KeyboardStickyView` drop to the bottom while a custom keyboard is open. Use `layout="overlay"` and add the custom keyboard's height yourself with `useCustomKeyboardHeight`:

```tsx
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useCustomKeyboardHeight } from '@10play/tentap-editor';

const ToolbarArea = ({
  editor,
  activeKeyboard,
  setActiveKeyboard,
}: ToolbarWithStickersProps) => {
  const customKeyboardHeight = useCustomKeyboardHeight();

  return (
    <KeyboardStickyView
      style={{ position: 'absolute', width: '100%', bottom: 0 }}
      offset={{ closed: -customKeyboardHeight }}
    >
      <StickerToolbar
        editor={editor}
        activeKeyboard={activeKeyboard}
        setActiveKeyboard={setActiveKeyboard}
      />
    </KeyboardStickyView>
  );
};

// somewhere below, outside the sticky view:
<CustomKeyboard
  layout="overlay"
  activeKeyboardID={activeKeyboard}
  setActiveKeyboardID={setActiveKeyboard}
  keyboards={[StickerKeyboard]}
  editor={editor}
/>;
```

## Android: keeping the toolbar still

With the default `androidKeyboardMode="system"` the window keeps your `softInputMode`. With `adjustResize` (the React Native default) the window resizes when the system keyboard hides, and the custom keyboard takes its space only once React Native reports the hide. The toolbar drops to the bottom and comes back up while switching to the custom keyboard, and is pushed up briefly while switching back. To avoid it:

- use the [overlay layout](#overlay-with-editorkeyboardavoidingview), or
- set `androidKeyboardMode="stable"` on `CustomKeyboard`. It switches the window to `adjustNothing` while `CustomKeyboard` is mounted (Android 11+), and restores your mode on unmount. It needs the native module, so it has no effect in Expo Go, with the fallback driver or inside a `Modal`. Other inputs on that screen then need a `KeyboardAvoidingView` or `EditorKeyboardAvoidingView`.

Edge-to-edge apps (the default with `targetSdk` 36) are not affected: their window never resizes.

## Expo Go and the fallback driver

Expo Go can't load the native `TenTapKeyboard` module, so `CustomKeyboard` uses the JavaScript fallback driver automatically. No code changes are needed; build a dev client for the native driver. You can also force the fallback with `forceFallback` to compare the two.

The fallback is also used inside a React Native `Modal` on Android, and when the native driver fails its self-check (reported through `onKeyboardError`). See the [limitations](../api/CustomKeyboardUtils.md#limitations).
