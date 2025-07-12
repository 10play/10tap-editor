# 10Tap Editor Example with Expo

This project demonstrates how to integrate the [10Tap Editor](https://github.com/10play/10Tap-Editor), a React Native rich text editor, with [Expo](https://expo.dev). It showcases the editor's features in a monorepo setup, including web support.

## Prerequisites

Ensure you have the following installed:

- **Node.js**: Version 18 or higher
- **Yarn**: Version 3.6.1 or higher (configured with `node-modules` linker)
- **Expo CLI**: Install globally with `npm install -g expo-cli` or use `npx expo`
- A compatible device or emulator for Android/iOS, or a browser for web

## Installation

1. **Clone the Repository** (if not already done):

   ```bash
   git clone https://github.com/10play/10Tap-Editor.git
   cd 10Tap-Editor
   ```

2. **Install Dependencies**:
   From the monorepo root (`10Tap-Editor`), install all dependencies:

   ```bash
   yarn install
   ```

3. **Build the Web Editor Assets**:
   The 10Tap Editor requires a build step for web support to generate the `editorHtml` module:

   ```bash
   yarn editor:build
   ```

   This command runs `vite build` and a post-build script to prepare the web editor.

## Running the Example

Start the Expo development server from the monorepo root:

```bash
yarn workspace example-expo start
```

Then, choose your platform:

- **iOS**: Press `i` to run on an iOS simulator (requires Xcode on macOS).
- **Android**: Press `a` to run on an Android emulator (requires Android Studio).
- **Web**: Press `w` to run in a browser (served at `http://localhost:3000` by default).

Alternatively, run a specific platform directly:

```bash
yarn workspace example-expo ios
yarn workspace example-expo android
yarn workspace example-expo web
```
