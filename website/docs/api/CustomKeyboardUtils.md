---
sidebar_position: 5
---

# Custom Keyboard Utils

We believe that custom keyboard can be a game changer when it comes to editing experience, that's why we decided that this ability should be part of this lib, in this page we will show the APIs of the custom keyboard utils.
For examples and better guide please see: [Create custom keyboard](https://10play.dev) or [Using the ColorKeyboard](../examples/colorKeyboard)

### CustomKeyboard

A react component that need to render so we will register the custom keyboard and show them properly

#### rootRef

`React.RefObject<any>`
Important for iOS where ref of some View is needed for keyboard manipulation

#### keyboards

`CustomKeyboardExtension[]`
list of CustomKeyboardExtension

#### setActiveKeyboardID

`(id: string | undefined) => void`
Needed so the keyboard will be able to close itself

#### activeKeyboardID

`string`
The active custom keyboard id

#### editor

`EditorBridge`
Needed so when you close custom keyboard we can focus the editor again

### CustomKeyboardExtension

A js class that will register new app with the customkeyboard id - it's important to understand that it will be a septate app so state management and other will not work on the custom component as you expected,

#### id

`string`
a unique key for the custom keyboard

#### comp

`ComponentType<any>`
The custom keyboard react native view
