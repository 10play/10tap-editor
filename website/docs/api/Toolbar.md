---
sidebar_position: 8
---

# Toolbar

A React component of a basic Toolbar that includes these features:

- Add link context <img title="a title" alt="Alt text" src="/10tap-editor/img/addlink.png" />
- Change heading context <img title="a title" alt="Alt text" src="/10tap-editor/img/heading.png" />

- A variety of pre-made toolbar items:
  - link
  - quote
  - code
  - bold
  - italic
  - checkList
  - underline
  - strikethrough
  - h1, h2, h3, h4, h5, h6 (Headings)
  - orderedList
  - bulletList
  - sync
  - lift
  - undo
  - redo

### Props:

| Name                   | Type                                   | Default               | Description                                                                       |
| ---------------------- | -------------------------------------- | --------------------- | --------------------------------------------------------------------------------- |
| editor                 | `EditorBridge`                         |                       | The bridge instance created with [useEditorBridge](./EditorBridge).               |
| hidden                 | `boolean`                              |                       | A prop to control whether the toolbar is shown.                                   |
| items                  | `ToolbarItem[]`                        | DEFAULT_TOOLBAR_ITEMS | Array of `ToolbarItem`s that will be shown on the toolbar.                        |
| sections               | `ToolbarSection[]`                     | TOOLBAR_SECTIONS      | A set of sections organizing the toolbar items into groups.                       |
| contexts               | `Record<string, ToolbarContextConfig>` | {}                    | Context configurations to define custom behaviors for different toolbar contexts. |
| showStickyKeyboard     | `boolean`                              | `false`               | Whether to show the sticky keyboard toggle button on the toolbar.                 |
| stickyKeyboardPosition | `string`                               | `right`               | Position of the sticky keyboard button (`left` or `right`).                       |
| showWatermark          | `boolean`                              | `true`                | Whether to show the watermark button in the toolbar.                              |

See how we add a custom toolbar item in the [color keyboard example](../examples/colorKeyboard.md).

### ToolbarItem

The item rendered by the toolbar component.

```ts
export interface ToolbarItem {
  onPress: ({ editor, editorState }: ArgsToolbarCB) => () => void;
  active: ({ editor, editorState }: ArgsToolbarCB) => boolean;
  disabled: ({ editor, editorState }: ArgsToolbarCB) => boolean;
  image: ({ editor, editorState }: ArgsToolbarCB) => any;
}

type ArgsToolbarCB = {
  editor: EditorBridge;
  editorState: BridgeState;
};
```

## Watermark

<div style={{
  backgroundColor: '#fff0f3',
  border: '2px solid var(--ifm-color-primary)',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '20px',
  color: '#720529'
}}>
  <div style={{fontWeight: 'bold', marginBottom: '10px', color: 'var(--ifm-color-primary)'}}>
    ℹ️ About the 10tap-editor Watermark
  </div>

The 10tap-editor includes a watermark by default. Here's what you need to know:

- **For Commercial Use**: If you're using 10tap-editor in a commercial project or making money from it, we rely on your support to keep 10tap-editor developed and maintained. Before removing the watermark <a href="https://10play.dev/#10tap-pricing" style={{color: 'var(--ifm-color-primary-dark)'}}>consider ways to support 10tap-editor</a>.

- **For Personal Projects**: Feel free to remove the watermark! We appreciate your support through:

  - Reporting bugs
  - Sharing screenshots of your projects
  - Starring us on <a href="https://github.com/10play/10tap-editor" style={{color: 'var(--ifm-color-primary)'}}>GitHub</a>

Thank you for being part of the 10tap-editor community! 🚀

-The 10tap Team

</div>

To remove the watermark, use the `showWatermark` prop on the `Toolbar` component:

```jsx
<Toolbar editor={editor} showWatermark={false} />
```

### Usage

```tsx
<Toolbar editor={editor} showWatermark={false} />
```

### Props

| Name          | Type      | Default | Description                                        |
| ------------- | --------- | ------- | -------------------------------------------------- |
| showWatermark | `boolean` | `true`  | Controls whether the watermark is shown or hidden. |

## Sticky Keyboard

The **Sticky Keyboard** feature allows users to toggle the keyboard visibility within the editor's toolbar. You can control whether the sticky keyboard toggle is shown and adjust its position to either the right or left of the toolbar.

### Usage

To enable the sticky keyboard toggle, you can pass the `showStickyKeyboard` prop to the `Toolbar` component. By default, the sticky keyboard toggle will be positioned on the right side of the toolbar, but you can change its position using the `stickyKeyboardPosition` prop.

### Example (Right Side)

```tsx
<Toolbar
  editor={editor}
  showStickyKeyboard={true}
  stickyKeyboardPosition="right"
/>
```

<!-- TODO: add picture -->

### Props

| Name                   | Type      | Default | Description                                                                 |
| ---------------------- | --------- | ------- | --------------------------------------------------------------------------- |
| showStickyKeyboard     | `boolean` | `false` | Controls whether the sticky keyboard toggle button is shown in the toolbar. |
| stickyKeyboardPosition | `string`  | `right` | Position of the sticky keyboard button (`left` or `right`).                 |
