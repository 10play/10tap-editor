# TenTap

React Native Rich Text Editor based on Tiptap

![demo](./website/static/img/tmpRM.png)

# Docs and Examples

[Click Here For Full Documentation](https://10play.github.io/10tap-editor/docs/intro.html)

# Installation

## React Native

1. `yarn add @10play/tentap-editor react-native-webview`
2. `cd ios && pod install`

## Expo

`npx expo install @10play/tentap-editor react-native-webview`  
Only basic usage without custom keyboard is supported by Expo Go (see [basic example](../examples/basic.md)).  
Otherwise you will need to setup [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/).

Now you ready to add tentap to your app!

## Usage

```tsx
export const Basic = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <RichText editor={editor} />
      </View>
    </SafeAreaView>
  );
};
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
