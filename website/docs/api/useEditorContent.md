---
sidebar_position: 7
---

# useEditorContent

The useEditorContent hook is designed to efficiently retrieve the content. It monitors changes to the editor's content, and reduces unnecessary data exchanges between web and native, optimizing performance and minimizing message traffic.

#### editor

`EditorBridge` (<u>required</u>)

### options

#### type

`EditorContentType`
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

In addition we can also get the content as text or as a json.
