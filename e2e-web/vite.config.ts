import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const repoRoot = path.resolve(__dirname, '..');

/**
 * React Native code loads image assets with `require('./icon.png')`. Rewrite
 * those calls into imports so Vite emits the files and hands back their URLs,
 * which react-native-web's Image accepts as a source.
 */
const requireAssets = (): Plugin => ({
  name: 'tentap-require-assets',
  enforce: 'pre',
  transform(code, id) {
    if (id.includes('node_modules') || !/\.[jt]sx?$/.test(id)) return null;
    const imports: string[] = [];
    const transformed = code.replace(
      /require\((['"])([^'"]+\.png)\1\)/g,
      (_match, _quote, file: string) => {
        const name = `__tentapAsset${imports.length}`;
        imports.push(`import ${name} from ${JSON.stringify(file)};`);
        return name;
      }
    );
    if (imports.length === 0) return null;
    return { code: `${imports.join('\n')}\n${transformed}`, map: null };
  },
});

// Mirrors the Expo web setup from website/docs/setup/expoWeb.md.
export default defineConfig({
  plugins: [requireAssets(), react()],
  // Globals that Metro and webpack provide on web.
  define: {
    __DEV__: 'false',
    global: 'globalThis',
  },
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: 'react-native-web' },
      {
        find: /^react-native-webview$/,
        replacement: '@10play/react-native-web-webview',
      },
      {
        find: /^@10play\/tentap-editor$/,
        replacement: path.join(repoRoot, 'src/index.tsx'),
      },
    ],
    // The library sources live outside this package; resolve these from here.
    dedupe: [
      'react',
      'react-dom',
      'react-native-web',
      '@10play/react-native-web-webview',
    ],
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.js',
      '.tsx',
      '.ts',
      '.mjs',
      '.js',
      '.jsx',
      '.json',
    ],
  },
  server: {
    fs: { allow: [repoRoot] },
  },
  build: {
    outDir: 'build',
    // The editor HTML is inlined as one large string.
    chunkSizeWarningLimit: 4096,
  },
});
