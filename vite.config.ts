import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: 'src/Editor',
  build: {
    outDir: 'build',
  },
  plugins: [react(), viteSingleFile()],
  server: {
    port: 3000,
  },
});
