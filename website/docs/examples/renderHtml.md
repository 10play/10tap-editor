---
sidebar_position: 7
---

# Rendering editor HTML

`getHTML()` and [useEditorContent](../api/useEditorContent.md) return the HTML that TipTap produces. When you display it outside the editor, for example in a read-only list with `react-native-render-html`, a few details of that HTML matter.

## Paragraphs inside list items

In TipTap and ProseMirror a list item always contains a paragraph, so lists come out as:

```html
<ul>
  <li><p>First</p></li>
  <li><p>Second</p></li>
</ul>
```

Web editors hide the paragraph margins with CSS. `react-native-render-html` gives every `<p>` its default vertical margins and doesn't support selectors like `li > p`, so each list item gets extra space. The editor's output can't change without breaking saved content and nested lists, so remove the margins when rendering. A custom `p` renderer can drop them only inside list items:

```tsx
import RenderHtml, { type CustomBlockRenderer } from 'react-native-render-html';

const ParagraphRenderer: CustomBlockRenderer = ({
  TDefaultRenderer,
  tnode,
  style,
  ...props
}) => (
  <TDefaultRenderer
    tnode={tnode}
    {...props}
    style={[
      style,
      tnode.parent?.tagName === 'li' && { marginTop: 0, marginBottom: 0 },
    ]}
  />
);

const renderers = { p: ParagraphRenderer };

<RenderHtml contentWidth={width} source={{ html }} renderers={renderers} />;
```

If you don't need paragraph spacing anywhere, `tagsStyles={{ p: { marginTop: 0, marginBottom: 0 } }}` is enough.

## Task lists

Task lists are `<ul data-type="taskList">` with `<li data-checked="true">` items that contain a `<label>` with a checkbox and a `<div>` with the content. Style or replace them the same way if you render them outside the editor.

## Images

The editor may add a hidden `<img class="ProseMirror-separator">` after an inline node at the end of a line. It is only part of the editor's DOM, not of `getHTML()`, but if you style images with CSS inside the editor, scope the rules as `img:not(.ProseMirror-separator)`.
