import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// This config is used to build the web editor into a single file

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, './index.ts'),
      name: 'MyLib',
      // the proper extensions will be added
      fileName: 'my-lib',
    },
    rollupOptions: {
        // make sure to externalize deps that shouldn't be bundled
        // into your library
        external: ['react'],
        output: {
          dir: '../../lib-web',
          // Provide global variables to use in the UMD build
          // for externalized deps
          globals: {
            react: 'React',
          },
        },
      },
  },
});
