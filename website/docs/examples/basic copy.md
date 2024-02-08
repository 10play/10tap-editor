---
sidebar_position: 2
---

# Basic example

In this example we will be creating a basic editor that contains all of the pre-built bridgeExtensions, custom styling, custom keyboard and a keyboard aware toolbar. [Jump To Full Example](#full-example)

## Creating The Editor Bridge

The first thing we want to do is create our [EditorBridge](../api/EditorBridge.md) add link to editor bridge.
To do this we will use the `useEditorBridge` hook in our component. This by default will contain the `TenTapStartKit` (#TODO show link)
Now we have added all of the pre-built bridgeExtensions provided by tentap, and our editor will support all of these bridgeExtensions features

```tsx
const editor = useEditorBridge();
```

This is the same ass passing

```tsx
const editor = useEditorBridge({
  bridgeExtensions: TenTapStarterKit,
});
```

## Adding the RichText component

Now we will add our RichText component, this is simply a WebView that runs a pre-built tiptap bundle with some extensions, that is then communicated with via our bridgeExtensions

The RichText component receives the EditorBridge we created before

```tsx
<SafeAreaView style={exampleStyles.fullScreen}>
  <RichText editor={editor} />
</SafeAreaView>
```

## Adding a KeyboardAware Toolbar and ColorKeyboard

Our RichText is pretty empty without a toolbar, so let's add it

In order to use the built-in toolbar and custom keyboard we need to create:

1. A ref on the components container (used on ios for opening the custom keyboard)
2. A current keyboard state (used inside the toolbar to show and hide the color keyboard)

We will also wrap the entire the toolbar and keyboard in a `KeyboardAvoidingView` to display the toolbar right above the keyboard

```tsx
const rootRef = useRef(null);
const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

return (
  <SafeAreaView style={exampleStyles.fullScreen} ref={rootRef}>
    ...
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={exampleStyles.keyboardAvoidingView}
    >
      <Toolbar
        activeKeyboard={activeKeyboard}
        setActiveKeyboard={setActiveKeyboard}
        editor={editor}
        hidden={false}
      />
      <CustomKeyboard
        rootRef={rootRef}
        activeKeyboardID={activeKeyboard}
        setActiveKeyboardID={setActiveKeyboard}
        keyboards={[ColorKeyboard]}
        editor={editor}
      />
    </KeyboardAvoidingView>
  </SafeAreaView>
);
```

## Adding Custom CSS and Fonts

Let's add a custom font to our Editor (we can also add custom css)

So first we will define our custom css:

```ts
const customFont = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap');
  * {
      font-family: 'Roboto', sans-serif;
  }
`;
```

Now we can override a bridgeExtensions css with the `configureCSS` function. First we need to add the `CoreBridge`, this bridge's css is reserved for custom extensions.
And then all we have to do is configure it.

```tsx
const editor = useEditorBridge({
  bridgeExtensions: [
    // If we want to add custom css - we can configure it here on the core bridge
    CoreBridge.configureCSS(customFont),
    ...TenTapStartKit,
  ],
});
```

And that is it!

## Configuring Placeholder and Link

Let's also configure the PlaceholderBridge and LinkBridge
We can do this with the `configureExtension` function on each Bridge. This can be used to configure any of the TipTaps Extension options

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

## Full Example

```tsx
const exampleStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});

const customFont = `
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap');
* {
  font-family: 'Roboto', sans-serif;
}
`;

const initialContent = `<p>This is a basic <a href="https://google.com">example</a> of implementing images.</p><img src="https://source.unsplash.com/8xznAGy4HcY/800x400" /><p>s</p>`;

export const BasicExample = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
    bridgeExtensions: [
      // Here we define all the bridgeExtensions that we want to use
      CoreBridge.configureCSS(customFont), // If we want to add custom css - we can configure it here on the core bridge
      TenTapStartKit,
      UnderlineBridge,
      ImageBridge,
      TaskListBridge,
      PlaceholderBridge.configureExtension({
        placeholder: 'Type something...',
      }),
      LinkBridge.configureExtension({ openOnClick: false }),
      ColorBridge,
      HighlightBridge,
    ],
  });

  const rootRef = useRef(null);
  const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

  return (
    <SafeAreaView style={exampleStyles.fullScreen} ref={rootRef}>
      <View style={exampleStyles.fullScreen}>
        <RichText editor={editor} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={exampleStyles.keyboardAvoidingView}
      >
        <Toolbar
          activeKeyboard={activeKeyboard}
          setActiveKeyboard={setActiveKeyboard}
          editor={editor}
        />
        <CustomKeyboard
          rootRef={rootRef}
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
          keyboards={[ColorKeyboard]}
          editor={editor}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
```
