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

uses `BulletList` and `ListItem` from `@tiptap/extension-list`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/bullet-list#settings

### OrderedListBridge

uses `OrderedList` and `ListItem` from `@tiptap/extension-list`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/ordered-list#settings

### HeadingBridge

uses `@tiptap/extension-heading`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/heading#settings

### ListItemBridge

You can use only OrderedListBridge/BulletListBridge for lists, use ListItemBridge in case you want to control lift/sink of lists
uses `ListItem` from `@tiptap/extension-list`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/list-item#settings

List items always contain a paragraph, so `getHTML()` returns `<li><p>…</p></li>`. See [Rendering editor HTML](../examples/renderHtml.md).

### HistoryBridge

uses `UndoRedo` from `@tiptap/extensions` (TipTap v3 renamed the History extension to UndoRedo)
relevant configuration: https://tiptap.dev/docs/editor/api/extensions/history#settings

Since 1.0 the bridge's name is `undoRedo`. The bridge config is also sent under the old name `history`, so custom editor bundles built against 0.7.x still receive it. If you look a bridge up by name, for example `TenTapStartKit.filter((b) => b.name !== 'history')`, use `'undoRedo'`.

### ColorBridge

uses `@tiptap/extension-color` `@tiptap/extension-text-style`
no relevant configuration

### HighlightBridge

uses `@tiptap/extension-highlight` `@tiptap/extension-text-style`
no relevant configuration

### ImageBridge

uses `@tiptap/extension-image`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/image#settings

Images are **block** nodes by default, so an `<img>` inside a `<p>` is moved out of the paragraph when content is loaded. To keep images inline:

```tsx
const editor = useEditorBridge({
  bridgeExtensions: [
    ...TenTapStartKit,
    ImageBridge.configureExtension({ inline: true }),
  ],
});
```

Attributes the image schema doesn't know, like `style` or `width`, are dropped when content is parsed. Add them with `ImageBridge.extendExtension` if you need them. When styling images with CSS, scope the rules as `img:not(.ProseMirror-separator)`: ProseMirror adds a hidden separator `<img>` after inline nodes at the end of a line.

### LinkBridge

uses `@tiptap/extension-link`, pre-configured with `{ openOnClick: false, autolink: true }`
relevant configuration: https://tiptap.dev/docs/editor/api/marks/link#settings

When a link is set from the toolbar or with `setLink`, a URL without a scheme gets `https://` added, so `www.google.com` becomes `https://www.google.com` instead of a relative link. A plain email address such as `support@acme.com` becomes a `mailto:` link. URLs that already have a scheme (`http:`, `https:`, `mailto:`, `tel:`, app schemes) and relative or anchor links (`/path`, `#section`, `?query`) are kept as they are. To use another default, configure `defaultProtocol`:

```tsx
LinkBridge.configureExtension({ openOnClick: false, autolink: true, defaultProtocol: 'http' });
```

### TaskListBridge

uses `TaskList` and `TaskItem` from `@tiptap/extension-list`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/task-list#settings

### UnderlineBridge

uses `@tiptap/extension-underline`
relevant configuration: https://tiptap.dev/docs/editor/api/marks/underline#settings

### PlaceholderBridge

uses `Placeholder` from `@tiptap/extensions`
relevant configuration: https://tiptap.dev/docs/editor/api/extensions/placeholder#settings

### DropCursorBridge

uses `Dropcursor` from `@tiptap/extensions`
relevant configuration: https://tiptap.dev/docs/editor/api/extensions/dropcursor#settings

### HardBreakBridge

uses `@tiptap/extension-hard-break`
relevant configuration: https://tiptap.dev/docs/editor/api/nodes/hard-break#settings

## Writing your own bridge

See the [advanced setup](../setup/advancedSetup.md) for building a bridge with its own TipTap extension. `extendEditorInstance` receives the same five arguments as in 1.0, plus an optional sixth `context` argument (type `BridgeContext`). It gives your bridge the same message queue the built-in bridges use, so commands sent before the editor is ready aren't lost:

```ts
extendEditorInstance: (sendBridgeMessage, webviewRef, editorState, setEditorState, platform, context) => ({
  myCommand: () => sendBridgeMessage({ type: 'my-command' }),
  myQuery: () => context?.rpc<string>({ type: 'my-query' }),
}),
```

`context.rpc` adds a `messageId` to the message payload and resolves with the `content` of the first reply whose `payload.messageId` matches, so the web side of your bridge answers with `sendMessageBack({ type: 'my-query-back', payload: { content, messageId } })`.

`context.supports(capability)` tells you whether the editor bundle in the WebView supports a feature, which is useful when your app may run against a custom bundle built with an older version. The 1.1 web editor advertises `'insertContent'`, `'selectedText'`, `'parseOptions'`, `'styles'`, `'containerHeight'` and `'inputMode'`; a bundle built with 1.0 or older advertises none. Until the editor is ready, `supports` returns `false`. `rpc` takes an optional second argument: with `{ capability }` it rejects with `TentapUnsupportedError` when the bundle lacks that capability (this is how `getSelectedText` handles older bundles), and `timeoutMs`, which overrides [rpcTimeoutMs](./useEditorBridge.md#rpctimeoutms) for that call. The `BridgeContext`, `RpcOptions`, `SendOptions`, `Capabilities` and `CapabilityName` types are exported from `@10play/tentap-editor`.
