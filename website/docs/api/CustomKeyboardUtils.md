---
description: Reference for CustomKeyboard, ColorKeyboard, EditorKeyboardAvoidingView, useKeyboardAccessory, useScrollToCaret, useKeyboard and the other keyboard APIs.
sidebar_position: 8
---

# Custom Keyboard Utils

A custom keyboard replaces the system keyboard with a React Native view, such as a color picker or a sticker panel, while the editor stays focused. In this page we will show the APIs of the custom keyboard utils.
For examples please see: [Create custom keyboard](../examples/customKeyboard.md) or [Using the ColorKeyboard](../examples/colorKeyboard.md)

## How it works

The keyboard is an ordinary view rendered by `CustomKeyboard` in your own React tree, so it has access to your context providers, state and navigation, and it re-renders like any other component. When it opens, the system keyboard is hidden natively while the editor's WebView keeps focus, so the caret, the selection, a hardware keyboard and IME composition all survive switching between the system and the custom keyboard.

Switching is done by a **driver**:

- **Native driver** (default): uses the `TenTapKeyboard` native module that ships with the package. Needs a native rebuild after installing.
- **Fallback driver**: JavaScript only. Used automatically when the native module isn't available (Expo Go, web, a build without the module), when the editor is inside a `Modal` on Android, and when the native driver fails its self-check. It hides the system keyboard with `inputmode="none"` on the editor. See [limitations](#limitations).

## CustomKeyboard

A react component that renders the active custom keyboard. Render it under your toolbar, as the last child of the same bottom [EditorKeyboardAvoidingView](#editorkeyboardavoidingview), or with `layout="overlay"` after it (see [Layouts](../examples/customKeyboard.md#layouts)). In development on iOS, a warning is logged if the inline keyboard doesn't end at the bottom of the window.

#### keyboards

`CustomKeyboardExtension[]`  
list of [CustomKeyboardExtension's](#customkeyboardextension)

#### activeKeyboardID

`string | undefined`  
the id of the custom keyboard to show. Changing it from an id to `undefined` closes the custom keyboard and brings the system keyboard back.

#### setActiveKeyboardID

`(id: string | undefined) => void`  
called by `CustomKeyboard` when the keyboard closes on its own (see [closing](#closing)), so your state stays in sync. Usually the setter of a `useState`.

#### editor

`EditorBridge`  
the editors `EditorBridge` instance

#### rootBackground

`ColorValue`  
<u>default</u>: `editor.theme.colorKeyboard.keyboardRootColor`<br />
The background of the area the custom keyboard is drawn in, on both platforms.

#### layout

`'inline' | 'overlay'`  
<u>default</u>: `'inline'`<br />

- `'inline'`: `CustomKeyboard` takes up the keyboard's height in the layout, so a `KeyboardAvoidingView` around the toolbar and the keyboard keeps the toolbar in place. This is the 0.7.x layout.
- `'overlay'`: `CustomKeyboard` takes no space in the layout and draws the keyboard over the bottom of the screen. Lift your toolbar yourself, with [EditorKeyboardAvoidingView](#editorkeyboardavoidingview), [useCustomKeyboardHeight](#usecustomkeyboardheight) or [useKeyboard](#usekeyboard). Recommended for edge-to-edge apps and for apps using `react-native-keyboard-controller`.

#### defaultHeight

`number`  
<u>default</u>: 38% of the window height<br />
The custom keyboard has the same height as the last system keyboard shown in the current orientation. `defaultHeight` is used before any system keyboard has been shown.

#### closeOnEditorPress

`boolean`  
<u>default</u>: `true`<br />
Close the custom keyboard and bring back the system keyboard when the user taps the editor.

#### androidKeyboardMode

`'system' | 'stable'`  
<u>default</u>: `'system'`<br />
Android only.

- `'system'` never changes your window's `softInputMode`. With `adjustResize` the window resizes when the system keyboard hides, which can shift the toolbar for about a frame during the switch.
- `'stable'` sets `adjustNothing` on the activity window while `CustomKeyboard` is mounted (API 30+, restored on unmount), so the switch has no shift. Other inputs on the same screen are then no longer resized for; use `EditorKeyboardAvoidingView` or `KeyboardAvoidingView` for them. Ignored below API 30 and inside a `Modal`.

Edge-to-edge apps don't need `'stable'`: their window never resizes.

#### forceFallback

`boolean`  
<u>default</u>: `false`<br />
Always use the JavaScript fallback driver, even when the native module is available.

#### onOpen

`(id: string) => void`  
Called when a custom keyboard has finished opening, with its id.

#### onClose

`() => void`  
Called when the custom keyboard has finished closing.

#### onKeyboardError

`(event: KeyboardErrorEvent) => void`

```ts
interface KeyboardErrorEvent {
  reason: 'verify-timeout' | 'native-error';
  driver: 'native' | 'fallback' | 'inline';
  error?: unknown;
}
```

- `'verify-timeout'`: the system keyboard was still up 600 ms after the driver tried to hide it. If the native driver failed, `CustomKeyboard` switches to the fallback driver for as long as it stays mounted. If the fallback failed too, the custom keyboard closes and the system keyboard stays.
- `'native-error'`: the native module threw; `error` holds what it threw.

A warning is also logged in development.

#### onKeyboardHideAndroid

`() => void`  
**Deprecated**, use `onClose`. Kept from 0.7.x. Called on both platforms when the system keyboard comes back while a custom keyboard is up.

#### rootRef

`React.RefObject<any>`  
**Deprecated, ignored.** Needed by the iOS keyboard in 0.7.x. You can remove it.

## CustomKeyboardExtension

A class that defines a custom keyboard.

```tsx
const StickerKeyboard = new CustomKeyboardExtension(
  'keyboard.sticker',
  StickerKeyboardComp,
  { height: 280 } // optional
);
```

#### id

`string`  
a unique key for the custom keyboard

#### comp

`ComponentType`  
The custom keyboard component. It is rendered inside your app like any other component and receives:

| prop | type | description |
| --- | --- | --- |
| `editor` | `EditorBridge` | the editor the keyboard belongs to |
| `close` | `() => void` | closes the custom keyboard and brings back the system keyboard |
| `keyboardHeight` | `number` | the height the keyboard is drawn at |

The props type is exported as `CustomKeyboardComponentProps`. Components written for 0.7.x that take no props keep working.

#### options.height

`number`  
<u>optional</u><br />
A fixed height in dp for this keyboard, instead of following the system keyboard's height.

The constructor still registers the component with `AppRegistry` under `id`, as in 0.7.x. tentap no longer uses that registration.

## ColorKeyboard

A ready-made `CustomKeyboardExtension` (id `keyboard.color`) with text color and highlight buttons. Picking a color applies it and focuses the editor, which returns to the system keyboard. Colors and styles come from the [`colorKeyboard` theme](../examples/customTheme.md#color-keyboard-theme). See the [ColorKeyboard example](../examples/colorKeyboard.md).

## useCustomKeyboard

```ts
const { activeKeyboardID, open, close, dismiss } = useCustomKeyboard(); // or useCustomKeyboard(editor)
```

A hook to control the custom keyboard from your own components, such as a toolbar button or the keyboard itself. It can be called anywhere, not only inside `CustomKeyboard`. It controls:

1. the `CustomKeyboard` of `editor`, when you pass one;
2. otherwise, the `CustomKeyboard` rendering the component that calls it (inside a keyboard component);
3. otherwise, the most recently mounted `CustomKeyboard`.

When there is no matching `CustomKeyboard`, `activeKeyboardID` is `undefined` and the functions do nothing.

`open` and `close` go through the same transitions as changing `activeKeyboardID`, and `setActiveKeyboardID` is called so your state follows.

| field | type | description |
| --- | --- | --- |
| `activeKeyboardID` | `string \| undefined` | the open custom keyboard |
| `open` | `(id: string) => void` | opens a custom keyboard. Switching from one custom keyboard to another just swaps the content. |
| `close` | `(toSystem?: boolean) => void` | closes the custom keyboard. With `toSystem` (default `true`) the system keyboard comes back; with `false` both are dismissed. |
| `dismiss` | `() => void` | same as `close(false)` |

## useCustomKeyboardHeight

```ts
const height = useCustomKeyboardHeight(); // or useCustomKeyboardHeight(editor)
```

The height of the open custom keyboard, or `0`. Use it with `layout="overlay"` to add space under your toolbar or content, for example when another library already handles the system keyboard. It reads the `CustomKeyboard` of `editor`, or the most recently mounted one.

## EditorKeyboardAvoidingView

A view that adds bottom padding equal to the part of it whichever keyboard covers, system or custom, so the toolbar at its bottom sits fully on top of the keyboard. It measures where it ends in the window and compares that with the top of the keyboard (`useKeyboard().keyboardTop`), so it needs no `keyboardVerticalOffset` below a navigation header or above a tab bar, it covers the navigation bar an edge-to-edge Android keyboard reaches over (also without the native module, as in Expo Go), and it adds nothing where the window already resized for the keyboard (Android `adjustResize` without edge-to-edge). Unlike React Native's `KeyboardAvoidingView` it keeps the same padding while switching between the two keyboards, so the toolbar doesn't move. An inline `CustomKeyboard` inside it takes its own space, so the padding leaves that out.

Place it around the editor and the toolbar (for example inside a `SafeAreaView` with `edges={['top']}`), and put the `Toolbar` in a row so its default `flex: 1` doesn't share the column with the editor:

```tsx
<SafeAreaView style={{ flex: 1 }} edges={['top']}>
  <EditorKeyboardAvoidingView style={{ flex: 1 }}>
    <View style={{ flex: 1 }}>
      <RichText editor={editor} />
    </View>
    <View style={{ flexDirection: 'row' }}>
      <Toolbar editor={editor} />
    </View>
  </EditorKeyboardAvoidingView>
  <CustomKeyboard layout="overlay" {...keyboardProps} />
</SafeAreaView>
```

Props: all `View` props, plus

| prop | type | default | description |
| --- | --- | --- | --- |
| `keyboardVerticalOffset` | `number` | `0` | distance in dp between the bottom of this view and the bottom of the window, subtracted from the padding until the view was measured. Not needed otherwise |
| `enabled` | `boolean` | `true` | `false` removes the padding |

## useKeyboardAccessory

Marks a view that is drawn on top of the keyboard, such as your own toolbar, so that `RichText` keeps the line being typed about one line above it. The library's `Toolbar` does this itself. Pass `false` while the view is hidden.

```tsx
const MyToolbar = ({ editor }: { editor: EditorBridge }) => {
  const { isKeyboardUp } = useKeyboard();
  const accessory = useKeyboardAccessory(isKeyboardUp);
  return <View onLayout={accessory.onLayout}>{/* buttons */}</View>;
};
```

Views that start above the editor (a static toolbar at the top of the screen) are ignored. A toolbar that is not marked still gets the default toolbar height of room when the editor reaches behind the keyboard, but marking it keeps the margin exact.

## useScrollToCaret

A `dynamicHeight` editor is as tall as its content and does not scroll itself, so inside a `ScrollView` the line being typed can grow under the keyboard. `useScrollToCaret` scrolls the `ScrollView` to keep the caret about one line clear of the keyboard, the toolbar on it and the `ScrollView`'s edges:

```tsx
const EditorInScrollView = () => {
  const editor = useEditorBridge({ dynamicHeight: true });
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollToCaret(editor, scrollViewRef);

  return (
    <EditorKeyboardAvoidingView style={{ flex: 1 }}>
      <ScrollView ref={scrollViewRef} keyboardShouldPersistTaps="handled">
        <RichText editor={editor} />
      </ScrollView>
    </EditorKeyboardAvoidingView>
  );
};
```

It needs the web bundle of this version (custom bundles built before 1.1 do not report the caret).

## useKeyboard

```ts
const {
  isKeyboardUp,
  keyboardHeight,
  isCustomKeyboardOpen,
  activeCustomKeyboardID,
  systemKeyboardHeight,
  lastKeyboardHeight,
} = useKeyboard();
```

| field | description |
| --- | --- |
| `isKeyboardUp` | `true` while the system keyboard or a custom keyboard is up |
| `keyboardHeight` | height of whichever keyboard is up. It doesn't drop to `0` while switching between the system and a custom keyboard. |
| `isCustomKeyboardOpen` | `true` while a custom keyboard is open |
| `activeCustomKeyboardID` | id of the open custom keyboard |
| `systemKeyboardHeight` | height of the system keyboard, `0` while it is hidden |
| `lastKeyboardHeight` | the last usable system keyboard height, kept after it hides; `0` before the first one |
| `windowOverlaysKeyboard` | `true` when the keyboard covers the window instead of resizing it: iOS, Android edge-to-edge or `'stable'` mode |
| `keyboardCoverHeight` | how far up from the bottom of the window the keyboard reaches: its height plus, on edge-to-edge Android, the navigation bar it also covers. `0` when no keyboard covers the window, including a system keyboard the window resizes for |
| `inlineKeyboardHeight` | height of the slot an open inline `CustomKeyboard` takes in the layout, `0` for an overlay keyboard or none |
| `keyboardTop` | top of whichever keyboard is up in window coordinates (the space of `measureInWindow`), or `null`. A view whose bottom is `viewBottom` in the window is covered by `Math.max(0, viewBottom - keyboardTop)`. A custom keyboard takes the place of the system keyboard |

Its type is exported as `KeyboardState`.

`isKeyboardUp` and `keyboardHeight` behave as in 1.0 when no custom keyboard is used. Heights are in dp.

## TenTapView

**Deprecated.** The native view used by the 0.7.x keyboard. It now renders nothing and logs a warning in development; remove it from your code.

## Closing

The custom keyboard closes, and `setActiveKeyboardID(undefined)` is called, when:

- the user taps the editor (unless `closeOnEditorPress={false}`): the system keyboard comes back
- you call `editor.focus()`: the system keyboard comes back
- `activeKeyboardID` is set to `undefined`, or `close()` from `useCustomKeyboard` is called
- the editor loses focus, or another input opens the system keyboard
- the Android back button is pressed: both keyboards are dismissed
- the editor's WebView reloads

When `CustomKeyboard` unmounts, the system keyboard suppression is undone, but `setActiveKeyboardID` is not called.

## Types

`CustomKeyboardProps`, `CustomKeyboardComponentProps`, `CustomKeyboardExtensionOptions`, `AnyCustomKeyboardExtension`, `CustomKeyboardControls` (the return type of `useCustomKeyboard`), `EditorKeyboardAvoidingViewProps`, `AndroidKeyboardMode`, `KeyboardErrorEvent`, `KeyboardPhase`, `KeyboardDriverKind`, `KeyboardState` and `TenTapViewProps` are exported from `@10play/tentap-editor`.

## Limitations

- **Android `Modal`:** an editor inside a React Native `Modal` uses the fallback driver, because the modal is a separate window.
- **Fallback driver on iOS:** while a custom keyboard is open, the globe key on a hardware keyboard doesn't work.
- **Fallback driver on Android:** on Android System WebView older than 66, tapping the editor brings back the system keyboard, which closes the custom keyboard.
- **Web:** the custom keyboard renders inline under the toolbar; the browser's keyboard isn't hidden.
- **Floating, split and Stage Manager keyboards** on iPad are not mirrored: the custom keyboard uses the docked keyboard height.
