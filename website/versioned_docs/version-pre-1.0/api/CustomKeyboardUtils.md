---
sidebar_position: 5
---

# Custom Keyboard Utils

We believe that custom keyboard can be a game changer when it comes to editing experience, that's why we decided that this ability should be part of this lib, in this page we will show the APIs of the custom keyboard utils.
For examples please see: [Create custom keyboard](../examples/customKeyboard) or [Using the ColorKeyboard](../examples/colorKeyboard)

### CustomKeyboard

A react component that need to render so we will register the custom keyboard and show them properly

#### rootRef

`React.RefObject<any>`
Important for iOS where ref of some View is needed for keyboard manipulation

#### keyboards

`CustomKeyboardExtension[]`
list of [CustomKeyboardExtension's](#customkeyboardextension)

#### setActiveKeyboardID

`(id: string | undefined) => void`
a function that changes or unsets the active keyboard

#### activeKeyboardID

`string`
the active custom keyboard id

#### editor

`EditorBridge`
the editors `EditorBridge` instance

#### rootBackground - `IOS ONLY`

The background of the `RCTRootView` used to render the custom keyboard
This is helpful when you are using a custom theme

### CustomKeyboardExtension

A class that will register a new component with the customkeyboard id

> <strong>It's important to note that the custom keyboard component does not work as a regular react component in your app, and is rendered on IOS in a separate RCTRootView.</strong>

#### id

`string`
a unique key for the custom keyboard

#### comp

`ComponentType<any>`
The custom keyboard component
