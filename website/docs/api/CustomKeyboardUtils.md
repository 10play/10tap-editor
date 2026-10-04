---
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

A react component that renders the active custom keyboard. Render it under your toolbar, inside the same bottom `KeyboardAvoidingView` (see [layout](#layout)).

#### keyboards

`CustomKeyboardExtension[]`  
list of [CustomKeyboardExtension's](#customkeyboardextension)

#### activeKeyboardID

`string | undefined`  
the id of the custom keyboard to show. `undefined` shows the system keyboard.

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

#### onOpen / onClose

`(id: string) => void`  
Called when a custom keyboard finished opening or closing.

#### onKeyboardError

`(error: { reason: string }) => void`  
Called when the native driver couldn't hide the system keyboard (for example `reason: 'verify-timeout'`). `CustomKeyboard` then switches to the fallback driver for the rest of the session. A warning is also logged in development.

#### onKeyboardHideAndroid

`() => void`  
Kept from 0.7.x. Called when the system keyboard comes back after a custom keyboard closes, on both platforms.

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

Components written for 0.7.x that take no props keep working.

#### options.height

`number`  
<u>optional</u><br />
A fixed height for this keyboard, instead of following the system keyboard's height.

The constructor still registers the component with `AppRegistry` under `id`, as in 0.7.x. tentap no longer uses that registration.

## ColorKeyboard

A ready-made `CustomKeyboardExtension` (id `keyboard.color`) with text color and highlight buttons. Picking a color applies it and returns to the system keyboard. Colors and styles come from the [`colorKeyboard` theme](../examples/customTheme.md#color-keyboard-theme). See the [ColorKeyboard example](../examples/colorKeyboard.md).

## useCustomKeyboard

```ts
const { activeKeyboardID, open, close, dismiss } = useCustomKeyboard();
```

A hook to control the custom keyboard from your own components, such as a toolbar button or the keyboard itself.

| field | type | description |
| --- | --- | --- |
| `activeKeyboardID` | `string \| undefined` | the open custom keyboard |
| `open` | `(id: string) => void` | opens a custom keyboard. Switching from one custom keyboard to another just swaps the content. |
| `close` | `(toSystem?: boolean) => void` | closes the custom keyboard. With `toSystem` (default `true`) the system keyboard comes back; with `false` both are dismissed. |
| `dismiss` | `() => void` | same as `close(false)` |

## useCustomKeyboardHeight

```ts
const height = useCustomKeyboardHeight();
```

The height of the open custom keyboard, or `0`. Use it with `layout="overlay"` to add space under your toolbar or content. The same value is available through `CustomKeyboardHeightContext`.

## EditorKeyboardAvoidingView

A view that adds bottom padding equal to the height of whichever keyboard is up, system or custom. Unlike React Native's `KeyboardAvoidingView` it keeps the same padding while switching between the two, so the toolbar doesn't move. Accepts all `View` props.

```tsx
<EditorKeyboardAvoidingView style={{ position: 'absolute', width: '100%', bottom: 0 }}>
  <Toolbar editor={editor} />
  <CustomKeyboard layout="overlay" {...keyboardProps} />
</EditorKeyboardAvoidingView>
```

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
| `lastKeyboardHeight` | the last non-zero system keyboard height |

`isKeyboardUp` and `keyboardHeight` behave as in 1.0 when no custom keyboard is used.

## TenTapView

**Deprecated.** The native view used by the 0.7.x keyboard. It now renders nothing and logs a warning in development; remove it from your code.

## Closing

The custom keyboard closes, and `setActiveKeyboardID(undefined)` is called, when:

- the user taps the editor (unless `closeOnEditorPress={false}`): the system keyboard comes back
- you call `editor.focus()`: the system keyboard comes back
- `activeKeyboardID` is set to `undefined`, or `close()` from `useCustomKeyboard` is called
- the editor loses focus, or another input opens the system keyboard
- the Android back button is pressed: both keyboards are dismissed
- the editor's WebView reloads, or `CustomKeyboard` unmounts

## Limitations

- **Android `Modal`:** an editor inside a React Native `Modal` uses the fallback driver, because the modal is a separate window.
- **Fallback driver on iOS:** while a custom keyboard is open, the globe key on a hardware keyboard doesn't work.
- **Fallback driver on Android:** on Android System WebView older than 66, tapping the editor brings back the system keyboard, which closes the custom keyboard.
- **Web:** the custom keyboard renders inline under the toolbar; the browser's keyboard isn't hidden.
- **Floating, split and Stage Manager keyboards** on iPad are not mirrored: the custom keyboard uses the docked keyboard height.
