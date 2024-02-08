---
sidebar_position: 2
---

# Using The ColorKeyboard

In this example we will add the ColorKeyboard, and a custom button to toggle it in the Toolbar

## Adding CustomKeyboard Component

First we need to add two things

1. A ref on the components container (used on ios for opening the custom keyboard)
2. A current keyboard state (used inside the toolbar to show and hide the color keyboard)

```tsx
const rootRef = useRef(null);
const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

return (
  <SafeAreaView style={exampleStyles.fullScreen} ref={rootRef}>
  ...
```

Then, into our `KeyboardingViewView` we want to add the `CustomKeyboard` component

```tsx
<KeyboardAvoidingView
  ...
>
  <Toolbar
    ...
  />
  <CustomKeyboard
    rootRef={rootRef}
    activeKeyboardID={activeKeyboard}
    setActiveKeyboardID={setActiveKeyboard}
    keyboards={[ColorKeyboard]} // <-- here we add the color keyboard
    editor={editor}
  />
</KeyboardAvoidingView>
```

## Adding Custom Toolbar

Now that we have added the custom keyboard, we need to add a button to the toolbar so we can access
First, we will create a new component `ToolbarWithColor`.
Then we need to add some additional code to help us know when to show and hide the toolbar
when the native keyboard is closed but our color keyboard is visible.
And finally we need add a custom button to the keyboard to toggle the color keyboard

```tsx
interface ToolbarWithColorProps {
  editor: EditorBridge;
  activeKeyboard: string | undefined;
  setActiveKeyboard: (id: string | undefined) => void;
}
const ToolbarWithColor = ({
  editor,
  activeKeyboard,
  setActiveKeyboard,
}: ToolbarWithColorProps) => {
  // Get updates of editor state
  const editorState = useBridgeState(editor);

  const { isKeyboardUp: isNativeKeyboardUp } = useKeyboard();
  const customKeyboardOpen = activeKeyboard !== undefined;
  const isKeyboardUp = isNativeKeyboardUp || customKeyboardOpen;

  // Here we make sure not to hide the keyboard if our custom keyboard is visible
  const hideToolbar =
    !isKeyboardUp || (!editorState.isFocused && !customKeyboardOpen);

  return (
    <Toolbar
      editor={editor}
      hidden={hideToolbar}
      items={[
        {
          onPress: () => () => {
            const isActive = activeKeyboard === ColorKeyboard.id;
            if (isActive) editor.focus();
            setActiveKeyboard(isActive ? undefined : ColorKeyboard.id);
          },
          active: () => activeKeyboard === ColorKeyboard.id,
          disabled: () => false,
          image: () => Images.platte,
        },
        ...DEFAULT_TOOLBAR_ITEMS,
      ]}
    />
  );
};
```

Then all that is left to replace `Toolbar` with our new `ToolbarWithColor` and we're done!
