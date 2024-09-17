---
sidebar_position: 7
---

# useEditorContent

The `useEditorContent` hook efficiently retrieves editor content, monitoring changes and optimizing performance by reducing unnecessary data exchanges between web and native.

## Parameters

| Parameter | Type           | Required | Description           |
| --------- | -------------- | -------- | --------------------- |
| editor    | `EditorBridge` | Yes      | The editor instance   |
| options   | `Object`       | No       | Configuration options |

### Options

| Option           | Type                | Default | Description                                             |
| ---------------- | ------------------- | ------- | ------------------------------------------------------- |
| type             | `EditorContentType` | -       | Content type to return: `'html'`, `'text'`, or `'json'` |
| debounceInterval | `number`            | `10`    | Debounce interval in milliseconds                       |

## Usage

```tsx
const content = useEditorContent(editor, { type: 'html' });

useEffect(() => {
  // Triggers each time content is updated
  content && onSave(content);
}, [content]);
```
