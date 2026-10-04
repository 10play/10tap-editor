import { defineConfig } from 'vite';
import { resolve } from 'path';

// Builds the web editor utils (`@10play/tentap-editor/web`) as ESM + UMD.
export default defineConfig({
  build: {
    outDir: 'lib-web',
    lib: {
      entry: resolve(__dirname, './index.ts'),
      name: 'tentapWebutils',
      formats: ['es', 'umd'],
      // The UMD build uses .cjs so `require` works regardless of the consumer's package type
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.umd.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react-dom'],
      output: {
        globals: {
          'react': 'React',
          'react/jsx-runtime': 'ReactJSXRuntime',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
