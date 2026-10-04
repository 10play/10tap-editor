/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>/src'],
  testMatch: ['**/?(*.)test.[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^react-native-webview$':
      '<rootDir>/src/__mocks__/react-native-webview.tsx',
    '(^|/)simpleWebEditor/build/editorHtml$':
      '<rootDir>/src/__mocks__/editorHtml.ts',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/examplelatest',
    '<rootDir>/website',
    '<rootDir>/lib/',
    '<rootDir>/lib-web/',
  ],
};
