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
    colorKeyboard: {
      keyboardRootColor: 'white', // IOS only the background color of rootView of the custom keyboard
      colorSelection: [
        // Custom colors in color keyboard
        {
          name: 'Custom Color',
          value: '#E5112B',
          displayColor: '#E5112B', // Optional - the color that will be displayed on ui (if left empty will default to use value)
        },
      ],
      // Check KeyboardTheme type for all options
    },
    webview: {
      backgroundColor: '#1C1C1E',
    },
    webviewContainer: {},
  },
});
```
