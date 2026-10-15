import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Web-side tests (code that runs inside the WebView) and node scripts.
// Native-side tests run with jest (`*.test.ts(x)`).
export default defineConfig({
  resolve: {
    alias: [
      {
        // The documented Vite alias of a custom web bundle, so the
        // test/fixtures templates run as written.
        find: /^@10play\/tentap-editor$/,
        replacement: fileURLToPath(
          new URL('./src/webEditorUtils/index.ts', import.meta.url).href
        ),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.vitest.{ts,tsx}', 'scripts/**/*.vitest.ts'],
    restoreMocks: true,
  },
});
