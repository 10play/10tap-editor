---
sidebar_position: 1
---

# useEditorBridge

A React hook that returns an [EditorBridge](./EditorBridge) instance.

## Parameters

| Parameter             | Type                | Default                    | Description                                                                                                                                                                                                |
| --------------------- | ------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bridgeExtensions      | `BridgeExtension[]` | `undefined`                | A list of BridgeExtensions to be added to the editor on the native side.                                                                                                                                   |
| initialContent        | `string \| json`    | `undefined`                | Initial content to be loaded first in the editor.                                                                                                                                                          |
| autofocus             | `boolean`           | `false`                    | When true, the editor will auto-focus.                                                                                                                                                                     |
| avoidIosKeyboard      | `boolean`           | `false`                    | **(iOS only)** Helps keep the cursor above the keyboard when the editor is full-screen and the virtual keyboard hides the bottom portion.                                                                  |
| dynamicHeight         | `boolean`           | `false`                    | When true, the editor's webview will maintain the same height as the content.                                                                                                                              |
| disableColorHighlight | `boolean`           | `undefined`                | When true, the selection highlight will be off. When false, it will be on. On Android, this is off by default. [See issue #184](https://github.com/10play/10tap-editor/issues/184#issuecomment-2304826219) |
| theme                 | `EditorTheme`       | `defaultEditorTheme`       | Customizes default styles. See [theme example](../examples/customTheme.md).                                                                                                                                |
| editable              | `boolean`           | `true`                     | When set to false, the editor will be read-only.                                                                                                                                                           |
| customSource          | `string`            | `SimpleEditorBundleString` | Used in advanced setup. An HTML string that replaces the default simple editor.                                                                                                                            |
| onChange              | `() => void`        | `undefined`                | Callback triggered when editor content changes.                                                                                                                                                            |
| DEV                   | `boolean`           | `false`                    | Used in advanced setup. When true, the webview will load DEV_SERVER_URL instead of the HTML string.                                                                                                        |
| DEV_SERVER_URL        | `string`            | `'http://localhost:3000'`  | Used in advanced setup. URL pointing to the editor dev server.                                                                                                                                             |

## Usage Notes

### onChange Callback

The `onChange` callback is called each time the editor's content changes. Within this function, you can call:

- `editor.getHTML()`
- `editor.getJSON()`
- `editor.getText()`

to retrieve the content. The content is not directly provided to reduce traffic between the webview and native. It's recommended to request the content in a debounced function rather than on each change.

### Advanced Setup

The `customSource`, `DEV`, and `DEV_SERVER_URL` parameters are used in advanced setups. They allow for custom HTML content and development server configurations.
