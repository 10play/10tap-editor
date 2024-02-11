---
sidebar_position: 8
---

# Built-in BridgeExtensions

tentap is coming with multiple bridges extensions out of the box, in this page we will show all of them and show how they can be configured by use `BridgeExtension.configureExtension`:

### CoreExtension

use `@tiptap/extension-document` `@tiptap/extension-paragraph` `@tiptap/extension-text`

This bridge extension is including fundamentals logic that needed to interact with the editor

### BlockquoteBridge

use `@tiptap/extension-blockquote`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/blockquote#settings

### CodeBridge

use `@tiptap/extension-code`
relevant configuration: https://tiptap.dev/docs/editor/api/marks/code#settings

### ItalicBridge

use `@tiptap/extension-italic`
relevant configuration: https://tiptap.dev/docs/editor/api/marks/italic#settings

### StrikeBridge

use `@tiptap/extension-strike`
relevant configuration: https://tiptap.dev/docs/editor/api/marks/strike#settings

### BulletListBridge

use `@tiptap/extension-bullet-list` `@tiptap/extension-list-item`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/bullet-list#settings

### OrderedListBridge

use `@tiptap/extension-ordered-list` `@tiptap/extension-list-item`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/ordered-list#settings

### HeadingBridge

use `@tiptap/extension-heading`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/heading#settings

### ListItemBridge

Basically you can use only OrderedListBridge/BulletListBridge for lists, use ListItemBridge in case you want to control lift/sink of lists
use `@tiptap/extension-list-item`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/list-item#settings

### HistoryBridge

use `@tiptap/extension-history`
relevant configuration: https://tiptap.dev/docs/editor/api/extensions/history#settings

### ColorBridge

use `@tiptap/extension-color` `@tiptap/extension-text-style`

### ImageBridge

use `@tiptap/extension-image`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/image#settings

### LinkBridge

use `@tiptap/extension-link`
relevant configuration: https://tiptap.dev/docs/editor/api/marks/link#settings

### TaskListBridge

use `@tiptap/extension-task-list` `@tiptap/extension-list-item`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/task-list#settings

### UnderlineBridge

use `@tiptap/extension-underline`
relevant configuration: https://tiptap.dev/docs/editor/api/marks/underline#settings
