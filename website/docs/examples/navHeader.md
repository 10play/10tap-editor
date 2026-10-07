---
sidebar_position: 5
---

# Keyboard Avoiding Toolbar with Navigation Header

Below a `react-navigation` header, a `KeyboardAvoidingView` needs a `keyboardVerticalOffset` equal to the header height plus the top inset, and that height changes between platforms and OS versions. A hard-coded value leaves the toolbar partly behind the keyboard.

`EditorKeyboardAvoidingView` does not need the offset. It measures where it ends in the window and pads its bottom by the part of it the keyboard covers, system or custom, including the navigation bar an edge-to-edge Android keyboard also covers, so it works below any header and above a tab bar:

```tsx
import {
  EditorKeyboardAvoidingView,
  RichText,
  Toolbar,
  useEditorBridge,
} from '@10play/tentap-editor';

export const NavigationHeader = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
  });

  return (
    <EditorKeyboardAvoidingView style={styles.fullScreen}>
      <View style={styles.fullScreen}>
        <RichText editor={editor} />
      </View>
      <View style={styles.toolbarRow}>
        <Toolbar editor={editor} />
      </View>
    </EditorKeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  // The toolbar's default flex: 1 would share the column with the editor;
  // in a row it only fills the width.
  toolbarRow: {
    flexDirection: 'row',
  },
});
```

The editor keeps the line being typed about a line above the toolbar on its own: `RichText` measures how far the keyboard and the `Toolbar` reach into it, so no `paddingBottom` is needed.

If you keep React Native's `KeyboardAvoidingView`, take the offset from the navigator instead of a constant, for example `useHeaderHeight()` from `@react-navigation/elements`.
