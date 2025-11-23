---
sidebar_position: 3
---

# BridgeState

The BridgeState is the latest state of the editor webview on the native side, it's extendable by BridgeExtensions and is generally used with [useBridgeState](#usebridgestate)

The list above is the interface of BridgeState in case you use `TenTapStarterkit` or using all the BridgeExtensions the lib exports, on each prop we specify what bridgeExtension adds it

### BridgeState properties

#### editable

`boolean`
<br />Is the editor editable or not <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### empty

`boolean`
<br />Is the editor empty or not <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### selection

`{ from: number; to: number }`
<br />The selection on the editor-web <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### isFocused

`boolean`
<br />true when the editor is focused <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### isReady

`boolean`
<br />true when the editor is fully loaded <br /> extended by [CoreBridge](./BridgeExtensions#coreextension)

#### isBlockquoteActive

`boolean`
<br />true when the cursor is where blockquote is active <br /> extended by [BlockquoteBridge](./BridgeExtensions#blockquotebridge)

#### canToggleBlockquote

`boolean`
<br />true when it's possible to toggle blockquote <br /> extended by [BlockquoteBridge](./BridgeExtensions#blockquotebridge)

#### isCodeActive

`boolean`
<br />true when the cursor is where code is active <br /> extended by [CodeBridge](./BridgeExtensions#codebridge)

#### canToggleCode

`boolean`
<br />true when it's possible to toggle code <br /> extended by [CodeBridge](./BridgeExtensions#codebridge)

#### isBoldActive

`boolean`
<br />true when the cursor is where bold is active <br /> extended by [BoldBridge](./BridgeExtensions#boldbridge)

#### canToggleBold

`boolean`
<br />true when it's possible to toggle bold <br /> extended by [BoldBridge](./BridgeExtensions#boldbridge)

#### isItalicActive

`boolean`
<br />true when the cursor is where italic is active <br /> extended by [ItalicBridge](./BridgeExtensions#italicbridge)

#### canToggleItalic

`boolean`
<br />true when it's possible to toggle italic <br /> extended by [ItalicBridge](./BridgeExtensions#italicbridge)

#### isUnderlineActive

`boolean`
<br />true when the cursor is where underline is active <br /> extended by [UnderlineBridge](./BridgeExtensions#underlinebridge)

#### canToggleUnderline

`boolean`
<br />true when it's possible to toggle underline <br /> extended by [UnderlineBridge](./BridgeExtensions#underlinebridge)

#### isStrikeActive

`boolean`
<br />true when the cursor is where Strike is active <br /> extended by [StrikeBridge](./BridgeExtensions#strikebridge)

#### canToggleStrike

`boolean`
<br />true when it's possible to toggle Strike <br /> extended by [StrikeBridge](./BridgeExtensions#strikebridge)

#### isBulletListActive

`boolean`
<br />true when the cursor is where bullet list is active <br /> extended by [BulletListBridge](./BridgeExtensions#bulletlistbridge)

#### canToggleBulletList

`boolean`
<br />true when it's possible to toggle bullet list <br /> extended by [BulletListBridge](./BridgeExtensions#bulletlistbridge)

#### isOrderedListActive

`boolean`
<br />true when the cursor is where ordered list is active <br /> extended by [OrderedListBridge](./BridgeExtensions#orderedlistbridge)

#### canToggleOrderedList

`boolean`
<br />true when it's possible to toggle ordered list <br /> extended by [OrderedListBridge](./BridgeExtensions#orderedlistbridge)

#### isTaskListActive

`boolean`
<br />true when the cursor is where task list is active <br /> extended by [TaskListBridge](./BridgeExtensions#tasklistbridge)

#### canToggleTaskList

`boolean`
<br />true when it's possible to toggle task list <br /> extended by [TaskListBridge](./BridgeExtensions#tasklistbridge)

#### headingLevel

`number | undefined`
<br />undefined when no heading is applied, number of the heading level <br /> extended by [HeadingBridge](./BridgeExtensions#headingbridge)

#### canToggleHeading

`boolean`
<br />true when it's possible to toggle heading <br /> extended by [HeadingBridge](./BridgeExtensions#headingbridge)

#### canLift

`boolean`
<br />true when it's possible to lift list item <br /> extended by [ListItemBridge](./BridgeExtensions#listitembridge)

#### canSink

`boolean`
<br />true when it's possible to sink a list item <br /> extended by [ListItemBridge](./BridgeExtensions#listitembridge)

#### canUndo

`boolean`
<br />true when it's possible to undo the doc history stack <br /> extended by [HistoryBridge](./BridgeExtensions#historybridge)

#### canRedo

`boolean`
<br />true when it's possible to redo the doc history stack <br /> extended by [HistoryBridge](./BridgeExtensions#historybridge)

#### activeColor

`string | undefined`
<br />undefined when no color is applied, string of the color that is active on the selection <br /> extended by [ColorBridge](./BridgeExtensions#colorbridge)

#### activeHighlight

`string | undefined`
<br />undefined when no highlight is applied, string of the highlight that active on the selection <br /> extended by [HighlightBridge](./BridgeExtensions#highlightbridge)

#### isLinkActive

`boolean`
<br />true when the link is in the selection <br /> extended by [LinkBridge](./BridgeExtensions#linkbridge)

#### canSetLink

`boolean`
<br />true when it's possible to add link, for example when there is no selection it not possible <br /> extended by [LinkBridge](./BridgeExtensions#linkbridge)

#### activeLink

`string | undefined`
<br />undefined when there is no link, string of the link that active on the selection position <br /> extended by [LinkBridge](./BridgeExtensions#linkbridge)

### useBridgeState

a react hook to subscribe to changes on the BridgeState, get EditorBridge
