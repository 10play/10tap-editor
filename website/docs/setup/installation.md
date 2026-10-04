---
sidebar_position: 1
pagination_next: examples/basic
---

# Installation

## React Native

1. `yarn add @10play/tentap-editor react-native-webview`
2. `cd ios && pod install`

The package contains a small native module (`TenTapKeyboard`) used by [custom keyboards](../examples/customKeyboard.md). It is autolinked, so after installing or upgrading, rebuild your app (`pod install` on iOS, a new Gradle build on Android). The editor itself does not depend on the native module: if it is missing, everything except the native keyboard driver keeps working.

## Expo

`npx expo install @10play/tentap-editor react-native-webview`

- **Expo Go:** the editor works. Custom keyboards fall back to a JavaScript-only driver because Expo Go cannot load the native module (see [Expo Go and the fallback driver](../examples/customKeyboard.md#expo-go-and-the-fallback-driver)).
- **Dev client / prebuild:** everything works, including the native keyboard driver. No config plugin is needed; run `npx expo prebuild` (or rebuild your dev client) after upgrading. See [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/).

The [advanced setup](./advancedSetup.md) also needs a dev client.

Now you ready to add tentap to your app!

:::note
On Android, API level 29+ is required.
:::

## Requirements

| | Supported |
| --- | --- |
| React Native | JavaScript: any version supported by `react-native-webview`. Native module: **0.74 or newer**, old and new architecture (bridge and bridgeless). |
| Expo | SDK 51 or newer for dev clients and prebuild. Expo Go is supported with the keyboard fallback. |
| react-native-webview | 13.7 or newer. Use **13.13.3 or newer** on the new architecture if the editor is inside a `ScrollView` (see [Editor inside a ScrollView](../examples/scrollView.md)). |
| iOS | 15.1 or newer (or your app's `min_ios_version_supported`) |

`peerDependencies` are declared as `*`, so installation never fails on version ranges. On React Native 0.73 and older the JavaScript part still works, but the Android native module does not compile because it needs `BaseReactPackage` (added in 0.74). Stay on 1.0.x if you cannot upgrade React Native.

### Expo Web

For expo-web support follow this [guide](./expoWeb.md)
