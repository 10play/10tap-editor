---
description: Reading, setting and inserting content, keeping it in state and reading the selected text.
sidebar_position: 2
---

# Working with content

This page shows how to read, set and insert content, and how to read the selected text.

## Keeping the content in state

`onChange` tells you that the content changed, without sending the content itself, because sending the whole document from the WebView on every keystroke is expensive. The easiest way to keep the content in state is [useEditorContent](../api/useEditorContent.md):

```tsx
const editor = useEditorBridge({ initialContent });
const content = useEditorContent(editor, { type: 'html' }); // or 'text' | 'json'

useEffect(() => {
  if (content !== undefined) saveDraft(content);
}, [content]);
```

If you prefer `onChange`, fetch the content yourself, ideally debounced:

```tsx
const saveLater = useMemo(
  () => debounce((html: string) => saveDraft(html), 500),
  []
);

const editor = useEditorBridge({
  onChange: async () => {
    saveLater(await editor.getHTML());
  },
});
```

`onChange` is called with the latest version of your callback, so it can use fresh state.

## Setting content

```tsx
editor.setContent('<p>New content</p>');
editor.setContent({ type: 'doc', content: [/* TipTap JSON */] });
```

`setContent` triggers `onChange` and `useEditorContent` like a user edit. Pass `{ emitUpdate: false }` to replace the content silently, for example when loading a saved draft:

```tsx
editor.setContent(savedHtml, { emitUpdate: false });
```

### Keeping whitespace

ProseMirror collapses runs of spaces in HTML. Pass `parseOptions` to keep them, for the whole editor or for one call:

```tsx
const editor = useEditorBridge({
  initialContent: "<a href='hello'>hello</a>  <a href='world'>world</a>",
  parseOptions: { preserveWhitespace: 'full' },
});

editor.setContent(html, { parseOptions: { preserveWhitespace: 'full' } });
```

With `'full'`, newlines and indentation between tags in pretty-printed HTML become content too. Content stored with `getJSON()` keeps its whitespace exactly without parse options.

## Inserting content

[insertContent](../api/EditorBridge.md#insertcontent) inserts HTML, text or TipTap JSON at the cursor, replacing the selection:

```tsx
<Button
  title="Insert signature"
  onPress={() => editor.insertContent('<p><em>Sent from my phone</em></p>')}
/>
```

The content must fit the editor's schema. Unknown tags are dropped or converted, like when pasting.

## Reading the selected text

[getSelectedText](../api/EditorBridge.md#getselectedtext) reads the selection from the live editor:

```tsx
const selected = await editor.getSelectedText();
```

`editorState.selection.from` and `.to` from [useBridgeState](../api/BridgeState.md#usebridgestate) are ProseMirror positions, not offsets into `getText()`. To read the text of a range you stored earlier, pass it to `getSelectedText`:

```tsx
const { selection } = editor.getEditorState();
// later
const text = await editor.getSelectedText(selection);
```

:::note Custom editor bundles
`parseOptions`, `insertContent` and `getSelectedText` need the 1.1 web editor. With the [advanced setup](../setup/advancedSetup.md), rebuild your editor bundle after upgrading. With an older bundle, `getSelectedText` rejects with `TentapUnsupportedError`.
:::
