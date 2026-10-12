---
sidebar_position: 3
---

# FAQ

### How do I get the content in `onChange`?

`onChange` only tells you that the content changed. It doesn't pass the content, because sending the whole document from the WebView on every keystroke is expensive. Use [useEditorContent](./api/useEditorContent.md), which fetches it for you (debounced, and only when the content changes):

```tsx
const editor = useEditorBridge({ initialContent });
const content = useEditorContent(editor, { type: 'html' }); // or 'text' | 'json'

useEffect(() => {
  if (content !== undefined) save(content);
}, [content]);
```

Or call `await editor.getHTML()` (or `getText` / `getJSON`) inside `onChange`, ideally debounced. See [Working with content](./examples/workingWithContent.md).

### Where is `toggleBold`? TypeScript says it doesn't exist on `EditorBridge`.

`toggleBold` and the other formatting commands are added to `EditorBridge` by their bridge extensions. `toggleBold` comes from `BoldBridge`, which is part of the default `TenTapStartKit`. If you pass your own `bridgeExtensions`, include the bridges whose commands you use. All the commands are listed on [EditorBridge](./api/EditorBridge.md#togglebold).

To build your own button, read the state with `useBridgeState`:

```tsx
const BoldButton = ({ editor }: { editor: EditorBridge }) => {
  const { isBoldActive, canToggleBold } = useBridgeState(editor);
  return (
    <Button
      title={isBoldActive ? 'Unbold' : 'Bold'}
      disabled={!canToggleBold}
      onPress={() => editor.toggleBold()}
    />
  );
};
```

1.0 reported `Property 'toggleBold' does not exist on type 'EditorBridge'` with deep imports from `@10play/tentap-editor/src/...` or with `moduleResolution: "node"`. 1.1 fixes this. Importing from `@10play/tentap-editor` is still recommended.

### Lists rendered with `react-native-render-html` have extra space

TipTap wraps the content of every list item in a paragraph (`<li><p>…</p></li>`). `react-native-render-html` gives each `<p>` its default margins. Remove them for paragraphs inside list items with a custom renderer; see [Rendering editor HTML](./examples/renderHtml.md).

### How do I put the editor inside a `ScrollView`?

Turn on `dynamicHeight` so the editor is as tall as its content, and call `useScrollToCaret` so your `ScrollView` keeps the caret above the keyboard:

```tsx
const Form = () => {
  const editor = useEditorBridge({ dynamicHeight: true });
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollToCaret(editor, scrollViewRef);

  return (
    <EditorKeyboardAvoidingView style={{ flex: 1 }}>
      <ScrollView ref={scrollViewRef} keyboardShouldPersistTaps="handled">
        <TextInput placeholder="Title" />
        <RichText editor={editor} />
      </ScrollView>
    </EditorKeyboardAvoidingView>
  );
};
```

See [Editor inside a ScrollView](./examples/scrollView.md), including how to cap the editor's height.

### Images inside a paragraph are moved out of it

Images are block nodes by default. Configure the `ImageBridge` to make them inline:

```tsx
const editor = useEditorBridge({
  bridgeExtensions: [
    ...TenTapStartKit,
    ImageBridge.configureExtension({ inline: true }),
  ],
});
```

See [Inline images](./examples/configureExtensions.md#inline-images).

### How do I use a custom font?

Load it with an `@font-face` rule in `CoreBridge.configureCSS`, either from a local file (recommended for large fonts) or embedded as base64. See [Adding custom fonts](./examples/customCss.md#adding-custom-fonts). For Chinese, Japanese and Korean text that doesn't turn bold or italic, see [CJK text](./examples/customCss.md#chinese-japanese-and-korean-text).

### The toolbar is hidden behind the keyboard, or floats above it

Use `EditorKeyboardAvoidingView` instead of React Native's `KeyboardAvoidingView`. It measures how far the keyboard reaches into it, so it needs no `keyboardVerticalOffset` and also works below a header, above a tab bar and on edge-to-edge Android. See [Keyboard and caret](./setup/keyboard.md).

### The line I'm typing goes under the toolbar

`RichText` measures the keyboard and the library's `Toolbar` and keeps the caret above them. Mark your own toolbar with [useKeyboardAccessory](./api/CustomKeyboardUtils.md#usekeyboardaccessory). For other views over the editor, set [scrollBottomOffset](./api/useEditorBridge.md#scrollbottomoffset).

### Do I have to wait for `isReady` before calling editor methods?

No. Commands called before the editor has loaded are queued and sent in order once it is ready. `getHTML` and the other async methods wait for the editor too; set [rpcTimeoutMs](./api/useEditorBridge.md#rpctimeoutms) if they should give up.

### Spaces in my HTML disappear

ProseMirror collapses runs of whitespace in HTML. Pass `parseOptions: { preserveWhitespace: 'full' }` to `useEditorBridge` or to `setContent`. See [Keeping whitespace](./examples/workingWithContent.md#keeping-whitespace).

### Do custom keyboards work in Expo Go?

Yes, with a JavaScript fallback driver. A development build uses the native driver. See [Expo Go and the fallback driver](./examples/customKeyboard.md#expo-go-and-the-fallback-driver).

### How do I show the content read-only?

Pass `editable: false` to `useEditorBridge`. Changing it later calls `editor.setEditable`. To show saved HTML outside an editor, see [Rendering editor HTML](./examples/renderHtml.md).
