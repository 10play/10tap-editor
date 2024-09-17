---
sidebar_position: 5
---

# Custom Keyboard Utils

Custom keyboards can significantly enhance the editing experience. This page outlines the APIs for custom keyboard utilities.

For practical examples, see:

- [Create custom keyboard](../examples/customKeyboard)
- [Using the ColorKeyboard](../examples/colorKeyboard)

## CustomKeyboard Component

A React component used to register and display custom keyboards.

| Prop                | Type                                | Description                                                                                        |
| ------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| rootRef             | `React.RefObject<any>`              | Reference to a View, crucial for iOS keyboard manipulation                                         |
| keyboards           | `CustomKeyboardExtension[]`         | List of [CustomKeyboardExtension](#customkeyboardextension) instances                              |
| setActiveKeyboardID | `(id: string \| undefined) => void` | Function to change or unset the active keyboard                                                    |
| activeKeyboardID    | `string`                            | ID of the currently active custom keyboard                                                         |
| editor              | `EditorBridge`                      | Instance of the editor's `EditorBridge`                                                            |
| rootBackground      | `string`                            | (iOS only) Background of the `RCTRootView` rendering the custom keyboard. Useful for custom themes |

## CustomKeyboardExtension

A class for registering new components with a custom keyboard ID.

**Note:** The custom keyboard component is rendered in a separate `RCTRootView` on iOS and doesn't function as a regular React component in your app.

| Property | Type                 | Description                               |
| -------- | -------------------- | ----------------------------------------- |
| id       | `string`             | Unique identifier for the custom keyboard |
| comp     | `ComponentType<any>` | The custom keyboard component             |
