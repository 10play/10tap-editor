---
sidebar_position: 3
---

# BridgeState

The BridgeState represents the latest state of the editor webview on the native side. It's extendable by BridgeExtensions and is typically used with [useBridgeState](#usebridgestate).

The following properties are available when using `TenTapStarterkit` or all the BridgeExtensions exported by the library. Each property specifies which BridgeExtension adds it.

## Core Properties

| Property  | Type                           | Description                          | Extended By                                    |
| --------- | ------------------------------ | ------------------------------------ | ---------------------------------------------- |
| editable  | `boolean`                      | Indicates if the editor is editable  | [CoreBridge](./BridgeExtensions#coreextension) |
| selection | `{ from: number; to: number }` | The current selection in the editor  | [CoreBridge](./BridgeExtensions#coreextension) |
| isFocused | `boolean`                      | True when the editor is focused      | [CoreBridge](./BridgeExtensions#coreextension) |
| isReady   | `boolean`                      | True when the editor is fully loaded | [CoreBridge](./BridgeExtensions#coreextension) |

## Formatting Properties

| Property            | Type      | Description                                          | Extended By                                             |
| ------------------- | --------- | ---------------------------------------------------- | ------------------------------------------------------- |
| isBlockquoteActive  | `boolean` | True when the cursor is in an active blockquote      | [BlockquoteBridge](./BridgeExtensions#blockquotebridge) |
| canToggleBlockquote | `boolean` | True when it's possible to toggle blockquote         | [BlockquoteBridge](./BridgeExtensions#blockquotebridge) |
| isCodeActive        | `boolean` | True when the cursor is in active code               | [CodeBridge](./BridgeExtensions#codebridge)             |
| canToggleCode       | `boolean` | True when it's possible to toggle code               | [CodeBridge](./BridgeExtensions#codebridge)             |
| isBoldActive        | `boolean` | True when the cursor is in active bold text          | [BoldBridge](./BridgeExtensions#boldbridge)             |
| canToggleBold       | `boolean` | True when it's possible to toggle bold               | [BoldBridge](./BridgeExtensions#boldbridge)             |
| isItalicActive      | `boolean` | True when the cursor is in active italic text        | [ItalicBridge](./BridgeExtensions#italicbridge)         |
| canToggleItalic     | `boolean` | True when it's possible to toggle italic             | [ItalicBridge](./BridgeExtensions#italicbridge)         |
| isUnderlineActive   | `boolean` | True when the cursor is in active underlined text    | [UnderlineBridge](./BridgeExtensions#underlinebridge)   |
| canToggleUnderline  | `boolean` | True when it's possible to toggle underline          | [UnderlineBridge](./BridgeExtensions#underlinebridge)   |
| isStrikeActive      | `boolean` | True when the cursor is in active strikethrough text | [StrikeBridge](./BridgeExtensions#strikebridge)         |
| canToggleStrike     | `boolean` | True when it's possible to toggle strikethrough      | [StrikeBridge](./BridgeExtensions#strikebridge)         |

## List Properties

| Property             | Type      | Description                                       | Extended By                                               |
| -------------------- | --------- | ------------------------------------------------- | --------------------------------------------------------- |
| isBulletListActive   | `boolean` | True when the cursor is in an active bullet list  | [BulletListBridge](./BridgeExtensions#bulletlistbridge)   |
| canToggleBulletList  | `boolean` | True when it's possible to toggle bullet list     | [BulletListBridge](./BridgeExtensions#bulletlistbridge)   |
| isOrderedListActive  | `boolean` | True when the cursor is in an active ordered list | [OrderedListBridge](./BridgeExtensions#orderedlistbridge) |
| canToggleOrderedList | `boolean` | True when it's possible to toggle ordered list    | [OrderedListBridge](./BridgeExtensions#orderedlistbridge) |
| isTaskListActive     | `boolean` | True when the cursor is in an active task list    | [TaskListBridge](./BridgeExtensions#tasklistbridge)       |
| canToggleTaskList    | `boolean` | True when it's possible to toggle task list       | [TaskListBridge](./BridgeExtensions#tasklistbridge)       |
| canLift              | `boolean` | True when it's possible to lift a list item       | [ListItemBridge](./BridgeExtensions#listitembridge)       |
| canSink              | `boolean` | True when it's possible to sink a list item       | [ListItemBridge](./BridgeExtensions#listitembridge)       |

## Heading Properties

| Property         | Type                  | Description                                              | Extended By                                       |
| ---------------- | --------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| headingLevel     | `number \| undefined` | The current heading level, or undefined if not a heading | [HeadingBridge](./BridgeExtensions#headingbridge) |
| canToggleHeading | `boolean`             | True when it's possible to toggle heading                | [HeadingBridge](./BridgeExtensions#headingbridge) |

## History Properties

| Property | Type      | Description                     | Extended By                                       |
| -------- | --------- | ------------------------------- | ------------------------------------------------- |
| canUndo  | `boolean` | True when it's possible to undo | [HistoryBridge](./BridgeExtensions#historybridge) |
| canRedo  | `boolean` | True when it's possible to redo | [HistoryBridge](./BridgeExtensions#historybridge) |

## Color and Highlight Properties

| Property        | Type                  | Description                                                         | Extended By                                           |
| --------------- | --------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| activeColor     | `string \| undefined` | The active text color, or undefined if no color is applied          | [ColorBridge](./BridgeExtensions#colorbridge)         |
| activeHighlight | `string \| undefined` | The active highlight color, or undefined if no highlight is applied | [HighlightBridge](./BridgeExtensions#highlightbridge) |

## Link Properties

| Property     | Type                  | Description                                            | Extended By                                 |
| ------------ | --------------------- | ------------------------------------------------------ | ------------------------------------------- |
| isLinkActive | `boolean`             | True when a link is in the selection                   | [LinkBridge](./BridgeExtensions#linkbridge) |
| canSetLink   | `boolean`             | True when it's possible to add a link                  | [LinkBridge](./BridgeExtensions#linkbridge) |
| activeLink   | `string \| undefined` | The active link URL, or undefined if no link is active | [LinkBridge](./BridgeExtensions#linkbridge) |

## useBridgeState

`useBridgeState` is a React hook used to subscribe to changes in the BridgeState. It provides access to the EditorBridge.
