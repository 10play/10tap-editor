---
sidebar_position: 1
---

# Main Concept

`EditorBridge` - the react native way to control the webview editor, will extend by bridgeExtensions

`bridgeExtension` - a plug able typed class that help to communicate between the native part and the webview part

Working with this lib split to 2 main usages: [simple](./mainConcepts#simple-usage) and [advance](./mainConcepts#advance-usage), simple should be good enough for most of the cases, we tried to make the API as simple as we can so ppl will be able to plug that lib fast and play, advance usage require advance setup.

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

For that usage you will be use the pre-built editor bundle we build that include all of [these](https://10play.dev) bridgeExtensions

With tentap you can also control the scheme of your editor by passing the useBridgeEditor list of bridgeExtensions you want, so in case you build a chat app and you dont want to let users underline you should not pass the Underline bridgeExtension, that will make sure that even if the user will copy paste some text with underline it will paste it without

Custom keyboards - we believe that custom keyboard can be huge improvements for your editing exp, custom keyboard let you switch the keyboard with your react native view, that can be helpfull in case you want to take advange of the room the keyboard takes, see [color keyboard example](https://10play.dev) and [clean tool bar example](https://10play.dev)

## Advance usage

In case you want to add your own tiptap extension / build your own bridgeExtension you will have to bundle the web editor by your own that way you will get full control of what running inside the webview.

In this case we provide utils/components/hooks that can help you customize the editor but still get all the features and exp fixes tentap can offer.

See the [advance setup](https://10play.dev)

See the advance section on examples for more details
