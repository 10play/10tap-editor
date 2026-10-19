# React native rich text editor 10tap

<img src="./website/static/img/cover.webp" alt="cover" />
<a href="https://github.com/10play/10tap-editor/blob/main/LICENSE">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"/>
</a>
  <a href="https://www.npmjs.com/package/@10play/tentap-editor">
  <img src="https://img.shields.io/npm/v/@10play/tentap-editor.svg" alt="npm"/>
</a>

TenTap is a typed, easy to use, customizable, and extendable Rich Text editor for React-Native based on Tiptap and Prosemirror. It offers a "plug and play" experience and comes with many essential features out of the box that can be incorporated into your apps quickly. Additionally, TenTap allows you the developers to tailor the editor to your applications specific needs.

# Features

- 💁 Based on tiptap
- ➕ Extendable
- ⚙️ Support dynamic scheme
- 🛠️ Native toolbar
- 🎹 Custom keyboards
- 💅 Customizable styles
- 🌒 Darkmode and custom theme support
- 🏗️ Supports the new architecture (including bridgeless) and the old architecture

## Why?

After years of developing rich text editors for mobile, we realized that there is an empty void for open source RichText editors on mobile especially for ReactNative. So we have decided to create this package that incorporates all that we have learned, and that provides the best possible ux. Tentap is designed for getting the best experience of editing rich-text on mobile inspired by state of the art mobile editors like: gdocs, notion, dropbox paper.

# Docs and Examples

[Click Here For Full Documentation](https://10play.github.io/10tap-editor/docs/intro.html)

# Installation

## React Native

1. `yarn add @10play/tentap-editor react-native-webview`
2. `cd ios && pod install`

The package includes a small native module (`TenTapKeyboard`) used by custom keyboards. It is autolinked, so you only need to rebuild your app after installing or upgrading. The editor itself works without it.

## Expo

`npx expo install @10play/tentap-editor react-native-webview`

- **Dev client / prebuild:** everything works, including the native keyboard driver. No config plugin is needed; rebuild your [development build](https://docs.expo.dev/develop/development-builds/introduction/) after installing or upgrading. The advanced setup also needs a dev client.
- **Expo Go:** the editor works, and custom keyboards use a JavaScript fallback (see [Expo Go and the fallback driver](https://10play.github.io/10tap-editor/docs/examples/customKeyboard#expo-go-and-the-fallback-driver)).

### Requirements

react-native-webview 13.7+. The native module needs React Native 0.74+ (Expo SDK 51+), old or new architecture. The `react-native` peer dependency is `*`, so this isn't checked on install. See [requirements](https://10play.github.io/10tap-editor/docs/setup/installation#requirements).

### Expo Web

TenTap supports expo web!
See setup [here](https://10play.github.io/10tap-editor/docs/setup/expoWeb)

## Usage

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

export const Basic = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: 'Start editing!',
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
  fullScreen: { flex: 1 },
  toolbarRow: { flexDirection: 'row' },
});
```

`EditorKeyboardAvoidingView` keeps the toolbar on top of the keyboard without a `keyboardVerticalOffset`, also on edge-to-edge Android. See [Keyboard and caret](https://10play.github.io/10tap-editor/docs/setup/keyboard).

## Examples

- [`example/`](example): a React Native CLI app (React Native 0.81, new and old architecture) with every example, including custom keyboards, dynamic height and the advanced setup.
- [`example-expo/`](example-expo): an Expo app (development build) with the basic editor, dynamic height, custom keyboards and two editors on one screen. It also runs on the web.

Common questions (lists in `react-native-render-html`, reading content in `onChange`, fonts, inline images, the editor inside a `ScrollView`) are answered in the [FAQ](https://10play.github.io/10tap-editor/docs/faq).

## Upgrading

- From 1.0 or 0.7.x to 1.1: see the [1.1 migration guide](https://10play.github.io/10tap-editor/docs/migrations/v1.1) and the [changelog](CHANGELOG.md).

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
