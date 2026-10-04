---
sidebar_position: 2
---

# EditorBridge

An Interface of all the commands you can do with the editor on the react native side, can be extended with a [BridgeExtension](./BridgeExtensions.md). With all of the bridges included in `TenTapStartKit` the EditorBridge will have the methods below.

A method only exists when its bridge is in `bridgeExtensions`. For example, `toggleBold` is added by `BoldBridge`; if you pass your own `bridgeExtensions` array without it, `toggleBold` is missing from both the object and its type.

Commands can be called right away, even before the editor has loaded. They are queued and sent in order once the editor is ready.

#### focus

`(pos?: 'start' | 'end' | 'all' | number | boolean | null) => void`<br />
a function that will focus the editor and open the keyboard. If a [custom keyboard](./CustomKeyboardUtils.md) is open, it closes and the system keyboard comes back. <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### blur

a function that will blur the editor and close the keyboard <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### webviewRef

`RefObject<WebView>`<br />
a ref for the webview that renders the editor <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### getEditorState

`() => BridgeState`<br />
a function that will return the most up to date BridgeState <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### getHTML

`() => Promise<string>`<br />
an async function that will return the content of the editor in html format. List items are always wrapped in a paragraph (`<li><p>…</p></li>`); see [Rendering editor HTML](../examples/renderHtml.md) if you display the HTML outside the editor. <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### getText

`() => Promise<string>`<br />
an async function that will return the content of the editor in text format <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### getJSON

`() => Promise<object>`<br />
an async function that will return the content of the editor in json format <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### getSelectedText

`(range?: { from: number; to: number }) => Promise<string>`<br />
an async function that returns the text of the current selection, read from the live editor inside the WebView. Pass a `range` to read another part of the document instead. Blocks are separated by `\n`, matching what the system "Copy" gives you.

```ts
const selected = await editor.getSelectedText();
const text = await editor.getSelectedText({ from: 1, to: 20 });
```

`from` and `to` are ProseMirror positions, the same numbers as [`BridgeState.selection`](./BridgeState.md#selection), not character offsets into `getText()`. Out of range values are clamped to the document.

Rejects with `TentapUnsupportedError` when the editor runs a custom bundle built with an older version; rebuild the bundle to use it. <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### setContent

`(content: Content, options?: { parseOptions?: ParseOptions; emitUpdate?: boolean }) => void`<br />
a function that gets html as string or document object and sets it as the editor's content.

- `parseOptions` overrides the editor-level [parseOptions](./useEditorBridge.md#parseoptions) for this call, e.g. `{ preserveWhitespace: 'full' }`.
- `emitUpdate` (default `true`) controls whether the change triggers `onChange` and [useEditorContent](./useEditorContent.md).

<br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### insertContent

`(content: Content) => void`<br />
inserts HTML, plain text or TipTap JSON at the cursor, replacing the current selection if there is one, and focuses the editor. HTML is parsed with the editor's [parseOptions](./useEditorBridge.md#parseoptions). It works with the default editor, no custom bundle needed.

```ts
editor.insertContent('<strong>Hello</strong> world');
editor.insertContent('just some text');
```

The content still has to fit the editor's schema: a custom node type needs a bridge extension that defines it ([advanced setup](../setup/advancedSetup.md)). A custom bundle built with an older version ignores the command; rebuild the bundle to use it. <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### setEditable

`(editable: boolean) => void`<br />
a function that sets the editable state <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### setSelection

`(from: number, to: number) => void`<br />
sets the selection of the editor <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### injectCSS

`(css: string, tag?: string) => void`<br />
creates or updates the stylesheet with the given tag, see [Dynamically Updating CSS](../examples/customCss.md#dynamically-updating-css). The stylesheet is re-applied if the WebView reloads. For CSS that has to be there from the first paint, such as fonts, use `configureCSS` on a bridge instead. <br /> <u>default</u> `tag`: `custom-css`<br /> available on every editor, also without CoreBridge

#### injectJS

`(js: string) => void`<br />
inject custom javascript into the editor's webview. Calls made before the editor is ready are queued. <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### updateScrollThresholdAndMargin

`(offset: number) => void`<br />
a function that gets offset in px and changes [scrollThreshold](https://prosemirror.net/docs/ref/#view.EditorProps.scrollThreshold) [scrollMargin](https://prosemirror.net/docs/ref/#view.EditorProps.scrollMargin). `RichText` sets this itself when the keyboard opens or closes; to keep extra space permanently, use the [scrollBottomOffset](./useEditorBridge.md#scrollbottomoffset) option. <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### toggleBold

`() => void` <br />will toggle bold on the editor if possible <br /> extended by [BoldBridge](./BridgeExtensions.md#boldbridge)

#### toggleItalic

`() => void` <br />will toggle italic on the editor if possible <br /> extended by [ItalicBridge](./BridgeExtensions.md#italicbridge)

#### toggleUnderline

`() => void` <br />will toggle underline on the editor if possible <br /> extended by [UnderlineBridge](./BridgeExtensions.md#underlinebridge)

#### toggleStrike

`() => void` <br />will toggle strikethrough on the editor if possible <br /> extended by [StrikeBridge](./BridgeExtensions.md#strikebridge)

#### toggleCode

`() => void` <br />will toggle inline code on the editor if possible <br /> extended by [CodeBridge](./BridgeExtensions.md#codebridge)

#### toggleBlockquote

`() => void` <br />will toggle blockquote on the editor if possible <br /> extended by [BlockquoteBridge](./BridgeExtensions.md#blockquotebridge)

#### toggleBulletList

`() => void` <br />will toggle bullet list on the editor if possible <br /> extended by [BulletListBridge](./BridgeExtensions.md#bulletlistbridge)

#### toggleOrderedList

`() => void` <br />will toggle order list on the editor if possible <br /> extended by [OrderedListBridge](./BridgeExtensions.md#orderedlistbridge)

#### toggleHeading

`(level: 1 | 2 | 3 | 4 | 5 | 6) => void` <br />gets level and toggles heading on the editor if possible <br /> extended by [HeadingBridge](./BridgeExtensions.md#headingbridge)

#### lift

`() => void` <br />will lift the list item on the editor if possible <br /> extended by [ListItemBridge](./BridgeExtensions.md#listitembridge)

#### sink

`() => void` <br />will sink the list item on the editor if possible <br /> extended by [ListItemBridge](./BridgeExtensions.md#listitembridge)

#### toggleTaskList

`() => void` <br />will toggle task list on the editor if possible <br /> extended by [TaskListBridge](./BridgeExtensions.md#tasklistbridge)

#### liftTaskListItem

`() => void` <br />will lift the task list item on the editor if possible <br /> extended by [TaskListBridge](./BridgeExtensions.md#tasklistbridge)

#### sinkTaskListItem

`() => void` <br />will sink the task list item on the editor if possible <br /> extended by [TaskListBridge](./BridgeExtensions.md#tasklistbridge)

#### undo

`() => void` <br />will undo the last history transaction if possible <br /> extended by [HistoryBridge](./BridgeExtensions.md#historybridge)

#### redo

`() => void` <br />will redo the last undo transaction if possible <br /> extended by [HistoryBridge](./BridgeExtensions.md#historybridge)

#### setColor

`(color: string) => void` <br />sets text color<br /> extended by [ColorBridge](./BridgeExtensions.md#colorbridge)

#### unsetColor

`() => void` <br />un-sets text color<br /> extended by [ColorBridge](./BridgeExtensions.md#colorbridge)

#### setHighlight

`(color: string) => void` <br />sets text highlight<br /> extended by [HighlightBridge](./BridgeExtensions.md#highlightbridge)

#### toggleHighlight

`(color: string) => void` <br />toggles text highlight<br /> extended by [HighlightBridge](./BridgeExtensions.md#highlightbridge)

#### unsetHighlight

`() => void` <br />un-sets text highlight<br /> extended by [HighlightBridge](./BridgeExtensions.md#highlightbridge)

#### setImage

`(src: string) => void` <br />gets image url string and inserts an image. If the image ends up as the last block of the document, an empty paragraph is added after it and the cursor moves there, so you can keep typing below it. <br /> extended by [ImageBridge](./BridgeExtensions.md#imagebridge)

#### setLink

`(link: string | null) => void` <br />gets link url as string and sets link. `''` removes the link and `null` does nothing. A URL without a scheme gets one added (`www.google.com` becomes `https://www.google.com`); see [LinkBridge](./BridgeExtensions.md#linkbridge). <br /> extended by [LinkBridge](./BridgeExtensions.md#linkbridge)

#### setPlaceholder

`(newPlaceholder: string) => void` <br />will change the placeholder on run time <br /> extended by [PlaceholderBridge](./BridgeExtensions.md#placeholderbridge)

#### setHardBreak

`() => void` <br />inserts a line break (`<br>`) at the cursor <br /> extended by [HardBreakBridge](./BridgeExtensions.md#hardbreakbridge)

## Errors

The async methods can reject with these errors, both exported from `@10play/tentap-editor`:

| Error | When |
| --- | --- |
| `TentapRpcTimeoutError` | The WebView didn't answer within [rpcTimeoutMs](./useEditorBridge.md#rpctimeoutms). Has `requestType` and `timeoutMs`. |
| `TentapUnsupportedError` | The editor bundle doesn't support the method, usually a custom bundle built with an older version. Has `capability`. |
