---
sidebar_position: 2
---

# AutoSave

In this example we will implement autosaving with the help of `useEditorContent`

## Autosaving HTML Content

All we need to do to implement auto save is add the `useEditorContent` hook

```tsx
const content = useEditorContent(editor, { type: 'html' });
useEffect(() => {
  // Will render each time content is updated and call onSave
  content && onSave(content);
}, [content]);
```

Internally `useEditorContent` get the content by calling `editor.getHTML` (or text/json depending on the `type` option). To reduce
traffic it is called within a `debounce` with a default interval of `10`ms. This can be modified changing the `debounceInterval` option.

In addition we can also get the content as text or as a json.
