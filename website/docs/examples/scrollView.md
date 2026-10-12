---
sidebar_position: 6
---

# Editor inside a ScrollView

By default the editor fills its container and scrolls its own content. To place it in a form or a screen that scrolls as a whole, let the editor grow with its content and let your `ScrollView` do the scrolling. See [`example-expo/src/screens/DynamicHeight.tsx`](https://github.com/10play/10tap-editor/tree/main/example-expo/src/screens/DynamicHeight.tsx) for a runnable version.

## Dynamic height

With [dynamicHeight](../api/useEditorBridge.md#dynamicheight) the WebView is always as tall as its content. It grows as you type and shrinks when you delete, in a `ScrollView` or in a plain `View`.

```tsx
export const EditorInForm = () => {
  const editor = useEditorBridge({
    dynamicHeight: true,
    initialContent: '<p>Tell us about yourself</p>',
  });
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollToCaret(editor, scrollViewRef);

  return (
    <EditorKeyboardAvoidingView style={{ flex: 1 }}>
      <ScrollView ref={scrollViewRef} keyboardShouldPersistTaps="handled">
        <TextInput placeholder="Title" />
        <RichText editor={editor} />
        <Button title="Save" onPress={save} />
      </ScrollView>
    </EditorKeyboardAvoidingView>
  );
};
```

- Leave `avoidIosKeyboard` off. In dynamic height mode the editor doesn't add keyboard padding, and the parent scroll view doesn't know where the cursor is: the editor is a WebView, not a native text input. Scroll views that follow the focused input, such as `KeyboardAwareScrollView` from `react-native-keyboard-controller`, track native text inputs, so they don't scroll to the cursor inside the editor either.
- [useScrollToCaret](../api/CustomKeyboardUtils.md#usescrolltocaret) does that instead: it scrolls your `ScrollView` so the line being typed stays about one line above the keyboard and the toolbar on it. Without it the cursor of a growing editor ends up under the keyboard.
- `EditorKeyboardAvoidingView` shrinks the scroll view above the keyboard, also on edge-to-edge Android, where the window does not resize. A `KeyboardAvoidingView` with `behavior="padding"` works too.
- Alternatively, [cap the editor's height](#capping-the-height) so that it fits above the keyboard. Once it reaches the cap the editor scrolls itself and keeps the cursor in view.
- `RichText` already passes `scrollEnabled={false}` to the WebView, so only your scroll view scrolls.
- Set `keyboardShouldPersistTaps="handled"` on the scroll view, so taps on the toolbar and the link bar reach their buttons while the keyboard is open.

:::note react-native-webview version
On the new architecture, react-native-webview before 13.13.3 ignores `scrollEnabled={false}`, and WebKit scrolls the WebView to the caret when the keyboard opens. Use 13.13.3 or newer and rebuild your native app. Expo Go ships its own react-native-webview, so test this in a dev build.
:::

## Capping the height

To let the editor grow up to a limit and then scroll internally, cap its container:

```tsx
const editor = useEditorBridge({ dynamicHeight: true });

<RichText editor={editor} containerStyle={{ maxHeight: 300 }} />;
```

Once the cap is reached, the editor keeps its scroll position and the cursor stays in view while you type.

## Reading the content height

The editor reports its content height in px as a `document-height` message. If you need it, for example to animate a container, listen to the messages without turning off tentap's own handling:

```tsx
<RichText
  editor={editor}
  exclusivelyUseCustomOnMessage={false}
  onMessage={(event) => {
    const message = JSON.parse(event.nativeEvent.data);
    if (message.type === 'document-height') setHeight(message.payload);
  }}
/>
```

On Expo web, each editor's `onMessage` only receives that editor's messages, so several editors with `dynamicHeight` can share a page; see [Expo Web Setup](../setup/expoWeb.md).
