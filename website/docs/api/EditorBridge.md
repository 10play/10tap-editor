---
sidebar_position: 2
---

# EditorBridge

An Interface of all the commands you can do with the editor on the react native side, can be extended with a [BrideExtension](./BridgeExtensions.md). With all of the bridges included in `tentapStarterKit` the EditorBridge will have:

#### focus

`(pos?: 'start' \| 'end' \| 'all' \| number \| boolean \| null) => void`<br />
a function that will focus the editor and open the keyboard <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### blur

a function that will blur the editor and close the keyboard <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### webviewRef

`RefObject\<WebView\>`<br />
a ref for the webview that renders the editor <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### getEditorState

`() => BridgeState`<br />
a function that will return the most up to date BridgeState <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### getHTML

`() => Promise\<string\>`<br />
an async function that will return the content of the editor in html format <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### getText

`() => Promise\<string\>`<br />
an async function that will return the content of the editor in text format <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### getJSON

`() => Promise\<object\>`<br />
an async function that will return the content of the editor in json format <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### setContent

`(content: Content) => void`<br />
a function that get's html as string or document object and set set's it as the editors content <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### setEditable

`(editable: boolean) => void`<br />
a function that sets the editable state <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### setSelection

`(from: number, to: number) => void`<br />
sets the selection of the editor <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### injectCSS

`(css: string, tag?: string) => void`<br />
creates or updates the stylesheet with the given tag, see [Dynamically Updating CSS](../examples/customCss/#dynamically-updating-css) <br /> <u>default</u> `tag`: `custom-css`<br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### injectJS

`(js: string) => void`<br />
inject custom javascript into the editor's webview <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### updateScrollThresholdAndMargin

`(offset: number) => void`<br />
a function that gets offset in px and changes [scrollThreshold](https://prosemirror.net/docs/ref/#view.EditorProps.scrollThreshold) [scrollMargin](https://prosemirror.net/docs/ref/#view.EditorProps.scrollMargin) <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### toggleBlockquote

`() => void` <br />will toggle bold on the editor if possible <br /> extended by [BlockquoteBridge](./BridgeExtensions#blockquotebridge)

#### toggleCode

`() => void` <br />will toggle code block on the editor if possible <br /> extended by [CodeBridge](./BridgeExtensions#codebridge)

#### toggleItalic

`() => void` <br />will toggle italic on the editor if possible <br /> extended by [ItalicBridge](./BridgeExtensions#italicbridge)

#### toggleStrikethrough

`() => void` <br />will toggle strikethrough on the editor if possible <br /> extended by [StrikeBridge](./BridgeExtensions#strikebridge)

#### toggleBulletList

`() => void` <br />will toggle bullet list on the editor if possible <br /> extended by [BulletListBridge](./BridgeExtensions#bulletlistbridge)

#### toggleOrderedList

`() => void` <br />will toggle order list on the editor if possible <br /> extended by [OrderedListBridge](./BridgeExtensions#orderedlistbridge)

#### toggleHeading

`(level: number) => void` <br />gets level and toggles heading on the editor if possible <br /> extended by [HeadingBridge](./BridgeExtensions#headingbridge)

#### lift

`() => void` <br />will lift p on the editor if possible <br /> extended by [ListItemBridge](./BridgeExtensions#listitembridge)

#### sink

`() => void` <br />will sink p on the editor if possible <br /> extended by [ListItemBridge](./BridgeExtensions#listitembridge)

#### undo

`() => void` <br />will undo the last history transaction if possible <br /> extended by [HistoryBridge](./BridgeExtensions#historybridge)

#### redo

`() => void` <br />will redo the last undo transaction if possible <br /> extended by [HistoryBridge](./BridgeExtensions#historybridge)

#### setColor

`(color: string) => void` <br />sets text color<br /> extended by [ColorBridge](./BridgeExtensions#colorbridge)

#### unsetColor

`() => void` <br />un-sets text color<br /> extended by [ColorBridge](./BridgeExtensions#colorbridge)

#### setHighlight

`(color: string) => void` <br />sets text highlight<br /> extended by [HighlightBridge](./BridgeExtensions#highlightbridge)

#### toggleHighlight

`(color: string) => void` <br />toggles text highlight<br /> extended by [HighlightBridge](./BridgeExtensions#highlightbridge)

#### unsetHighlight

`(color: string) => void` <br />un-sets text highlight<br /> extended by [HighlightBridge](./BridgeExtensions#highlightbridge)

#### setImage

`(src: string) => void` <br />gets image url string and sets image <br /> extended by [ImageBridge](./BridgeExtensions#imagebridge)

#### setLink

`(link: string \| null) => void` <br />gets link url as string and sets link, in case of null it will remove the link <br /> extended by [LinkBridge](./BridgeExtensions#linkbridge)

#### toggleTaskList

`() => void` <br />will toggle task list on the editor if possible <br /> extended by [TaskListBridge](./BridgeExtensions#tasklistbridge)

#### toggleUnderline

`() => void` <br />will toggle underline on the editor if possible <br /> extended by [UnderlineBridge](./BridgeExtensions#underlinebridge)

#### setPlaceholder

`(newPlaceholder: string) => void` <br />will change the placeholder on run time <br /> extended by [PlaceholderBridge](./BridgeExtensions#placeholderbridge)

<!-- toggleUnderline: () => void; -->
