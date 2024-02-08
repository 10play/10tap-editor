---
sidebar_position: 3
---

# Configure Extensions

In this example we will configure some extensions. Each bridge comes with the `configureExtension` function, that configures it's underline tiptap extension.

## Configuring Placeholder and Link

First we can check which options are available to extend on the tiptap docs.
In our case let's extent the placeholder to show custom text, and the link extension to not open links when clicking them

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
