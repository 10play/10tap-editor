---
sidebar_position: 7
---

# Custom Theme - DarkMode

In this example we will implement darkmode in the editor. This is similar to setting up [custom css](./customCss.md).
We support custom themes for all of our exported components: `RichText`, `Toolbar`, `ColorKeyboard`.
There are two ways we can customize the theme:

1. The `theme` prop `useEditorBridge`
2. Customizing the RichText css with `extendCss`

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

## Adding Custom Theme

We can also provide a custom theme

```tsx
useEditorBridge({
    theme: {
        toolbar: {
           toolbarBody: {
             borderTopColor: '#C6C6C6B3',
             borderBottomColor: '#C6C6C6B3',
             backgroundColor: '#474747',
           },
           // Check the ToolbarTheme type for all options
        },
        colorKeyboard: {
            keyboardRootColor: 'white' // IOS only the background color of rootView of the custom keyboard
            colorSelection: [
            // Custom colors in color keyboard
              {
                name: 'Custom Color',
                value: '#E5112B',
              },
            ],
            // Check KeyboardTheme type for all options
        },
        richText: {
            style: {
                backgroundColor: 'black'
            },
          // Check RichTextTheme type for all options
        },
    }
})
```
