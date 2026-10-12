---
sidebar_position: 2
---

# Keyboard and caret

This page shows the screen layout that keeps the toolbar on top of the keyboard and the line being typed above the toolbar, on iOS and Android, with or without a navigation header, on edge-to-edge Android and with custom keyboards.

## Recommended layout

Wrap the editor and the toolbar in an `EditorKeyboardAvoidingView`:

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  EditorKeyboardAvoidingView,
  RichText,
  Toolbar,
  useEditorBridge,
} from '@10play/tentap-editor';

export const Editor = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: '<p>Start editing!</p>',
  });

  return (
    <SafeAreaView style={styles.fullScreen}>
      <EditorKeyboardAvoidingView style={styles.fullScreen}>
        <View style={styles.fullScreen}>
          <RichText editor={editor} />
        </View>
        <View style={styles.toolbarRow}>
          <Toolbar editor={editor} />
        </View>
      </EditorKeyboardAvoidingView>
    </SafeAreaView>
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

[EditorKeyboardAvoidingView](../api/CustomKeyboardUtils.md#editorkeyboardavoidingview) measures where it ends in the window and pads its bottom by the part of it that the keyboard covers. The editor gets shorter, and the toolbar sits right on the keyboard:

- **No `keyboardVerticalOffset`.** It works below a navigation header, above a tab bar and inside a `SafeAreaView`, because it measures its real position instead of relying on an offset.
- **Edge-to-edge Android.** This is the default in Expo SDK 53+, and for apps targeting SDK 35+ on Android 15+. The keyboard there also covers the navigation bar, and React Native's keyboard height leaves that out. `EditorKeyboardAvoidingView` measures against the top of the keyboard, so the toolbar isn't partly hidden. This also works without the native module (Expo Go).
- **`adjustResize`.** When the window already shrinks for the keyboard, it adds no padding.
- **Custom keyboards.** The padding stays the same while you switch between the system keyboard and a [custom keyboard](../examples/customKeyboard.md), so the toolbar doesn't move.

The `Toolbar` shows itself while the editor is focused and a keyboard is up. Pass `hidden` to control this yourself.

The same layout works below a `react-navigation` header with no changes; see [Navigation header](../examples/navHeader.md).

### The 1.0 layout

The layout from the 1.0 docs still works: a React Native `KeyboardAvoidingView` with `behavior="padding"`, absolutely positioned at the bottom of the screen, around the `Toolbar`. It needs a `keyboardVerticalOffset` below a header. On edge-to-edge Android it can leave the toolbar partly behind the keyboard. You can switch to `EditorKeyboardAvoidingView` without other changes, and it accepts the same absolute style:

```tsx
<EditorKeyboardAvoidingView
  style={{ position: 'absolute', width: '100%', bottom: 0 }}
>
  <Toolbar editor={editor} />
</EditorKeyboardAvoidingView>;
```

## Keeping the caret visible

You don't need any `paddingBottom` for the caret. While a keyboard is up, `RichText` measures how far the keyboard and the toolbar on it reach into the editor. It then keeps the line being typed about one line above the toolbar, also when the keyboard grows (an emoji or suggestion bar), after an image is inserted, after a keyboard switch, and in an editor that ends above the keyboard. See [avoidIosKeyboard](../api/useEditorBridge.md#avoidioskeyboard) for the details.

- **Your own toolbar.** If you draw your own toolbar on the keyboard, mark it with [useKeyboardAccessory](../api/CustomKeyboardUtils.md#usekeyboardaccessory) so its height is measured exactly. The library's `Toolbar` does this itself.
- **Other views over the editor.** For views that `RichText` can't measure, such as a floating button over the bottom of the editor, keep extra space below the caret with [scrollBottomOffset](../api/useEditorBridge.md#scrollbottomoffset):

  ```tsx
  const editor = useEditorBridge({ scrollBottomOffset: 60 });
  ```

- **`updateScrollThresholdAndMargin`** still works, but `RichText` overwrites the value when the keyboard opens or closes. Use `scrollBottomOffset` for a value that has to stay.

## Editor inside a ScrollView

A [dynamicHeight](../api/useEditorBridge.md#dynamicheight) editor grows with its content and doesn't scroll itself. Use [useScrollToCaret](../api/CustomKeyboardUtils.md#usescrolltocaret) so that your `ScrollView` keeps the caret above the keyboard. See [Editor inside a ScrollView](../examples/scrollView.md).

## Android window modes

| Window | What happens |
| --- | --- |
| Edge-to-edge (Expo SDK 53+; `targetSdk` 35+ on Android 15+) | The window never resizes. `EditorKeyboardAvoidingView` pads for the keyboard and the navigation bar under it. |
| `adjustResize` (React Native's default without edge-to-edge) | The window shrinks for the system keyboard, and `EditorKeyboardAvoidingView` adds no padding for it. While switching to a custom keyboard, the toolbar can move for a moment; see [keeping the toolbar still](../examples/customKeyboard.md#android-keeping-the-toolbar-still). |
| `adjustNothing` / `androidKeyboardMode="stable"` | The keyboard covers the window, as on iOS. |

## Reading the keyboard state

[useKeyboard](../api/CustomKeyboardUtils.md#usekeyboard) returns whether a keyboard (system or custom) is up, its height, how far it covers the window (`keyboardCoverHeight`) and where its top is (`keyboardTop`). Use it to build your own keyboard-aware views.
