---
description: Reference for BridgeState, the editor state on the native side, and the useBridgeState hook.
sidebar_position: 3
---

# BridgeState

The BridgeState is the latest state of the editor webview on the native side, it's extendable by BridgeExtensions and is generally used with [useBridgeState](#usebridgestate)

The list below is the interface of BridgeState in case you use `TenTapStarterkit` or using all the BridgeExtensions the lib exports, on each prop we specify what bridgeExtension adds it

### BridgeState properties

#### editable

`boolean`
<br />Is the editor editable or not <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### empty

`boolean`
<br />Is the editor empty or not <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### selection

`{ from: number; to: number }`
<br />The selection on the editor-web. `from` and `to` are ProseMirror document positions, not character offsets: every block boundary adds a position, so they don't index into the string from `getText()`. To read the selected text use [getSelectedText](./EditorBridge.md#getselectedtext). <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### isFocused

`boolean`
<br />true when the editor is focused <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### isReady

`boolean`
<br />true when the editor is fully loaded and can receive commands. It becomes true as soon as the web editor is created, whether or not it is editable or focused, and goes back to false while the WebView reloads (for example after the system kills its content process). You don't have to wait for it before calling editor methods: commands sent earlier are queued. <br /> extended by [CoreBridge](./BridgeExtensions.md#coreextension)

#### isBlockquoteActive

`boolean`
<br />true when the cursor is where blockquote is active <br /> extended by [BlockquoteBridge](./BridgeExtensions.md#blockquotebridge)

#### canToggleBlockquote

`boolean`
<br />true when it's possible to toggle blockquote <br /> extended by [BlockquoteBridge](./BridgeExtensions.md#blockquotebridge)

#### isCodeActive

`boolean`
<br />true when the cursor is where code is active <br /> extended by [CodeBridge](./BridgeExtensions.md#codebridge)

#### canToggleCode

`boolean`
<br />true when it's possible to toggle code <br /> extended by [CodeBridge](./BridgeExtensions.md#codebridge)

#### isBoldActive

`boolean`
<br />true when the cursor is where bold is active <br /> extended by [BoldBridge](./BridgeExtensions.md#boldbridge)

#### canToggleBold

`boolean`
<br />true when it's possible to toggle bold <br /> extended by [BoldBridge](./BridgeExtensions.md#boldbridge)

#### isItalicActive

`boolean`
<br />true when the cursor is where italic is active <br /> extended by [ItalicBridge](./BridgeExtensions.md#italicbridge)

#### canToggleItalic

`boolean`
<br />true when it's possible to toggle italic <br /> extended by [ItalicBridge](./BridgeExtensions.md#italicbridge)

#### isUnderlineActive

`boolean`
<br />true when the cursor is where underline is active <br /> extended by [UnderlineBridge](./BridgeExtensions.md#underlinebridge)

#### canToggleUnderline

`boolean`
<br />true when it's possible to toggle underline <br /> extended by [UnderlineBridge](./BridgeExtensions.md#underlinebridge)

#### isStrikeActive

`boolean`
<br />true when the cursor is where Strike is active <br /> extended by [StrikeBridge](./BridgeExtensions.md#strikebridge)

#### canToggleStrike

`boolean`
<br />true when it's possible to toggle Strike <br /> extended by [StrikeBridge](./BridgeExtensions.md#strikebridge)

#### isBulletListActive

`boolean`
<br />true when the cursor is where bullet list is active <br /> extended by [BulletListBridge](./BridgeExtensions.md#bulletlistbridge)

#### canToggleBulletList

`boolean`
<br />true when it's possible to toggle bullet list <br /> extended by [BulletListBridge](./BridgeExtensions.md#bulletlistbridge)

#### isOrderedListActive

`boolean`
<br />true when the cursor is where ordered list is active <br /> extended by [OrderedListBridge](./BridgeExtensions.md#orderedlistbridge)

#### canToggleOrderedList

`boolean`
<br />true when it's possible to toggle ordered list <br /> extended by [OrderedListBridge](./BridgeExtensions.md#orderedlistbridge)

#### isTaskListActive

`boolean`
<br />true when the cursor is where task list is active <br /> extended by [TaskListBridge](./BridgeExtensions.md#tasklistbridge)

#### canToggleTaskList

`boolean`
<br />true when it's possible to toggle task list <br /> extended by [TaskListBridge](./BridgeExtensions.md#tasklistbridge)

#### canLiftTaskListItem

`boolean`
<br />true when it's possible to lift a task list item <br /> extended by [TaskListBridge](./BridgeExtensions.md#tasklistbridge)

#### canSinkTaskListItem

`boolean`
<br />true when it's possible to sink a task list item <br /> extended by [TaskListBridge](./BridgeExtensions.md#tasklistbridge)

#### headingLevel

`number | undefined`
<br />undefined when no heading is applied, number of the heading level <br /> extended by [HeadingBridge](./BridgeExtensions.md#headingbridge)

#### canToggleHeading

`boolean`
<br />true when it's possible to toggle heading <br /> extended by [HeadingBridge](./BridgeExtensions.md#headingbridge)

#### canLift

`boolean`
<br />true when it's possible to lift list item <br /> extended by [ListItemBridge](./BridgeExtensions.md#listitembridge)

#### canSink

`boolean`
<br />true when it's possible to sink a list item <br /> extended by [ListItemBridge](./BridgeExtensions.md#listitembridge)

#### canUndo

`boolean`
<br />true when it's possible to undo the doc history stack <br /> extended by [HistoryBridge](./BridgeExtensions.md#historybridge)

#### canRedo

`boolean`
<br />true when it's possible to redo the doc history stack <br /> extended by [HistoryBridge](./BridgeExtensions.md#historybridge)

#### activeColor

`string | undefined`
<br />undefined when no color is applied, string of the color that is active on the selection <br /> extended by [ColorBridge](./BridgeExtensions.md#colorbridge)

#### activeHighlight

`string | undefined`
<br />undefined when no highlight is applied, string of the highlight that active on the selection <br /> extended by [HighlightBridge](./BridgeExtensions.md#highlightbridge)

#### isLinkActive

`boolean`
<br />true when the link is in the selection <br /> extended by [LinkBridge](./BridgeExtensions.md#linkbridge)

#### canSetLink

`boolean`
<br />true when it's possible to add link, for example when there is no selection it not possible <br /> extended by [LinkBridge](./BridgeExtensions.md#linkbridge)

#### activeLink

`string | undefined`
<br />undefined when there is no link, string of the link that active on the selection position <br /> extended by [LinkBridge](./BridgeExtensions.md#linkbridge)

### useBridgeState

a react hook to subscribe to changes on the BridgeState. It takes the `EditorBridge` and returns the latest `BridgeState`, re-rendering when it changes.

```tsx
const editorState = useBridgeState(editor);

<Button
  title={editorState.isBoldActive ? 'Unbold' : 'Bold'}
  onPress={() => editor.toggleBold()}
  disabled={!editorState.canToggleBold}
/>;
```

Before the editor is ready the core fields already have values (`isReady: false`, `isFocused: false`, `empty: true`, `selection: { from: 0, to: 0 }`, and `editable` from the option), so reading them never throws.
