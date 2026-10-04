---
sidebar_position: 8
---

# Custom Theme

In this example we will add a custom theme

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
    webview: {
      backgroundColor: '#1C1C1E',
    },
    webviewContainer: {},
  },
});
```

The theme you pass is deep-merged into the default theme, so you only need to set the keys you change.

## Color keyboard theme

The [ColorKeyboard](./colorKeyboard.md) is styled by the `colorKeyboard` key:

```tsx
useEditorBridge({
  theme: {
    colorKeyboard: {
      keyboardRootColor: 'white', // background of the keyboard area
      colorSelection: [
        // Custom colors in color keyboard
        {
          name: 'Custom Color',
          value: '#E5112B',
          displayColor: '#E5112B', // Optional - the color that will be displayed on ui (if left empty will default to use value)
        },
      ],
      // Check the ColorKeyboardTheme type for all options
    },
  },
});
```

`colorSelection` and `highlightSelection` **replace** the default lists instead of being merged with them, so the example above shows a single color. `colorKeyboard` is optional on `EditorTheme`; when it's missing, the default color keyboard theme is used. `darkEditorTheme` includes a dark color keyboard theme.

The `Color` and `ColorKeyboardTheme` types are exported from `@10play/tentap-editor`.
