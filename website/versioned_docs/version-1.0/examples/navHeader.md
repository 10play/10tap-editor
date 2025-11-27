---
sidebar_position: 5
---

# IOS Keyboard Avoiding Toolbar with Navigation Header

In this example we will be making the toolbar on IOS be exactly over the keyboard when using `react-navigation`'s header.
If we were to just use the avoiding view like in our [basic example](./basic.md) then the toolbar would be under the keyboard.
We can fix this by adding the [keyboardVerticalOffset](https://reactnative.dev/docs/keyboardavoidingview#keyboardverticaloffset) to our `KeyboardAvoidingView`.
The `keyboardVerticalOffset` needs to be the top area inset + the headers height which on IOS is 38.

Additionally, we need to add `paddingBottom` to the RichText container (on iOS only) to prevent text from going under the toolbar when typing.

```tsx
const HEADER_HEIGHT = 38; // IOS Only

const { top } = useSafeAreaInsets();
const keyboardVerticalOffset = HEADER_HEIGHT + top;
...
...
...
<View style={exampleStyles.contentContainer}>
  <RichText editor={editor} />
</View>
<KeyboardAvoidingView
  behavior={'padding'}
  style={exampleStyles.keyboardAvoidingView}
  keyboardVerticalOffset={Platform.OS === 'ios' ? keyboardVerticalOffset : undefined}
>
  <Toolbar editor={editor} />
</KeyboardAvoidingView>
...
...
...
const exampleStyles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? HEADER_HEIGHT : 0,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});
```
