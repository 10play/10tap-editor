---
sidebar_position: 6
---

# Built-in BridgeExtensions

tentap includes several bridge extensions out of the box. This page lists all of them along with their relevant configurations, which can be set using `BridgeExtension.configureExtension`.

## Core Extensions

| Extension     | Uses                                                                                  | Description                              | Configuration |
| ------------- | ------------------------------------------------------------------------------------- | ---------------------------------------- | ------------- |
| CoreExtension | `@tiptap/extension-document`, `@tiptap/extension-paragraph`, `@tiptap/extension-text` | Fundamental logic for editor interaction | N/A           |

## Text Formatting Extensions

| Extension        | Uses                           | Configuration                                                                       |
| ---------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| BlockquoteBridge | `@tiptap/extension-blockquote` | [Blockquote settings](https://tiptap.dev/docs/editor/api/nodes/blockquote#settings) |
| CodeBridge       | `@tiptap/extension-code`       | [Code settings](https://tiptap.dev/docs/editor/api/marks/code#settings)             |
| ItalicBridge     | `@tiptap/extension-italic`     | [Italic settings](https://tiptap.dev/docs/editor/api/marks/italic#settings)         |
| BoldBridge       | `@tiptap/extension-bold`       | [Bold settings](https://tiptap.dev/docs/editor/api/marks/bold#settings)             |
| StrikeBridge     | `@tiptap/extension-strike`     | [Strike settings](https://tiptap.dev/docs/editor/api/marks/strike#settings)         |
| UnderlineBridge  | `@tiptap/extension-underline`  | [Underline settings](https://tiptap.dev/docs/editor/api/marks/underline#settings)   |

## List Extensions

| Extension         | Uses                                                            | Configuration                                                                           |
| ----------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| BulletListBridge  | `@tiptap/extension-bullet-list`, `@tiptap/extension-list-item`  | [Bullet list settings](https://tiptap.dev/docs/editor/api/nodes/bullet-list#settings)   |
| OrderedListBridge | `@tiptap/extension-ordered-list`, `@tiptap/extension-list-item` | [Ordered list settings](https://tiptap.dev/docs/editor/api/nodes/ordered-list#settings) |
| TaskListBridge    | `@tiptap/extension-task-list`, `@tiptap/extension-list-item`    | [Task list settings](https://tiptap.dev/docs/editor/api/nodes/task-list#settings)       |
| ListItemBridge    | `@tiptap/extension-list-item`                                   | [List item settings](https://tiptap.dev/docs/editor/api/nodes/list-item#settings)       |

## Other Extensions

| Extension         | Uses                                                          | Configuration                                                                              |
| ----------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| HeadingBridge     | `@tiptap/extension-heading`                                   | [Heading settings](https://tiptap.dev/docs/editor/api/nodes/heading#settings)              |
| HistoryBridge     | `@tiptap/extension-history`                                   | [History settings](https://tiptap.dev/docs/editor/api/extensions/history#settings)         |
| ColorBridge       | `@tiptap/extension-color`, `@tiptap/extension-text-style`     | No relevant configuration                                                                  |
| HighlightBridge   | `@tiptap/extension-highlight`, `@tiptap/extension-text-style` | No relevant configuration                                                                  |
| ImageBridge       | `@tiptap/extension-image`                                     | [Image settings](https://tiptap.dev/docs/editor/api/nodes/image#settings)                  |
| LinkBridge        | `@tiptap/extension-link`                                      | [Link settings](https://tiptap.dev/docs/editor/api/marks/link#settings)                    |
| PlaceholderBridge | `@tiptap/extension-placeholder`                               | [Placeholder settings](https://tiptap.dev/docs/editor/api/extensions/placeholder#settings) |
| DropCursorBridge  | `@tiptap/extension-dropcursor`                                | [Dropcursor settings](https://tiptap.dev/docs/editor/api/extensions/dropcursor#settings)   |

Note: Use ListItemBridge only if you need to control lift/sink of lists. Otherwise, OrderedListBridge/BulletListBridge are sufficient.
