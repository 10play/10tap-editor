---
sidebar_position: 6
---

# Editor inside a ScrollView

By default the editor fills its container and scrolls its own content. To place it in a form or a screen that scrolls as a whole, let the editor grow with its content and let your `ScrollView` do the scrolling.

## Dynamic height

With [dynamicHeight](../api/useEditorBridge.md#dynamicheight) the WebView is always as tall as its content. It grows as you type and shrinks when you delete, in a `ScrollView` or in a plain `View`.

```tsx
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export const EditorInForm = () => {
  const editor = useEditorBridge({
    dynamicHeight: true,
    initialContent: '<p>Tell us about yourself</p>',
  });

  return (
    <KeyboardAwareScrollView keyboardShouldPersistTaps="handled">
      <TextInput placeholder="Title" />
      <RichText editor={editor} />
      <Button title="Save" onPress={save} />
    </KeyboardAwareScrollView>
  );
};
```

- Leave `avoidIosKeyboard` off. In dynamic height mode the editor doesn't add keyboard padding; let the scroll view keep the cursor above the keyboard, for example with `KeyboardAwareScrollView` from `react-native-keyboard-controller`.
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

On Expo web, multiple editors with `dynamicHeight` on one page need `@10play/react-native-web-webview` 0.0.4 or newer; see [Expo Web Setup](../setup/expoWeb.md).
