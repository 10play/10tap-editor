---
sidebar_position: 7
---

# DarkMode

In this example we will implement darkmode in the editor. This is similar to setting up [custom css](./customCss.md).

Dark mode has two parts:

- the native side (toolbar, link bar, [color keyboard](./colorKeyboard.md), WebView background), styled by the `theme` option;
- the web side (the document inside the WebView), styled with CSS.

## Adding Dark Theme

To use the built-in dark theme on the native side, pass `darkEditorTheme`:

```tsx
const editor = useEditorBridge({
  theme: darkEditorTheme,
});
```

`darkEditorTheme` includes a dark toolbar and a dark `colorKeyboard` theme (`darkColorKeyboardTheme`), so the ColorKeyboard follows too.

Now we just need to update the web-side css with `configureCSS`:

```tsx
import {
  CoreBridge,
  darkEditorCss,
  darkEditorTheme,
  TenTapStartKit,
  useEditorBridge,
} from '@10play/tentap-editor';

const editor = useEditorBridge({
  bridgeExtensions: [
    ...TenTapStartKit,
    CoreBridge.configureCSS(darkEditorCss), // <--- Add our dark mode css
  ],
  theme: darkEditorTheme, // <-- Add our dark mode theme
});
```

## Following the system appearance

`theme` is read on every render, so it can follow `useColorScheme()`. Bridges, and the CSS configured on them, are read once when the editor is created. To switch the web-side CSS at runtime, inject it with [injectCSS](../api/EditorBridge.md#injectcss) under its own tag:

```tsx
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import {
  darkEditorCss,
  darkEditorTheme,
  defaultEditorTheme,
  RichText,
  useEditorBridge,
} from '@10play/tentap-editor';

export const ThemedEditor = () => {
  const dark = useColorScheme() === 'dark';
  const editor = useEditorBridge({
    theme: dark ? darkEditorTheme : defaultEditorTheme,
  });

  useEffect(() => {
    // An empty string clears the stylesheet with this tag.
    editor.injectCSS(dark ? darkEditorCss : '', 'dark-mode');
  }, [dark, editor]);

  return <RichText editor={editor} />;
};
```

`injectCSS` calls made before the editor has loaded are queued, and the stylesheet is applied again if the WebView reloads. Alternatively, remount the screen with a `key` when the scheme changes and pick the bridges for that scheme, as the [`example-expo`](https://github.com/10play/10tap-editor/tree/main/example-expo) app does.

## Customizing

To change the colors, pass a partial theme; it is deep-merged into the default theme. See [Custom Theme](./customTheme.md), including the [color keyboard theme](./customTheme.md#color-keyboard-theme).
