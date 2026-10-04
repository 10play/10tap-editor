import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// This config is used to build the web editor into a single file.
// The example is not a dependent of the library package, so `@10play/tentap-editor/web`
// is resolved to the locally built lib-web (run `yarn editor:build-web-utils` first).
const tentapWeb = path.resolve(__dirname, '../../../../../lib-web/index.mjs');

export default defineConfig({
  root: 'src/Examples/Advanced/editor-web/',
  build: {
    outDir: 'build',
  },
  resolve: {
    alias: [
      { find: '@10play/tentap-editor', replacement: tentapWeb },
      // We alias tiptap view and state to use the internal version of tiptap to avoid this error https://github.com/ueberdosis/tiptap/issues/3869#issuecomment-2167931620
      { find: '@tiptap/pm/view', replacement: tentapWeb },
      { find: '@tiptap/pm/state', replacement: tentapWeb },
    ],
  },
  plugins: [react(), viteSingleFile()],
  server: {
    port: 3000,
  },
});
