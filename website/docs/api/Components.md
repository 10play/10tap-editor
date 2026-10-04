---
sidebar_position: 4
---

# Components

## RichText

a components that wraps the webview that renders the editor

props:

| name                          | type           | default | description                                                                                                                                                  |
| ----------------------------- | -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| editor                        | `EditorBridge` |         | The bridge instance that created with [useEditorBridge](./EditorBridge.md)                                                                                      |
| exclusivelyUseCustomOnMessage | `boolean`      | true    | When true, if you pass an `onMessage` prop (webview) this will override tentap's own `onMessage` property. You probably want to disable this, it's here for compatibility. |

`editor` must be the object returned by `useEditorBridge`. A copy such as `{ ...editor }` is not connected to the WebView, so `RichText` throws an error for it.

you can also override any of the regular [WebView props](https://github.com/react-native-webview/react-native-webview/blob/HEAD/docs/Reference.md) <i>although this is not recommended</i>

### Passing your own onMessage

With the default `exclusivelyUseCustomOnMessage={true}`, passing `onMessage` turns off tentap's own message handling: the editor state, `dynamicHeight` and `onChange` stop updating. Pass `exclusivelyUseCustomOnMessage={false}` to receive every message while tentap keeps working:

```tsx
<RichText
  editor={editor}
  exclusivelyUseCustomOnMessage={false}
  onMessage={(event) => {
    const message = JSON.parse(event.nativeEvent.data);
    if (message.type === 'document-height') {
      console.log('content height', message.payload);
    }
  }}
/>
```

A warning is logged in development when `onMessage` is passed without `exclusivelyUseCustomOnMessage`. Messages may carry extra fields (such as `editorId`) besides `type` and `payload`; ignore the ones you don't use.

### Styles

- `style` replaces the editor's own WebView styles (including `theme.webview`), as in 1.0.
- `containerStyle` replaces `theme.webviewContainer`, as in 1.0.
- Set [mergeStyles](./useEditorBridge.md#mergestyles) to merge both on top of the defaults instead.
- With `dynamicHeight`, the content height is always applied last, so a `flex: 1` or `height` in your styles doesn't override it. A `maxHeight` is respected.

### Editor swaps and reloads

Rendering a different `editor` in the same `RichText` mounts a new WebView for it. If the WebView's content process is killed by the system, `RichText` reloads it and restores the editor: queued commands, the last content set with `setContent` (or the last value read by [useEditorContent](./useEditorContent.md)), injected CSS and settings such as `setEditable` and `setPlaceholder` are re-sent, and pending `getHTML`-style requests are retried. Edits made since that content was last read can be lost in this case.

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
| editor | `EditorBridge`  |                       | The bridge instance that created with [useEditorBridge](./EditorBridge.md) |
| hidden | `boolean`       |                       | a prop to control if toolbar shown. When not set, the toolbar is shown while the editor is focused and a keyboard (system or [custom](./CustomKeyboardUtils.md)) is up. |
| items  | `ToolbarItem[]` | DEFAULT_TOOLBAR_ITEMS | array of ToolbarItem's that will be shown on the toolbar                |
| headingItems | `ToolbarItem[]` | HEADING_ITEMS | array of ToolbarItem's shown in the heading context (after pressing `Aa`) |
| shouldHideDisabledToolbarItems  | `boolean` | false | Indicates whether disabled items should be hidden. Applies to both `items` and `headingItems`. |
| ListComponent | `ComponentType<FlatListProps<ToolbarItem>>` | `FlatList` | The list that renders the main and heading toolbars, for example a `FlatList` from a bottom-sheet library. Not used on web. |

Each toolbar context (main, link, heading) renders its own list, so the heading toolbar always opens scrolled to the start.

### Customizing the heading toolbar

`HEADING_ITEMS` and `ToolbarContext` are exported, so you can build on the defaults. The first item of `HEADING_ITEMS` is the close button that goes back to the main toolbar:

```tsx
import { Toolbar, HEADING_ITEMS } from '@10play/tentap-editor';

<Toolbar editor={editor} headingItems={HEADING_ITEMS.slice(0, 4)} />; // close + H1-H3
```

If you write your own list, include an item that calls `setToolbarContext(ToolbarContext.Main)` so users can get back to the main toolbar.

### Link bar

Pressing the link item opens the link bar. The link is inserted with the **Insert** button or the keyboard's **Done** key, and the link bar stays open when the input loses focus. The input's placeholder (default `Type your URL here...`) is set with the `toolbar.linkBarTheme.hintText` key of the [theme](../examples/customTheme.md#link-bar).

:::tip
If the editor or the toolbar is inside a `ScrollView`, `FlatList` or `KeyboardAwareScrollView`, set `keyboardShouldPersistTaps="handled"` on it. Otherwise the first tap on a toolbar button only dismisses the keyboard.
:::

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
  setToolbarContext: (
    context: ToolbarContext | ((prev: ToolbarContext) => ToolbarContext)
  ) => void;
  toolbarContext: ToolbarContext;
};
```

See how we add a custom toolbar item in the [color keyboard example](../examples/colorKeyboard.md)

## Custom keyboard components

`CustomKeyboard`, `ColorKeyboard` and `EditorKeyboardAvoidingView` are documented in [Custom Keyboard Utils](./CustomKeyboardUtils.md).
