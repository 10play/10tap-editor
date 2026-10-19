---
description: Reference for the useEditorContent hook, which reads the content efficiently as HTML, JSON or text.
sidebar_position: 7
---

# useEditorContent

The useEditorContent hook is designed to efficiently retrieve the content. It monitors changes to the editor's content, and reduces unnecessary data exchanges between web and native, optimizing performance and minimizing message traffic.

#### editor

`EditorBridge` (<u>required</u>)

### options

#### type

`EditorContentType`  
<u>default</u>: `'html'`<br />
The type of content to return, `html` and `text` return strings, `json` returns an object.

#### debounceInterval

`number`  
<u>default</u>: `10`<br />

### Usage

```tsx
const content = useEditorContent(editor, { type: 'html' });
useEffect(() => {
  // Will render each time content is updated and call onSave
  content && onSave(content);
}, [content]);
```

Internally `useEditorContent` will get the content by calling `editor.getHTML` (or text/json depending on the `type` option). To reduce
traffic it is called within a `debounce` with a default interval of `10`ms. This can be modified changing the `debounceInterval` option.

The content is fetched once when the editor is ready and then again only when the content changes, not when the selection moves. If responses arrive out of order, an older one never overwrites a newer one, and nothing is fetched after the component unmounts.

In addition we can also get the content as text or as a json.

If you display the HTML outside the editor, for example with `react-native-render-html`, see [Rendering editor HTML](../examples/renderHtml.md).
