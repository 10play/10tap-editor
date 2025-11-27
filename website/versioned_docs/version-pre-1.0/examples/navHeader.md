---
sidebar_position: 5
---

# IOS Keyboard Avoiding Toolbar with Navigation Header

In this example we will be making the toolbar on IOS be exactly over the keyboard when using `react-navigation`'s header.
If we were to just use the avoiding view like in our [basic example](./basic.md) then the toolbar would be under the keyboard.
We can fix this by adding the [keyboardVerticalOffset](https://reactnative.dev/docs/keyboardavoidingview#keyboardverticaloffset) to our `KeyboardAvoidingView`.
The `keyboardVerticalOffset` needs to be the top area inset + the headers height which on IOS is 44 on portrait and 32 on landscape.

```tsx
const { top } = useSafeAreaInsets();
const { width, height } = useWindowDimensions();
const isLandscape = width > height;
const headerHeight = isLandscape ? 32 : 44;
const keyboardVerticalOffset = headerHeight + top;
...
...
...
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={exampleStyles.keyboardAvoidingView}
  keyboardVerticalOffset={keyboardVerticalOffset} // <--- add this
>
  <Toolbar editor={editor} />
</KeyboardAvoidingView>
```
