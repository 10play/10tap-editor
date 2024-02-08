---
sidebar_position: 2
---

# EditorBridge

interface of all the interactions you can do with the editor on the react native side, can be extendable with BrideExtension, with tentapStarterkit enable (also when simple usage) the EditorBridge will have:

#### focus

`(pos?: 'start' \| 'end' \| 'all' \| number \| boolean \| null) => void`

a function that will focus the editor and make sure to open keyboard <br /> extend by [coreBridge](https://10play.dev)

#### webviewRef

`RefObject\<WebView\>`

a ref for the webview that show the editor <br /> extend by [coreBridge](https://10play.dev)

#### getEditorState

`() => BridgeState`

a function that will return the most up to date BridgeState <br /> extend by [coreBridge](https://10play.dev)

#### getContent

`() => Promise\<string\>`

an async function that will return the content of the editor <br /> extend by [coreBridge](https://10play.dev)

#### setContent

`(content: string) => void`

a function that get html as string and set the editor content by that <br /> extend by [coreBridge](https://10play.dev)

#### setSelection

`(from: number, to: number) => void`

a function that get position and set the selection <br /> extend by [coreBridge](https://10play.dev)

#### updateScrollThresholdAndMargin

`(offset: number) => void`

a function that get offset in px and change [scrollThreshold](https://prosemirror.net/docs/ref/#view.EditorProps.scrollThreshold) [scrollMargin](https://prosemirror.net/docs/ref/#view.EditorProps.scrollMargin) <br /> extend by [coreBridge](https://10play.dev)

#### toggleBlockquote

`() => void`  
will toggle bold on the editor if possible <br /> extend by [staterKit](https://10play.dev)

#### toggleCode

`() => void`  
will toggle code block on the editor if possible <br /> extend by [staterKit](https://10play.dev)

#### toggleItalic

`() => void`  
will toggle italic on the editor if possible <br /> extend by [staterKit](https://10play.dev)

#### toggleStrikethrough

`() => void`  
will toggle strikethrough on the editor if possible <br /> extend by [staterKit](https://10play.dev)

#### toggleBulletList

`() => void`  
will toggle bullet list on the editor if possible <br /> extend by [staterKit](https://10play.dev)

#### toggleOrderedList

`() => void`  
will toggle order list on the editor if possible <br /> extend by [staterKit](https://10play.dev)

#### toggleHeading

`(level: number) => void`  
will get level and will toggle heading on the editor if possible <br /> extend by [staterKit](https://10play.dev)

#### lift

`() => void`  
will lift p on the editor if possible <br /> extend by [staterKit](https://10play.dev)

#### sink

`() => void`  
will sink p on the editor if possible <br /> extend by [staterKit](https://10play.dev)

#### undo

`() => void`  
will undo the last history transaction if possible <br /> extend by [staterKit](https://10play.dev)

#### redo

`() => void`  
will redo the last undo transaction if possible <br /> extend by [staterKit](https://10play.dev)

#### setColor

`(color: string) => void`  
get color string and set it for the editor <br /> extend by [color](https://10play.dev)

#### setHighlight

`(color: string) => void`  
get color string and set highlight for the editor <br /> extend by [highlight](https://10play.dev)

#### setImage

`(src: string) => void`  
get image url string and set image <br /> extend by [image](https://10play.dev)

#### setLink

`(link: string \| null) => void`  
get link url as string and set link, in case of null it will remove the link <br /> extend by [link](https://10play.dev)

#### toggleTaskList

`() => void`  
will toggle task list on the editor if possible <br /> extend by [tasklist](https://10play.dev)

#### toggleUnderline

`() => void`  
will toggle underline on the editor if possible <br /> extend by [underline](https://10play.dev)

<!-- toggleUnderline: () => void; -->
