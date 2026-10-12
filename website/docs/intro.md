---
sidebar_position: 1
---

# 10tap-editor

<img src="/10tap-editor/img/cover.webp" alt="cover" />

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

See [Installation](./setup/installation.md#requirements) for the supported React Native versions.

## Why?

After years of developing rich text editors for mobile, we realized that there is an empty void for open source RichText editors on mobile especially for ReactNative. So we have decided to create this package that incorporates all that we have learned, and that provides the best possible ux. Tentap is designed for getting the best experience of editing rich-text on mobile inspired by state of the art mobile editors like: gdocs, notion, dropbox paper.

## Installation

```bash
yarn add @10play/tentap-editor react-native-webview
cd ios && pod install
```

With Expo: `npx expo install @10play/tentap-editor react-native-webview`. The editor works in Expo Go; for the native custom keyboard driver use a [development build](https://docs.expo.dev/develop/development-builds/introduction/).

See [Installation](./setup/installation.md) for the details and the supported versions. Upgrading from an older version? See the [1.1 migration guide](./migrations/v1.1.md).

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

`EditorKeyboardAvoidingView` keeps the toolbar on top of the keyboard without a `keyboardVerticalOffset`, also on edge-to-edge Android. See [Keyboard and caret](./setup/keyboard.md).

## Example apps

The repository has two example apps you can run:

- [`example/`](https://github.com/10play/10tap-editor/tree/main/example): a React Native CLI app (React Native 0.81, new and old architecture) with every example in these docs, including custom keyboards, dynamic height, a navigation header and the [advanced setup](./setup/advancedSetup.md).
- [`example-expo/`](https://github.com/10play/10tap-editor/tree/main/example-expo): an Expo app (development build) with the basic editor, dynamic height, custom keyboards in both layouts and two editors on one screen, in light and dark mode. It also runs on the web.

Questions? Check the [FAQ](./faq.md).

## Contributing

See the [contributing guide](https://github.com/10play/10tap-editor/blob/main/CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
