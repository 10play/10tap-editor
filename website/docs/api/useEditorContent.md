---
sidebar_position: 1
---

# useEditorContent

The useEditorContent hook is designed to efficiently retrieve the content. It monitors changes to the editor's content, and reduces unnecessary data exchanges between web and native, optimizing performance and minimizing message traffic.

#### editor

`EditorBridge` (<u>required</u>)  
A list of BridgeExtensions that will be add to the editor on the native side

### options

#### type

`EditorContentType`
The type of content to return, `html` and `text` return strings, `json` returns an object.

#### debounceInterval

`number`  
<u>default</u>: `10`<br />
