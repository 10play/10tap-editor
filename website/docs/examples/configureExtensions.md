---
sidebar_position: 3
---

# Configuring and Extending Extensions

In this example we will configure some extensions. Each bridge comes with the `configureExtension` function, that configures it's underline tiptap extension.
For full list of available configurations for each bridge please see [BridgeExtensions](../api/BridgeExtensions.md).

## Configuring Placeholder and Link

First we can check which options are available to extend on the tiptap docs. Links to them are available [here](../api/BridgeExtensions.md)
In our case let's extend the placeholder to show custom text, and the link extension to not open links when clicking them

```tsx
const editor = useEditorBridge({
    bridgeExtensions: [
        ...,
        PlaceholderBridge.configureExtension({
          placeholder: 'Type something...',
        }),
        LinkBridge.configureExtension({ openOnClick: false }),
    ],
  });
```

## Extending Extension and updating Document Schema

We can also extend the main `tiptapExtension` of each bridge with `extendExtension`.
Let's say we want to update the Document extension of the CoreBridge to mandate a `heading` as the first node:

We could do

```tsx
CoreBridge.extendExtension({ content: 'heading block+' });
```

Now the Document extension will be configured to have a heading node first followed by one or many "blocks"
