import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

// Vite runs from examplelatest directory, so resolve relative to that
const parentDir = path.resolve(process.cwd(), '..');

// This config is used to build the web editor into a single file

export default defineConfig({
  root: 'src/Examples/Advanced/editor-web/',
  build: {
    outDir: 'build',
  },
  resolve: {
    alias: [
      {
        find: '@10play/tentap-editor',
        replacement: path.resolve(parentDir, 'lib-web/index.mjs'),
      },
      // We alias tiptap view and state to use the internal version of tiptap to avoid this error https://github.com/ueberdosis/tiptap/issues/3869#issuecomment-2167931620
      { find: '@tiptap/pm/view', replacement: path.resolve(parentDir, 'lib-web/index.mjs') },
      {
        find: '@tiptap/pm/state',
        replacement: path.resolve(parentDir, 'lib-web/index.mjs'),
      },
    ],
  },
  plugins: [react(), viteSingleFile()],
  server: {
    port: 3000,
  },
});
