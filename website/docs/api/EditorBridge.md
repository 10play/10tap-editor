---
sidebar_position: 2
---

# EditorBridge

An interface for all commands available on the React Native side of the editor. It can be extended with a [BridgeExtension](./BridgeExtensions.md).

When using `tentapStarterKit`, the EditorBridge includes the following methods:

## Core Functions

| Method                         | Signature                                                                | Description                                                                                                                                                                       | Extended By                                    |
| ------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| focus                          | `(pos?: 'start' \| 'end' \| 'all' \| number \| boolean \| null) => void` | Focuses the editor and opens the keyboard                                                                                                                                         | [CoreBridge](./BridgeExtensions#coreextension) |
| blur                           | `() => void`                                                             | Blurs the editor and closes the keyboard                                                                                                                                          | [CoreBridge](./BridgeExtensions#coreextension) |
| webviewRef                     | `RefObject<WebView>`                                                     | A ref for the webview that renders the editor                                                                                                                                     | [CoreBridge](./BridgeExtensions#coreextension) |
| getEditorState                 | `() => BridgeState`                                                      | Returns the most up-to-date BridgeState                                                                                                                                           | [CoreBridge](./BridgeExtensions#coreextension) |
| getHTML                        | `() => Promise<string>`                                                  | Returns the editor content in HTML format                                                                                                                                         | [CoreBridge](./BridgeExtensions#coreextension) |
| getText                        | `() => Promise<string>`                                                  | Returns the editor content in text format                                                                                                                                         | [CoreBridge](./BridgeExtensions#coreextension) |
| getJSON                        | `() => Promise<object>`                                                  | Returns the editor content in JSON format                                                                                                                                         | [CoreBridge](./BridgeExtensions#coreextension) |
| setContent                     | `(content: string) => void`                                              | Sets the editor content from an HTML string                                                                                                                                       | [CoreBridge](./BridgeExtensions#coreextension) |
| setEditable                    | `(editable: boolean) => void`                                            | Sets the editable state of the editor                                                                                                                                             | [CoreBridge](./BridgeExtensions#coreextension) |
| setSelection                   | `(from: number, to: number) => void`                                     | Sets the selection range in the editor                                                                                                                                            | [CoreBridge](./BridgeExtensions#coreextension) |
| injectCSS                      | `(css: string, tag?: string) => void`                                    | Creates or updates a stylesheet. Default tag: `custom-css`. See [Dynamically Updating CSS](../examples/customCss/#dynamically-updating-css)                                       | [CoreBridge](./BridgeExtensions#coreextension) |
| injectJS                       | `(js: string) => void`                                                   | Injects custom JavaScript into the editor's webview                                                                                                                               | [CoreBridge](./BridgeExtensions#coreextension) |
| updateScrollThresholdAndMargin | `(offset: number) => void`                                               | Updates [scrollThreshold](https://prosemirror.net/docs/ref/#view.EditorProps.scrollThreshold) and [scrollMargin](https://prosemirror.net/docs/ref/#view.EditorProps.scrollMargin) | [CoreBridge](./BridgeExtensions#coreextension) |

## Formatting Functions

| Method              | Signature                 | Description                       | Extended By                                             |
| ------------------- | ------------------------- | --------------------------------- | ------------------------------------------------------- |
| toggleBlockquote    | `() => void`              | Toggles blockquote if possible    | [BlockquoteBridge](./BridgeExtensions#blockquotebridge) |
| toggleCode          | `() => void`              | Toggles code block if possible    | [CodeBridge](./BridgeExtensions#codebridge)             |
| toggleItalic        | `() => void`              | Toggles italic if possible        | [ItalicBridge](./BridgeExtensions#italicbridge)         |
| toggleStrikethrough | `() => void`              | Toggles strikethrough if possible | [StrikeBridge](./BridgeExtensions#strikebridge)         |
| toggleUnderline     | `() => void`              | Toggles underline if possible     | [UnderlineBridge](./BridgeExtensions#underlinebridge)   |
| setColor            | `(color: string) => void` | Sets text color                   | [ColorBridge](./BridgeExtensions#colorbridge)           |
| unsetColor          | `() => void`              | Removes text color                | [ColorBridge](./BridgeExtensions#colorbridge)           |
| setHighlight        | `(color: string) => void` | Sets text highlight               | [HighlightBridge](./BridgeExtensions#highlightbridge)   |
| toggleHighlight     | `(color: string) => void` | Toggles text highlight            | [HighlightBridge](./BridgeExtensions#highlightbridge)   |
| unsetHighlight      | `() => void`              | Removes text highlight            | [HighlightBridge](./BridgeExtensions#highlightbridge)   |

## List Functions

| Method            | Signature    | Description                      | Extended By                                               |
| ----------------- | ------------ | -------------------------------- | --------------------------------------------------------- |
| toggleBulletList  | `() => void` | Toggles bullet list if possible  | [BulletListBridge](./BridgeExtensions#bulletlistbridge)   |
| toggleOrderedList | `() => void` | Toggles ordered list if possible | [OrderedListBridge](./BridgeExtensions#orderedlistbridge) |
| toggleTaskList    | `() => void` | Toggles task list if possible    | [TaskListBridge](./BridgeExtensions#tasklistbridge)       |
| lift              | `() => void` | Lifts list item if possible      | [ListItemBridge](./BridgeExtensions#listitembridge)       |
| sink              | `() => void` | Sinks list item if possible      | [ListItemBridge](./BridgeExtensions#listitembridge)       |

## Other Functions

| Method        | Signature                        | Description                                     | Extended By                                       |
| ------------- | -------------------------------- | ----------------------------------------------- | ------------------------------------------------- |
| toggleHeading | `(level: number) => void`        | Toggles heading at specified level if possible  | [HeadingBridge](./BridgeExtensions#headingbridge) |
| undo          | `() => void`                     | Undoes the last history transaction if possible | [HistoryBridge](./BridgeExtensions#historybridge) |
| redo          | `() => void`                     | Redoes the last undone transaction if possible  | [HistoryBridge](./BridgeExtensions#historybridge) |
| setImage      | `(src: string) => void`          | Sets an image from the given URL                | [ImageBridge](./BridgeExtensions#imagebridge)     |
| setLink       | `(link: string \| null) => void` | Sets a link or removes it if null is passed     | [LinkBridge](./BridgeExtensions#linkbridge)       |
