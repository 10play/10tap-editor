---
sidebar_position: 3
---

# React components

## RichText

a react component that will render the webview editor, help to locate the editor wherever you wold like, inside a view that stick to your keyboard for example see [chat example](https://10play.dev)

props:

| name   | type           | default | description                                                             |
| ------ | -------------- | ------- | ----------------------------------------------------------------------- |
| editor | `EditorBridge` |         | The bridge instance that created with [useEditorBridge](./EditorBridge) |

## Toolbar

A react component of a basic Toolbar that include these features:

- Add link context <img title="a title" alt="Alt text" src="/10tap-editor/img/addlink.png" />
- Change headling context <img title="a title" alt="Alt text" src="/10tap-editor/img/heading.png" />

- A lot of pre made toolbar items:
  - link
  - quote
  - code
  - bold
  - italic
  - checkList
  - underline
  - strikethrough
  - h1
  - h2
  - h3
  - h4
  - h5
  - h6
  - orderedList
  - bulletList
  - sync
  - lift
  - undo
  - redo

props:

| name   | type            | default               | description                                                             |
| ------ | --------------- | --------------------- | ----------------------------------------------------------------------- |
| editor | `EditorBridge`  |                       | The bridge instance that created with [useEditorBridge](./EditorBridge) |
| hidden | `boolean`       |                       | a prop for control if toolbar shown                                     |
| items  | `ToolbarItem[]` | DEFAULT_TOOLBAR_ITEMS | array of ToolbarItem that will be shown on the toolbar                  |

### ToolbarItem

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
