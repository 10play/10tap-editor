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
        find: '@10play/tentap-editor/web',
        replacement: resolve(__dirname, '../../../../../src/webEditorUtils'),
      },
      {
        find: '@10play/tentap-editor',
        replacement: resolve(__dirname, '../../../../../src/webEditorUtils'),
      },
    ],
  },
  plugins: [react(), viteSingleFile()],
  server: {
    port: 3000,
  },
});
