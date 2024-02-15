---
sidebar_position: 1
---

# useEditorBridge

a react hook that will return [EditorBridge](./EditorBridge)

#### bridgeExtensions

`BridgeExtension[]`  
<u>default</u>: `undefined`<br />
A list of BridgeExtensions that will be add to the editor on the native side

#### initialContent

`string`  
<u>default</u>: `undefined`<br />
initial content that will be loaded first on the editor

#### autofocus

`boolean`  
<u>default</u>: `false`<br />
when true the editor will auto focus

#### avoidIosKeyboard

`boolean`  
<u>default</u>: `false`<br />
On iOS help to handle follow cursor when the editor is fullpage and the iOS keyboard hide the bottom part

#### theme

`EditorTheme`
<u>default</u>: `defaultEditorTheme` (light theme)<br />
this prop can be used to customize the libs components see the [theme example](../examples/customTheme.md)

#### customSource

`string`  
<u>default</u>: `SimpleEditorBundleString`<br />
prop that can help for advance usage, an HTML string that will replace the default simple editor

#### DEV

`boolean`  
<u>default</u>: `false`<br />
prop that can help for advance usage, when true editor will be loaded by DEV_SERVER_URL

#### DEV_SERVER_URL

`string`  
<u>default</u>: `http://localhost:3000`<br />
prop that can help for advance usage, a url string that point to the editor dev server
