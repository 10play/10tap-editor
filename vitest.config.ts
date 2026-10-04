import { defineConfig } from 'vitest/config';

// Web-side tests (code that runs inside the WebView) and node scripts.
// Native-side tests run with jest (`*.test.ts(x)`).
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.vitest.{ts,tsx}', 'scripts/**/*.vitest.ts'],
    restoreMocks: true,
  },
});
