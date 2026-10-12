---
sidebar_position: 1
pagination_next: setup/keyboard
---

# Installation

## React Native

```bash
yarn add @10play/tentap-editor react-native-webview
cd ios && pod install
```

Then rebuild your app (`yarn ios` / `yarn android`).

The package contains a small native module (`TenTapKeyboard`) used by [custom keyboards](../examples/customKeyboard.md). It is autolinked: `pod install` adds it on iOS and Gradle picks it up on Android, with no changes to your native code. The editor itself doesn't depend on it. If it is missing, for example in a build made before you installed the package, everything keeps working and custom keyboards use a JavaScript fallback driver.

After upgrading the package, run `pod install` again and rebuild, so the native module matches the JavaScript.

## Expo

```bash
npx expo install @10play/tentap-editor react-native-webview
```

- **Development build / prebuild (recommended):** everything works, including the native keyboard driver. No config plugin is needed. Rebuild your [development build](https://docs.expo.dev/develop/development-builds/introduction/) (`npx expo run:ios`, `npx expo run:android`, or EAS) after installing or upgrading. If you commit the native folders, run `npx expo prebuild` again.
- **Expo Go:** the editor works. Expo Go can't load the native module, so custom keyboards use the JavaScript fallback driver automatically (see [Expo Go and the fallback driver](../examples/customKeyboard.md#expo-go-and-the-fallback-driver)). Expo Go also ships its own react-native-webview version, so test [an editor inside a ScrollView](../examples/scrollView.md) in a development build.

The [advanced setup](./advancedSetup.md) also needs a development build.

Now you're ready to add tentap to your app! Continue with [Keyboard and caret](./keyboard.md) for the screen layout, or jump to the [basic example](../examples/basic.md).

## Requirements

| | Supported |
| --- | --- |
| React Native | JavaScript: any version supported by `react-native-webview`. Native module: **0.74 or newer**, old and new architecture (bridge and bridgeless). |
| Expo | SDK 51 or newer for development builds and prebuild. Expo Go is supported with the keyboard fallback. |
| react-native-webview | 13.7 or newer. Use **13.13.3 or newer** on the new architecture if the editor is inside a `ScrollView` (see [Editor inside a ScrollView](../examples/scrollView.md)). |
| iOS | 15.1 or newer (or your app's `min_ios_version_supported`) |
| Android | The library builds with `minSdkVersion` 24. The editor is tested on Android 10 (API level 29) and newer, which we recommend as your minimum. `androidKeyboardMode="stable"` needs Android 11 (API level 30). |

The React Native 0.74 floor is documented here and isn't enforced by the package. The Android native module needs `BaseReactPackage` (added in React Native 0.74) and doesn't compile on older versions. The peer dependencies (`react`, `react-native`, `react-native-webview`) are all `*`, as in 1.0, so your package manager won't warn you. Stay on 1.0.x if you can't upgrade React Native.

The TipTap packages, `@tiptap/react`, `react-dom` and `lodash` are regular dependencies and are installed for you. If your app also targets the web or builds a [custom editor bundle](./advancedSetup.md), keep a `react-dom` that matches your `react` in your own `package.json`.

## Example apps

The repository has two example apps:

- [`example/`](https://github.com/10play/10tap-editor/tree/main/example): React Native CLI (React Native 0.81), built on both the new and the old architecture. It has every example in these docs, including the advanced setup.
- [`example-expo/`](https://github.com/10play/10tap-editor/tree/main/example-expo): Expo with a development build. It also runs on the web.

### Expo Web

For expo-web support follow this [guide](./expoWeb.md)
