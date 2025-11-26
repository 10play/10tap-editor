---
sidebar_position: 2
---

# Advanced Setup

Make sure you read the core concepts page before setup advance and check if the simple usage is good enough for you.

See full working example here https://github.com/10play/10TapAdvancedExample

## Setting Up Our Custom Editor Directory

### Step 1 - creating the directory

Create a new folder in your project called `editor-web` (or any other name) - advance setup will let you full control on what running inside the editor webview, so we need to create a separate folder that will include code that will run inside the webview and will have different build process and tsconfig

### Step 2 - adding tsconfig

Create `editor-web/tsconfig.json`:

```ts title="editor-web/tsconfig.json"
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

It's important to configure `paths` so on web the web types will be used instead of native types.

### Step 3 - updating root tsconfig

Add exclude on the root tsconfig.json: `"exclude": ["./editor-web"]`

### Step 4 - Add index.html AdvancedEditor.tsx and index.tsx

Add the following files

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
      position: absolute;
      height: 100%;
      overflow: auto;
      width: 100%;
      top: 0;
      bottom: 0;
    }
    #root > div.dynamic-height {
      height: unset;
    }

    #root div .ProseMirror {
      min-height: 100%;
      overflow: visible;
    }
    #root div.dynamic-height .ProseMirror {
      height: unset;
    }
    .ProseMirror:focus {
      outline: none;
    }
    .highlight-background {
      background-color: #e6e6ff;
    }
  </style>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
```

```tsx title="AdvancedEditor.tsx"
import React from 'react';
import { EditorContent } from '@tiptap/react';
import { useTenTap, TenTapStartKit } from '@10play/tentap-editor';
import { CounterBridge } from '../CounterBridge';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';

/**
 * Here we control the web side of our custom editor
 */
export const AdvancedEditor = () => {
  const editor = useTenTap({
    bridges: [...TenTapStartKit, CounterBridge],
    tiptapOptions: {
      extensions: [Document, Paragraph, Text],
    },
  });
  return (
    <EditorContent
      editor={editor}
      className={window.dynamicHeight ? 'dynamic-height' : undefined}
    />
  );
};
```

```tsx title="index.tsx"
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdvancedEditor } from './AdvancedEditor';

/**
 * This is the entrypoint for the "web" part of our editor that will be built with vite
 */

declare global {
  interface Window {
    contentInjected: boolean | undefined;
  }
}

/**
 * On android - react-native-webview there is a bug where sometimes the content
 * is injected after the window is loaded https://github.com/react-native-webview/react-native-webview/pull/2960
 * To overcome this we will check if the content is injected before rendering the editor
 */
const contentInjected = () => window.contentInjected;
let interval: NodeJS.Timeout;
interval = setInterval(() => {
  if (!contentInjected()) return;
  // Once content is injected into the webview, we can render the editor
  const container = document.getElementById('root');
  const root = createRoot(container!);
  root.render(<AdvancedEditor />);
  clearInterval(interval);
  return;
}, 1);
```

### Step 5 - adding a bundler

We chose to use vite as our bundler so first run

```bash
yarn add -D vite @vitejs/plugin-react vite-plugin-singlefile
```

And now let's create `vite.config.ts` and configure it

```ts title="vite.config.ts"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// This config is used to build the web editor into a single file

export default defineConfig({
  root: 'src/editor-web', // This should be the directory of your index.html
  build: {
    outDir: 'build',
  },
  resolve: {
    alias: [
      {
        find: '@10play/tentap-editor', // On our web bundle we only want to include web related code
        replacement: '@10play/tentap-editor/web',
      },
      // We alias tiptap view and state to use the internal version of tiptap to avoid this error https://github.com/ueberdostiptap/issues/3869#issuecomment-2167931620
      {
        find: '@tiptap/pm/view',
        replacement: '@10play/tentap-editor/web',
      },
      {
        find: '@tiptap/pm/state',
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

> <strong>It's important to have the `alias` configuration so vite will not load react-native code</strong>

### Step 6 - adding build scripts

Add scripts on package.json so it will be easy to run/build editor-web:

```ts title="package.json"
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

### Step 7 - using our custom editor

`Outside` of editor-web update your `EditorBridge` to used the html we just built.

```tsx
import { editorHtml } from './editor-web/build/editorHtml';
const editor = useEditorBridge({
  customSource: editorHtml,
  ...
});
```

### Step 8 - Install react-dom

`yarn add react-dom`

`yarn add -D @types/react-dom`

You basically done with the advance setup now you have full control of the editor-web you can write your own bridgeExtensions add additional tiptapExtensions

## Alternative Setup

:::info

In case you are using Expo you have to use this Alternative Setup for dev mode on your advance setup editor

:::

There is an alternative vite setup that does not require a vite dev server as suggested in [#80](https://github.com/10play/10tap-editor/issues/80). This setup does not require we add the `DEV` prop

### Update vite.config.ts

In `vite.config.ts` replace plugins with

```ts title="vite.config.ts"
const exec =  require('child_process').exec;

...
plugins: [
   react(),
   viteSingleFile(),
   {
     name: 'postbuild-commands',
     closeBundle: async () => {
       exec('yarn editor:post-build', (error, stdout, stderr) => {
         if (error) {
           console.error(`exec error: ${error}`);
           return;
         }
       });
     },
   },
 ],
```

And add `emptyOutDir: false` to the build options

```ts title="vite.config.ts"
build: {
  outDir: 'build',
  emptyOutDir: false,
},
```

### Update package.json

Update the `editor:dev` script to watch the advanced editor instead of running a dev-server, the hot reload will be handled by metro and not vite.

`"editor:dev": "vite --config ./editor-web/vite.config.ts -w build"`
