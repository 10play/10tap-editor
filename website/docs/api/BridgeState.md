---
sidebar_position: 2
---

# BridgeState

The BridgeState is the last state of the editor webview on the native side, it's extendable by BridgeExtensions and can use by [useBridgeState](#usebridgestate)

The list above is the interface of BridgeState in case you use TenTapStarterkit or using all the BridgeExtensions the lib export, on each prop we specify what bridgeExtension add it

### BridgeState properties

#### selection

`{ from: number; to: number }`
<br />The selection on the editor-web <br /> extend by [CoreBridge](./BridgeExtensions#coreextension)

#### isFocused

`boolean`
<br />true when the editor is focused <br /> extend by [CoreBridge](./BridgeExtensions#coreextension)

#### isReady

`boolean`
<br />true when the editor fully loaded <br /> extend by [CoreBridge](./BridgeExtensions#coreextension)

#### isBlockquoteActive

`boolean`
<br />true when the cursor is where blockquote is active <br /> extend by [BlockquoteBridge](./BridgeExtensions#blockquotebridge)

#### canToggleBlockquote

`boolean`
<br />true when it's possible to apply toggle on blockquote <br /> extend by [BlockquoteBridge](./BridgeExtensions#blockquotebridge)

#### isCodeActive

`boolean`
<br />true when the cursor is where code is active <br /> extend by [CodeBridge](./BridgeExtensions#codebridge)

#### canToggleCode

`boolean`
<br />true when it's possible to apply toggle on code <br /> extend by [CodeBridge](./BridgeExtensions#codebridge)

#### isBoldActive

`boolean`
<br />true when the cursor is where bold is active <br /> extend by [BoldBridge](./BridgeExtensions#boldbridge)

#### canToggleBold

`boolean`
<br />true when it's possible to apply toggle on bold <br /> extend by [BoldBridge](./BridgeExtensions#boldbridge)

#### isItalicActive

`boolean`
<br />true when the cursor is where italic is active <br /> extend by [ItalicBridge](./BridgeExtensions#italicbridge)

#### canToggleItalic

`boolean`
<br />true when it's possible to apply toggle on italic <br /> extend by [ItalicBridge](./BridgeExtensions#italicbridge)

#### isUnderlineActive

`boolean`
<br />true when the cursor is where underline is active <br /> extend by [ItalicBridge](./BridgeExtensions#italicbridge)

#### canToggleUnderline

`boolean`
<br />true when it's possible to apply underline on italic <br /> extend by [ItalicBridge](./BridgeExtensions#italicbridge)

#### isStrikeActive

`boolean`
<br />true when the cursor is where Strike is active <br /> extend by [StrikeBridge](./BridgeExtensions#strikebridge)

#### canToggleStrike

`boolean`
<br />true when it's possible to apply toggle on Strike <br /> extend by [StrikeBridge](./BridgeExtensions#strikebridge)

#### isBulletListActive

`boolean`
<br />true when the cursor is where bullet list is active <br /> extend by [BulletListBridge](./BridgeExtensions#bulletlistbridge)

#### canToggleBulletList

`boolean`
<br />true when it's possible to apply toggle on bullet list <br /> extend by [BulletListBridge](./BridgeExtensions#bulletlistbridge)

#### isOrderedListActive

`boolean`
<br />true when the cursor is where ordered list is active <br /> extend by [OrderedListBridge](./BridgeExtensions#orderedlistbridge)

#### canToggleOrderedList

`boolean`
<br />true when it's possible to apply toggle on ordered list <br /> extend by [OrderedListBridge](./BridgeExtensions#orderedlistbridge)

#### isTaskListActive

`boolean`
<br />true when the cursor is where task list is active <br /> extend by [TaskListBridge](./BridgeExtensions#tasklistbridge)

#### canToggleTaskList

`boolean`
<br />true when it's possible to apply toggle on task list <br /> extend by [TaskListBridge](./BridgeExtensions#tasklistbridge)

#### headingLevel

`number | undefined`
<br />undefined when no heading apply, number of the heading level <br /> extend by [HeadingBridge](./BridgeExtensions#headingbridge)

#### canToggleHeading

`boolean`
<br />true when it's possible to apply toggle on heading <br /> extend by [HeadingBridge](./BridgeExtensions#headingbridge)

#### canLift

`boolean`
<br />true when it's possible to apply lift on list item <br /> extend by [HeadingBridge](./BridgeExtensions#headingbridge)

#### canSink

`boolean`
<br />true when it's possible to apply sink on list item <br /> extend by [HeadingBridge](./BridgeExtensions#headingbridge)

#### canUndo

`boolean`
<br />true when it's possible to apply undo on the doc history stack <br /> extend by [HistoryBridge](./BridgeExtensions#historybridge)

#### canRedo

`boolean`
<br />true when it's possible to apply redo on the doc history stack <br /> extend by [HistoryBridge](./BridgeExtensions#historybridge)

#### activeColor

`string | undefined`
<br />undefined when no heading apply, string of the color that active on the selection position <br /> extend by [ColorBridge](./BridgeExtensions#colorbridge)

#### activeHighlight

`string | undefined`
<br />undefined when no heading apply, string of the highlight that active on the selection position <br /> extend by [HighlightBridge](./BridgeExtensions#highlightbridge)

#### isLinkActive

`boolean`
<br />true when the cursor is where a link <br /> extend by [LinkBridge](./BridgeExtensions#linkbridge)

#### canSetLink

`boolean`
<br />true when it's possible to add link, for example when there is no selection it not possible <br /> extend by [LinkBridge](./BridgeExtensions#linkbridge)

#### activeLink

`string | undefined`
<br />undefined when no heading apply, string of the link that active on the selection position <br /> extend by [LinkBridge](./BridgeExtensions#linkbridge)

### useBridgeState

a react hook to subscribe to changes on the BridgeState, get EditorBridge
