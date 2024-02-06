---
sidebar_position: 2
---

# EditorBridge

interface of all the interactions you can do with the editor on the react native side, can be extendable with BrideExtension, with tentapStarterkit enable (also when simple usage) the EditorBridge will have:

#### focus - `(pos?: 'start' \| 'end' \| 'all' \| number \| boolean \| null) => void`

a function that will focus the editor and make sure to open keyboard <br /> extend by [coreBridge](google.com)

#### webviewRef - `RefObject\<WebView\>`

a ref for the webview that show the editor <br /> extend by [coreBridge](google.com)

#### getEditorState - `() => BridgeState`

a function that will return the most up to date BridgeState <br /> extend by [coreBridge](google.com)

| name                           | type                                                                     | description                                                                                                                                                                                                       | BrideExtension |
| ------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| focus                          | `(pos?: 'start' \| 'end' \| 'all' \| number \| boolean \| null) => void` | a function that will focus the editor and make sure to open keyboard                                                                                                                                              | core           |
| webviewRef                     | `RefObject\<WebView\>`                                                   | a ref for the webview that show the editor                                                                                                                                                                        | core           |
| getEditorState                 | `() => BridgeState`                                                      | a function that will return the most up to date BridgeState                                                                                                                                                       | core           |
| getContent                     | `() => Promise\<string\>`                                                | an async function that will return the content of the editor                                                                                                                                                      | core           |
| setContent                     | `(content: string) => void`                                              | a function that get html as string and set the editor content by that                                                                                                                                             | core           |
| setSelection                   | `(from: number, to: number) => void`                                     | a function that get position and set the selection                                                                                                                                                                | core           |
| updateScrollThresholdAndMargin | `(offset: number) => void`                                               | a function that get offset in px and change [scrollThreshold](https://prosemirror.net/docs/ref/#view.EditorProps.scrollThreshold) [scrollMargin](https://prosemirror.net/docs/ref/#view.EditorProps.scrollMargin) | core           |
| toggleBlockquote               | `() => void`                                                             | will toggle bold on the editor if possible                                                                                                                                                                        | staterKit      |
| toggleCodeBlock                | `() => void`                                                             | will toggle code block on the editor if possible                                                                                                                                                                  | staterKit      |
| toggleItalic                   | `() => void`                                                             | will toggle italic on the editor if possible                                                                                                                                                                      | staterKit      |
| toggleStrikethrough            | `() => void`                                                             | will toggle strikethrough on the editor if possible                                                                                                                                                               | staterKit      |
| toggleBulletList               | `() => void`                                                             | will toggle bullet list on the editor if possible                                                                                                                                                                 | staterKit      |
| toggleOrderedList              | `() => void`                                                             | will toggle order list on the editor if possible                                                                                                                                                                  | staterKit      |
| toggleHeading                  | `(level: number) => void`                                                | will get level and will toggle heading on the editor if possible                                                                                                                                                  | staterKit      |
| lift                           | `() => void`                                                             | will lift p on the editor if possible                                                                                                                                                                             | staterKit      |
| sink                           | `() => void`                                                             | will sink p on the editor if possible                                                                                                                                                                             | staterKit      |
| undo                           | `() => void`                                                             | will undo the last history transaction if possible                                                                                                                                                                | staterKit      |
| redo                           | `() => void`                                                             | will redo the last undo transaction if possible                                                                                                                                                                   | staterKit      |
| setColor                       | `(color: string) => void`                                                | get color string and set it for the editor                                                                                                                                                                        | color          |
| setHighlight                   | `(color: string) => void`                                                | get color string and set highlight for the editor                                                                                                                                                                 | highlight      |
| setImage                       | `(src: string) => void`                                                  | get image url string and set image                                                                                                                                                                                | image          |
| setLink                        | `(link: string \| null) => void`                                         | get link url as string and set link, in case of null it will remove the link                                                                                                                                      | link           |
| toggleTaskList                 | `() => void`                                                             | will toggle task list on the editor if possible                                                                                                                                                                   | tasklist       |
| toggleUnderline                | `() => void`                                                             | will toggle underline on the editor if possible                                                                                                                                                                   | underline      |

<!-- toggleUnderline: () => void; -->
