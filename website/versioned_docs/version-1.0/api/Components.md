---
sidebar_position: 4
---

# Components

## RichText

a components that wraps the webview that renders the editor

props:

| name                          | type           | default | description                                                                                                                                                  |
| ----------------------------- | -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| editor                        | `EditorBridge` |         | The bridge instance that created with [useEditorBridge](./EditorBridge)                                                                                      |
| exclusivelyUseCustomOnMessage | `boolean`      | true    | When true, if you pass an `onMessage` prop (webview) this will override tentap's own `onMessage` property. You probably want to disable this, it's here for compatibility. |

you can also override any of the regular [WebView props](https://github.com/react-native-webview/react-native-webview/blob/HEAD/docs/Reference.md) <i>although this is not recommended</i>

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
| hidden | `boolean`       |                       | a prop to control if toolbar shown                                      |
| items  | `ToolbarItem[]` | DEFAULT_TOOLBAR_ITEMS | array of ToolbarItem's that will be shown on the toolbar                |
| shouldHideDisabledToolbarItems  | `boolean` | false | Indicates whether disabled items should be hidden |

### ToolbarItem

The item rendered by the toolbar component

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
