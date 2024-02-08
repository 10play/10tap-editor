---
sidebar_position: 2
---

# Advance Setup

Make sure you read the core concepts page before setup advance and check if the simple usage is good enough for you.

1.  Create a new folder in your project called `editor-web` - advance setup will let you full control on what running inside the editor webview, so we need to create a spereate folder that will include code that will run inside the webview and will have different build process and tsconfig

2.  Create `editor-web/tsconfig.json`:

```json title="vite.config.ts"
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "_version": "2.0.0",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "paths": {
      "@10play/tentap-editor": [
        "../node_modules/@10play/tentap-editor/lib-web/typescript/webEditorUtils/index.d.ts"
      ]
    },
    "moduleResolution": "bundler",
    "target": "es2015",
    "allowJs": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "noEmit": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true
  }
}
```

It's important to configure `paths` so on web types will load from web subfolder and not react-native part types

3. Add exclude on the root tsconfig.json: `"exclude": ["./editor-web"]`
4. Add index.html AdvancedEditor.tsx and index.tsx:

```html title="index.html"
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RichTextEditor</title>
  </head>
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    #root > div:nth-of-type(1) {
      overflow: auto;
      height: 100%;
      position: absolute;
      width: 100%;
      top: 0;
      bottom: 0;
    }
    #root div .ProseMirror {
      height: 100%;
      overflow: auto;
    }
    .ProseMirror:focus {
      outline: none;
    }
  </style>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
```

```jsx title="AdvancedEditor.tsx"
import React from 'react';
import { EditorContent } from '@tiptap/react';
import { useTenTap, CoreBridge } from '@10play/tentap-editor/web';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';

export const AdvancedEditor = () => {
  const editor = useTenTap({
    bridges: [CoreBridge],
    tiptapOptions: {
      extensions: [Document, Paragraph, Text],
    },
  });
  return <EditorContent editor={editor} />;
};
```

```jsx title="index.tsx"
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdvancedEditor } from './AdvancedEditor';

/**
 * This is the entrypoint for the "web" part of our editor that will be built with vite
 */
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<AdvancedEditor />);

```

5. Create bundle config, we use vite, `yarn add -D vite @vitejs/plugin-react vite-plugin-singlefile` here `vite.config.ts` :

```ts title="vite.config.ts"
import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// This config is used to build the web editor into a single file

export default defineConfig({
  root: 'src/Examples/Advanced/Editor/',
  build: {
    outDir: 'build',
  },
  resolve: {
    alias: [
      {
        find: '@10play/tentap-editor',
        replacement: '@10play/tentap-editor/web',
      },
    ],
  },
  plugins: [react(), viteSingleFile()],
  server: {
    port: 3000,
  },
});
```

It's important to have the `alias` configuration so vite will not load react-native code

6. Add scripts on package.json so it will be easy to run/build editor-web:

```json title="package.json"
    "scripts": {
        ...
        "editor:dev": "vite --config ./editor-web/vite.config.ts",
        "editor:build": "vite --config ./editor-web/vite.config.ts build && yarn editor:post-build",
        "editor:post-build":"node ./node_modules/@10play/tentap-editor/scripts/buildEditor.js ./editor-web/build/index.html",
        "reverse-android": "adb reverse tcp:3000 tcp:3000",
    }
```

`editor:dev` - Run the editor web in dev mode  
`editor:build` - Build the editor web, probably need to add to your deploy/build process  
`editor:post-build` - This will take your built html file, and paste into a a ts and exports a string `editorHtml`  
 which we can then later use as the source of our RichText.  
`reverse-android` - On android need to reverse ports so it will be able to work with DEV / DEV_SERVER_URL props

7. `Outside` of editor-web update your `EditorBridge` to used the html we just built.

```tsx
import { editorHtml } from './editor-web/build/editorHtml';
const editor = useEditorBridge({
  customSource: editorHtml,
  ...
});
```

You basically done with the advance setup now you have full control of the editor-web you can write your own bridgeExtensions add additional tiptapExtensions
