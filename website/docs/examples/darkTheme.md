---
sidebar_position: 7
---

# DarkMode

In this example we will implement darkmode in the editor. This is similar to setting up [custom css](./customCss.md).

## Adding Dark Theme

To customize the native theme you can use the `theme` prop on `useEditorBridge`

If we simply want to add the existing dark mode theme you can just do

```tsx
import { ..., darkEditorTheme } from '@10play/tentap-editor';
useEditorBridge({
   theme: darkEditorTheme
});
```

Now we just need to update the web-side css with `extendCss`

```tsx
const darkEditorCss = `
  * {
    background-color: #1C1C1E;
    color: white;
  }
`;
useEditorBridge({
    ...
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(darkEditorCss), // <--- Add our dark mode css
    ],
    theme: darkEditorTheme,
});
```
