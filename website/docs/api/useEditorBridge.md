---
description: Reference for the useEditorBridge hook and all of its options.
sidebar_position: 1
---

# useEditorBridge

a react hook that will return [EditorBridge](./EditorBridge.md)

The returned `editor` keeps the same reference for the lifetime of the component, so it is safe to use in dependency arrays. Pass that object to [RichText](./Components.md#richtext). A spread copy such as `{ ...editor }` also works, but its option fields are a snapshot taken when it was made.

#### bridgeExtensions

`BridgeExtension[]`  
<u>default</u>: `TenTapStartKit`<br />
A list of BridgeExtensions that will be added to the editor on the native side. Extensions with the same name are deduplicated and the last one wins, so spread `TenTapStartKit` first and put your configured bridges after it.

Bridges are read when the editor is created. Adding a bridge to the list after mount has no effect (a warning is logged in development); remount the editor instead.

#### initialContent

`string | object`  
<u>default</u>: `undefined`<br />
initial content that will be loaded first on the editor. A string is parsed as HTML, an object as TipTap JSON.

#### parseOptions

`{ preserveWhitespace?: boolean | 'full'; from?: number; to?: number; topOpen?: boolean }`  
<u>default</u>: `undefined`<br />
The serializable subset of ProseMirror [parse options](https://prosemirror.net/docs/ref/#model.ParseOptions) used when HTML is parsed: for `initialContent`, for [insertContent](./EditorBridge.md#insertcontent) and for every [setContent](./EditorBridge.md#setcontent) call that doesn't pass its own. It is read when the editor loads.

By default ProseMirror collapses runs of whitespace in HTML to a single space. Use `preserveWhitespace: 'full'` to keep them:

```tsx
const editor = useEditorBridge({
  initialContent: "<a href='hello'>hello</a>  <a href='world'>world</a>",
  parseOptions: { preserveWhitespace: 'full' },
});
```

With `'full'`, newlines and indentation between tags in pretty-printed HTML also become content. If you round-trip content saved from the editor, storing it with `getJSON()` keeps whitespace exactly with no parse options.

:::note
`parseOptions` needs the 1.1 web editor. If you use a [custom editor bundle](../setup/advancedSetup.md), rebuild it after upgrading.
:::

#### autofocus

`boolean`  
<u>default</u>: `false`<br />
when true the editor focuses at the end of its content when it becomes ready. It runs once per load, so it also refocuses after the WebView reloads.

#### avoidIosKeyboard

`boolean`  
<u>default</u>: `false`<br />
This helps keep the cursor visible above the keyboard when the editor is full-screen and the virtual keyboard hides the bottom portion of the editor.

While the keyboard is up, `RichText` measures how far the keyboard and the views drawn on it (the [Toolbar](./Components.md#toolbar), or your own toolbar marked with [useKeyboardAccessory](./CustomKeyboardUtils.md#usekeyboardaccessory)) reach into the editor, and then:
- Adds that much bottom padding to the document, plus about one line
- Sets ProseMirror's scroll threshold and margin to the same value, so the line being typed stays about one line above the toolbar
- Scrolls the cursor back into view when the keyboard or toolbar moves over it
- Removes the padding when the keyboard is dismissed

This works the same for the system keyboard and an open custom keyboard, on iOS and Android, edge-to-edge or not, and wherever the editor ends: behind the keyboard, above a `KeyboardAvoidingView`, or inside one that already avoids the keyboard (where only the one-line margin is added). It is skipped when `dynamicHeight` is on, because the WebView is already only as tall as its content; see [useScrollToCaret](./CustomKeyboardUtils.md#usescrolltocaret) for an editor that grows inside a `ScrollView`.

The measured inset applies to every editor, so an editor covered by the keyboard keeps its cursor visible even without this option. An editor that ends above the keyboard still keeps the line being typed about one line above its own bottom edge. If the editor reaches behind the keyboard and no view on the keyboard is marked, `RichText` assumes a toolbar of your own sits there and keeps the default toolbar height clear too; mark your toolbar with `useKeyboardAccessory` to measure it exactly. Until the first measurement, an editor with `avoidIosKeyboard` falls back to the 1.0 behaviour: the keyboard height on iOS (and wherever the keyboard overlays the window), or a fixed toolbar height on Android.

#### avoidKeyboard

`boolean`  
<u>default</u>: `false`<br />
An alias of `avoidIosKeyboard` with a name that matches what it does. `avoidIosKeyboard` keeps working and wins when both are set.

#### scrollBottomOffset

`number`  
<u>default</u>: `0`<br />
Extra space in px kept between the cursor and the bottom of the editor, on top of what `RichText` measures for the keyboard and toolbar. It is added to the scroll threshold and to the bottom padding, so new lines scroll into view before they reach something drawn over the editor that `RichText` cannot measure:

```tsx
const editor = useEditorBridge({
  scrollBottomOffset: 60, // e.g. the height of your floating action bar
});
```

The `Toolbar`, and views marked with [useKeyboardAccessory](./CustomKeyboardUtils.md#usekeyboardaccessory), are already measured while the keyboard is up, so they need no offset.

Unlike calling [updateScrollThresholdAndMargin](./EditorBridge.md#updatescrollthresholdandmargin) yourself, this value is kept when the keyboard opens and closes.

With `dynamicHeight` the padding is part of the content height, so the editor is that much taller than its text. A capped dynamic-height editor needs it to scroll its last line above something drawn over it (#308). Without it, a capped dynamic-height editor keeps about one line between the caret and its own bottom edge when it scrolls.

#### dynamicHeight

`boolean`  
<u>default</u>: `false`<br />
when true the editor's webview keeps the same height as its content. It grows and shrinks with the content in any parent, not only inside a `ScrollView`.

- A height cap such as `maxHeight` on the container is respected. Once the cap is reached the editor scrolls internally and keeps its scroll position.
- Keyboard padding (`avoidIosKeyboard`) is not applied in this mode. When the editor grows inside a `ScrollView`, [useScrollToCaret](./CustomKeyboardUtils.md#usescrolltocaret) scrolls the `ScrollView` to keep the line being typed above the keyboard.
- It can change after mount and the document is kept. A custom editor bundle built with a version before 1.1 keeps the value it loaded with and only the container height changes, as in 1.0. Rebuild the bundle to switch it at runtime.
- The content height in px is also sent as a `document-height` message. To read it yourself, pass `onMessage` to [RichText](./Components.md#richtext) together with `exclusivelyUseCustomOnMessage={false}`.

To scroll a long document together with other content, put the editor inside your own `ScrollView`. See [Editor inside a ScrollView](../examples/scrollView.md).

#### disableColorHighlight

`boolean`  
<u>default</u>: `undefined`<br />
when true the selection highlight will be off and when false will be on, on android this will be off by default, please see:
https://github.com/10play/10tap-editor/issues/184#issuecomment-2304826219

#### theme

`EditorTheme`  
<u>default</u>: `defaultEditorTheme` <i>(light theme)</i><br />
this prop can be used to customize default styles, see [theme example](../examples/customTheme.md)

#### editable

`boolean`  
<u>default</u>: `true`<br />
When set to false the editor will be `readonly`. Changing it after mount calls `editor.setEditable`.

#### onChange

`() => void`  
A callback that is called each time the editor's content has changed. The content itself is not passed, so that every keystroke doesn't send the whole document from the WebView to React Native.

To keep the content in state, use [useEditorContent](./useEditorContent.md), which is debounced and handles this for you:

```tsx
const editor = useEditorBridge({ initialContent });
const content = useEditorContent(editor, { type: 'html' });

useEffect(() => {
  if (content !== undefined) save(content);
}, [content]);
```

If you prefer `onChange`, fetch the content inside it with `editor.getHTML`, `editor.getJSON` or `editor.getText`, ideally debounced. The latest `onChange` is always the one called, so it can close over fresh state. See [Working with content](../examples/workingWithContent.md).

#### mergeStyles

`boolean`  
<u>default</u>: `false`<br />
By default the `style` and `containerStyle` props of [RichText](./Components.md#richtext) replace the editor's own styles (the default WebView styles and `theme.webview`, and `theme.webviewContainer`), as in 1.0. When `true`, your styles are merged on top of them instead. With `dynamicHeight` the content height is applied in both cases.

#### rpcTimeoutMs

`number`  
<u>default</u>: `undefined` (no timeout)<br />
How long the async methods (`getHTML`, `getText`, `getJSON`, `getSelectedText`, and requests sent by custom bridges through `context.rpc`) wait for the WebView before rejecting with a `TentapRpcTimeoutError`. Without it they wait indefinitely, as in 1.0.

The time counts from the call, including any wait for the editor to load and time after the editor unmounted, so requests pending at unmount still reject. The option is read when the editor is created.

```tsx
import { TentapRpcTimeoutError } from '@10play/tentap-editor';

const editor = useEditorBridge({ rpcTimeoutMs: 5000 });

try {
  const html = await editor.getHTML();
} catch (e) {
  if (e instanceof TentapRpcTimeoutError) {
    // the WebView didn't answer in time
  }
}
```

#### customSource

`string`  
<u>default</u>: `SimpleEditorBundleString`<br />
used in advance setup, an HTML string that will replace the default simple editor

#### webviewBaseURL

`string`  
<u>default</u>: `undefined`<br />
The `baseUrl` of the WebView's HTML source. Relative URLs in your content and CSS (images, fonts) resolve against it. On iOS, point it at a `file://` directory to let the WebView read local files, for example [fonts loaded from a file](../examples/customCss.md#loading-fonts-from-a-file).

#### DEV

`boolean`  
<u>default</u>: `false`<br />
prop used in advance setup, when true the webview will load DEV_SERVER_URL instead of the html string

#### DEV_SERVER_URL

`string`  
<u>default</u>: `http://localhost:3000`<br />
prop used in advanced setup, a url string that points to the editor dev server
