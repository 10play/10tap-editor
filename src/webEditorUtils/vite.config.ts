import { defineConfig } from 'vite';
import { resolve } from 'path';

// This config is used to build the web editor into a single file

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, './index.ts'),
      name: 'tentapWebutils',
      // the proper extensions will be added
      fileName: 'index',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['@tiptap/pm/view', 'react', 'react/jsx-runtime', 'react-dom'],
      output: {
        dir: 'lib-web',
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          react: 'React',
        },
      },
    },
  },
});
