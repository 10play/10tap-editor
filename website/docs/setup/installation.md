---
sidebar_position: 1
pagination_next: examples/basic
---

# Installation

## React Native

1. `yarn add @10play/tentap-editor react-native-webview`
2. `cd ios && pod install`

## Expo

`npx expo install @10play/tentap-editor react-native-webview`  
Only basic usage without custom keyboard is supported by Expo Go (see [basic example](../examples/basic.md)).  
Otherwise you will need to setup [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/).

Now you ready to add tentap to your app!

:::note
On Android, API level 29+ is required.
:::

### Expo Web

For expo-web support follow this [guide](./expoWeb)
