---
sidebar_position: 2
---

# EditorBridge

interface of all the interactions you can do with the editor on the react native side, can be extendable with BrideExtension, with tentapStarterkit enable (also when simple usage) the EditorBridge will have:

#### focus

`(pos?: 'start' \| 'end' \| 'all' \| number \| boolean \| null) => void`

a function that will focus the editor and make sure to open keyboard <br /> extend by [CoreBridge](./BridgeExtensions#coreextension)

#### webviewRef

`RefObject\<WebView\>`

a ref for the webview that show the editor <br /> extend by [CoreBridge](./BridgeExtensions#coreextension)

#### getEditorState

`() => BridgeState`

a function that will return the most up to date BridgeState <br /> extend by [CoreBridge](./BridgeExtensions#coreextension)

#### getContent

`() => Promise\<string\>`

an async function that will return the content of the editor <br /> extend by [CoreBridge](./BridgeExtensions#coreextension)

#### setContent

`(content: string) => void`

a function that get html as string and set the editor content by that <br /> extend by [CoreBridge](./BridgeExtensions#coreextension)

#### setSelection

`(from: number, to: number) => void`

a function that get position and set the selection <br /> extend by [CoreBridge](./BridgeExtensions#coreextension)

#### updateScrollThresholdAndMargin

`(offset: number) => void`

a function that get offset in px and change [scrollThreshold](https://prosemirror.net/docs/ref/#view.EditorProps.scrollThreshold) [scrollMargin](https://prosemirror.net/docs/ref/#view.EditorProps.scrollMargin) <br /> extend by [CoreBridge](./BridgeExtensions#coreextension)

#### toggleBlockquote

`() => void`  
will toggle bold on the editor if possible <br /> extend by [BlockquoteBridge](./BridgeExtensions#blockquotebridge)

#### toggleCode

`() => void`  
will toggle code block on the editor if possible <br /> extend by [CodeBridge](./BridgeExtensions#codebridge)

#### toggleItalic

`() => void`  
will toggle italic on the editor if possible <br /> extend by [ItalicBridge](./BridgeExtensions#italicbridge)

#### toggleStrikethrough

`() => void`  
will toggle strikethrough on the editor if possible <br /> extend by [StrikeBridge](./BridgeExtensions#strikebridge)

#### toggleBulletList

`() => void`  
will toggle bullet list on the editor if possible <br /> extend by [BulletListBridge](./BridgeExtensions#bulletlistbridge)

#### toggleOrderedList

`() => void`  
will toggle order list on the editor if possible <br /> extend by [OrderListBridge](./BridgeExtensions#orderedlistbridge)

#### toggleHeading

`(level: number) => void`  
will get level and will toggle heading on the editor if possible <br /> extend by [HeadingBridge](./BridgeExtensions#headingbridge)

#### lift

`() => void`  
will lift p on the editor if possible <br /> extend by [ListItemBridge](./BridgeExtensions#listitembridge)

#### sink

`() => void`  
will sink p on the editor if possible <br /> extend by [ListItemBridge](./BridgeExtensions#listitembridge)

#### undo

`() => void`  
will undo the last history transaction if possible <br /> extend by [HistoryBridge](./BridgeExtensions#historybridge)

#### redo

`() => void`  
will redo the last undo transaction if possible <br /> extend by [HistoryBridge](./BridgeExtensions#historybridge)

#### setColor

`(color: string) => void`  
get color string and set it for the editor <br /> extend by [ColorBridge](./BridgeExtensions#colorbridge)

#### setHighlight

`(color: string) => void`  
get color string and set highlight for the editor <br /> extend by [HighlightBridge](./BridgeExtensions#highlightbridge)

#### setImage

`(src: string) => void`  
get image url string and set image <br /> extend by [ImageBridge](./BridgeExtensions#imagebridge)

#### setLink

`(link: string \| null) => void`  
get link url as string and set link, in case of null it will remove the link <br /> extend by [LinkBridge](./BridgeExtensions#linkbridge)

#### toggleTaskList

`() => void`  
will toggle task list on the editor if possible <br /> extend by [TaskListBridge](./BridgeExtensions#tasklistbridge)

#### toggleUnderline

`() => void`  
will toggle underline on the editor if possible <br /> extend by [UnderlineBridge](./BridgeExtensions#underlinebridge)

<!-- toggleUnderline: () => void; -->
