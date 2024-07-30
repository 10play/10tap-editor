import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

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
        replacement: '@10play/tentap-editor/web',
      },
      // We alias tiptap view and state to use the internal version of tiptap to avoid this error https://github.com/ueberdosis/tiptap/issues/3869#issuecomment-2167931620      {
      { find: '@tiptap/pm/view', replacement: '@10play/tentap-editor/web' },
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
