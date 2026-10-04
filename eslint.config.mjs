import js from '@eslint/js';
import jest from 'eslint-plugin-jest';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Code that runs inside the WebView. Everything else under src/ is bundled by
// Metro for native and must not touch the DOM or pull in react-dom.
const WEB_SOURCES = [
  'src/web/**',
  'src/webEditorUtils/**',
  'src/simpleWebEditor/**',
  'src/**/*.vitest.{ts,tsx}',
];

export default tseslint.config(
  {
    ignores: [
      '**/build/**',
      '**/coverage/**',
      '.yarn/**',
      'lib/**',
      'lib-web/**',
      'website/**',
      'examplelatest/android/**',
      'examplelatest/ios/**',
      'examplelatest/vendor/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  react.configs.flat.recommended,
  reactHooks.configs['recommended-latest'],
  {
    plugins: { 'react-native': reactNative },
    languageOptions: {
      globals: { ...globals.es2021, __DEV__: 'readonly' },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'eqeqeq': ['error', 'smart'],
      'no-shadow': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-native/no-inline-styles': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-shadow': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        { 'ts-ignore': 'allow-with-description' },
      ],
      // Public types use `{}` (e.g. `BridgeState | {}`) and RN assets use require().
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ['**/*.{js,cjs}'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      'no-redeclare': ['error', { builtinGlobals: false }],
    },
  },
  {
    files: ['**/*.mjs', '*.config.ts', 'scripts/**'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: WEB_SOURCES,
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'document',
          message:
            'Native code must not touch the DOM; inject a script instead.',
        },
        {
          name: 'window',
          message:
            'Native code must not touch the DOM; inject a script instead.',
        },
      ],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@tiptap/react',
              message:
                'Pulls react-dom into the native bundle; use @tiptap/core.',
              allowTypeImports: true,
            },
            {
              name: 'react-dom',
              message: 'react-dom must not be reachable from native code.',
              allowTypeImports: true,
            },
          ],
          patterns: [
            {
              group: ['react-dom/*'],
              message: 'react-dom must not be reachable from native code.',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
  {
    // Shared protocol code runs on both sides: no runtime dependencies at all.
    files: ['src/shared/**/*.ts'],
    ignores: ['src/shared/**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react/*',
                'react-dom',
                'react-dom/*',
                'react-native',
                'react-native/*',
                'react-native-webview',
                '@tiptap/*',
                '../*',
              ],
              message:
                'src/shared must stay dependency-free: import only from src/shared.',
            },
          ],
        },
      ],
    },
  },
  {
    // The BridgeExtension interface/class merge is part of the public API.
    files: ['src/bridges/base.ts'],
    rules: { '@typescript-eslint/no-unsafe-declaration-merging': 'off' },
  },
  {
    // TODO(WP-C): AsyncMessages becomes a typed shim over the RPC registry.
    files: ['src/RichText/AsyncMessages.ts'],
    rules: { '@typescript-eslint/no-unsafe-function-type': 'off' },
  },
  {
    files: WEB_SOURCES,
    languageOptions: { globals: globals.browser },
  },
  {
    files: [
      '**/*.test.{ts,tsx}',
      '**/__tests__/**',
      '**/__mocks__/**',
      'jest.setup.ts',
    ],
    ...jest.configs['flat/recommended'],
    languageOptions: {
      globals: { ...globals.jest, ...globals.node },
    },
    rules: {
      ...jest.configs['flat/recommended'].rules,
      // Tests import the WebView mock directly to inspect recorded calls.
      'jest/no-mocks-import': 'off',
    },
  },
  {
    files: ['**/*.vitest.{ts,tsx}'],
    rules: { 'jest/no-deprecated-functions': 'off' },
  },
  prettierRecommended
);
