---
sidebar_position: 1
---

# useNativeEditor

a react hook that will return [EditorBridge](./EditorBridge)

| name             | type              | default                  | description                                                                                               |
| ---------------- | ----------------- | ------------------------ | --------------------------------------------------------------------------------------------------------- |
| bridgeExtensions | BridgeExtension[] | undefind                 | A list of BridgeExtensions that will be add to the editor on the native side                              |
| initialContent   | string            | undefind                 | initial content that will be loaded first on the editor                                                   |
| autofocus        | boolean           | false                    | when true the editor will auto focus                                                                      |
| avoidIosKeyboard | boolean           | false                    | On iOS help to handle follow cursor when the editor is fullpage and the iOS keyboard hide the bottom part |
| customSource     | string            | SimpleEditorBundleString | prop that can help for advance usage, an HTML string that will replace the default simple editor          |
| DEV              | boolean           | false                    | prop that can help for advance usage, when true editor will be loaded by DEV_SERVER_URL                   |
| DEV_SERVER_URL   | string            | http://localhost:3000    | prop that can help for advance usage, a url string that point to the editor dev server                    |
