---
sidebar_position: 1
---

# Main Concept

`EditorBridge` - a bridge to control the editor from the native side - will be extended by `bridgeExtensions`

`bridgeExtension` - a typed class that helps us communicate between the native part and the webview part

There are two different ways to work with this lib: [simple](./mainConcepts#simple-usage) and [advanced](./mainConcepts#advanced-usage), simple should be good enough for most of the cases, we tried to make the API as simple as possible so people will be able to plug and play, on the other hand advanced usage requires a longer setup.

## Simple usage

With the simple usage you get all the standard rich text abilities as you can get from other libs like:

[react-native-pell-rich-editor](https://www.npmjs.com/package/react-native-pell-rich-editor) /
[react-native-cn-quill](https://github.com/imnapo/react-native-cn-quill)

- ordered / bullet / check Lists
- Bold/Italic/Underline
- Placeholder
- Image
- color/highlight
- and more...

With the simple usage you have all of [these](./api/BridgeExtensions) bridgeExtensions available.

With tentap you can also control the scheme of your editor by passing the useBridgeEditor list of bridgeExtensions you want, so in case you build a chat app and you don't want to let users underline you should not pass the Underline bridgeExtension, that will make sure that even if the user will copy paste some text with underline, when pasted the underline will not be parsed.

## Advanced usage

In case you want to add your own tiptap extension / build your own bridgeExtension you will have to bundle the web editor by your own that way you will get full control of what running inside the webview.

In this case we provide utils/components/hooks that can help you customize the editor but still get all the features and exp fixes tentap can offer.

See the [advanced setup](./setup/advancedSetup)

You can also see an example in `./examplelatest/src/Examples/Advanced`
