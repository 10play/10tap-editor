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

`string`  
<u>default</u>: `undefined`<br />
initial content that will be loaded first on the editor

#### autofocus

`boolean`  
<u>default</u>: `false`<br />
when true the editor will auto focus

#### avoidIosKeyboard `IOS ONLY`

`boolean`  
<u>default</u>: `false`<br />
This helps us keep the cursor right above the keyboard when the editor is full-screen and the virtual keyboard hides the bottom portion of the editor.

#### theme

`EditorTheme`  
<u>default</u>: `defaultEditorTheme` <i>(light theme)</i><br />
this prop can be used to customize default styles, see [theme example](../examples/customTheme.md)

#### customSource

`string`  
<u>default</u>: `SimpleEditorBundleString`<br />
used in advance setup, an HTML string that will replace the default simple editor

#### DEV

`boolean`  
<u>default</u>: `false`<br />
prop used in advance setup, when true the webview will load DEV_SERVER_URL instead of the html string

#### DEV_SERVER_URL

`string`  
<u>default</u>: `http://localhost:3000`<br />
prop used in advanced setup, a url string that points to the editor dev server
