---
sidebar_position: 6
---

# Built-in BridgeExtensions

tentap comes with multiple bridges extensions out of the box, in this page we will show all of them and show their relevant configurations, which can be configured with `BridgeExtension.configureExtension`:

### CoreExtension

uses `@tiptap/extension-document` `@tiptap/extension-paragraph` `@tiptap/extension-text`

This bridge extension includes fundamental logic that is needed to interact with the editor

### BlockquoteBridge

uses `@tiptap/extension-blockquote`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/blockquote#settings

### CodeBridge

uses `@tiptap/extension-code`
relevant configuration: https://tiptap.dev/docs/editor/api/marks/code#settings

### ItalicBridge

uses `@tiptap/extension-italic`
relevant configuration: https://tiptap.dev/docs/editor/api/marks/italic#settings

### BoldBridge

uses `@tiptap/extension-bold`
relevant configuration: https://tiptap.dev/docs/editor/api/marks/bold#settings

### StrikeBridge

uses `@tiptap/extension-strike`
relevant configuration: https://tiptap.dev/docs/editor/api/marks/strike#settings

### BulletListBridge

uses `@tiptap/extension-bullet-list` `@tiptap/extension-list-item`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/bullet-list#settings

### OrderedListBridge

uses `@tiptap/extension-ordered-list` `@tiptap/extension-list-item`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/ordered-list#settings

### HeadingBridge

uses `@tiptap/extension-heading`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/heading#settings

### ListItemBridge

You can use only OrderedListBridge/BulletListBridge for lists, use ListItemBridge in case you want to control lift/sink of lists
uses `@tiptap/extension-list-item`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/list-item#settings

### HistoryBridge

uses `@tiptap/extension-history`
relevant configuration: https://tiptap.dev/docs/editor/api/extensions/history#settings

### ColorBridge

uses `@tiptap/extension-color` `@tiptap/extension-text-style`
no relevant configuration

### HighlightBridge

uses `@tiptap/extension-highlight` `@tiptap/extension-text-style`
no relevant configuration

### ImageBridge

uses `@tiptap/extension-image`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/image#settings

### LinkBridge

uses `@tiptap/extension-link`
relevant configuration: https://tiptap.dev/docs/editor/api/marks/link#settings

### TaskListBridge

uses `@tiptap/extension-task-list` `@tiptap/extension-list-item`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/task-list#settings

### UnderlineBridge

uses `@tiptap/extension-underline`
relevant configuration: https://tiptap.dev/docs/editor/api/marks/underline#settings

### PlaceholderBridge

uses `@tiptap/extension-placeholder`
relevant configuration: https://tiptap.dev/docs/editor/api/extensions/placeholder#settings

### DropCursorBridge

uses `@tiptap/extension-dropcursor`
relevant configuration: https://tiptap.dev/docs/editor/api/extensions/dropcursor#settings
