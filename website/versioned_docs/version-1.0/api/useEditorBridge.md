---
sidebar_position: 1
---

# useEditorBridge

a react hook that will return [EditorBridge](./EditorBridge)

#### bridgeExtensions

`BridgeExtension[]`  
<u>default</u>: `undefined`<br />
A list of BridgeExtensions that will be added to the editor on the native side

#### initialContent

`string | json`  
<u>default</u>: `undefined`<br />
initial content that will be loaded first on the editor

#### autofocus

`boolean`  
<u>default</u>: `false`<br />
when true the editor will auto focus

#### avoidIosKeyboard

`boolean`
<u>default</u>: `false`<br />
This helps keep the cursor visible above the keyboard when the editor is full-screen and the virtual keyboard hides the bottom portion of the editor.

When enabled, the editor automatically:
- Adds bottom padding to the document equal to the keyboard height
- Adjusts ProseMirror's scroll threshold and margin so the cursor stays visible
- Removes the padding when the keyboard is dismissed

**Note:** This option works on both iOS and Android, despite the name. On Android, it uses a fixed toolbar height for calculations.

#### dynamicHeight

`boolean`  
<u>default</u>: `false`<br />
when true the editor's webview will keep the same height as the content height

#### disableColorHighlight

`boolean`  
<u>default</u>: `undefined`<br />
when true the selection highlight will be off and when false will be on, on android this will be off by default, please see:
https://github.com/10play/10tap-editor/issues/184#issuecomment-2304826219

#### theme

`EditorTheme`  
<u>default</u>: `defaultEditorTheme` <i>(light theme)</i><br />
this prop can be used to customize default styles, see [theme example](../examples/customTheme.md)

#### editable

`boolean`
<u>default</u>: `true`<br />
When set to false the editor will be `readonly`

#### customSource

`string`  
<u>default</u>: `SimpleEditorBundleString`<br />
used in advance setup, an HTML string that will replace the default simple editor

#### onChange

`() => void`
you can assign a callback that will be called each time the editors content has changed. Inside this function you can call
`editor.getHTML`, `editor.getJSON` or `editor.getText` to get the content. The content is not directly provided as to not
create allot of traffic between the webview and native. It is recommended to request the content in some debounced function
and not each change.

#### DEV

`boolean`  
<u>default</u>: `false`<br />
prop used in advance setup, when true the webview will load DEV_SERVER_URL instead of the html string

#### DEV_SERVER_URL

`string`  
<u>default</u>: `http://localhost:3000`<br />
prop used in advanced setup, a url string that points to the editor dev server
