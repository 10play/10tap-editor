# 10tap-editor

`@10play/tentap-editor` is a rich text editor for React Native. A TipTap/ProseMirror editor runs in a `react-native-webview`, and the native side drives it through a typed bridge. It also ships a small native module, `TenTapKeyboard`, which custom keyboards use to swap the system keyboard for a React Native view while the WebView keeps focus. It supports iOS and Android on the new and old architectures, Expo, and Expo web (beta).

Yarn 3 workspaces: the library at the root, plus `example/` (bare RN 0.81, new and old architecture, app id `dev.tenplay.tentapexample`), `example-expo/` (Expo SDK 57 development build, generated native projects), `e2e-web/` (Playwright) and `website/` (Docusaurus docs). Use Node 22 (`.nvmrc`) for development.

## Architecture

- `src/native/`: native-side core. `EditorController.ts` owns one editor: readiness, capabilities, the outbox, bridge state and RPC. `transport.ts` queues commands and coalesces them until the WebView is ready. `rpc.ts` handles request/reply calls such as `getHTML`. `injector.ts` handles CSS and script injection. `keyboardStore.ts` holds the process-wide keyboard state that `useKeyboard()` reads. `stores.ts` has the small external stores.
- `src/shared/`: code that both sides import. `protocol.ts` is the wire protocol (version 2, a superset of 1.0's, so legacy bundles and custom `onMessage` handlers keep working). It sits alongside `contracts.ts`, `capabilities.ts` (feature detection for custom or legacy bundles), `bootConfig.ts` and `errors.ts`.
- `src/web/`: the runtime inside the WebView. `runtime.ts` boots the editor and handles messaging, with modules for focus, dynamic height, selection reveal, state publishing and polyfills for old Android WebViews. `useTenTap.tsx` is the hook that editor bundles use.
- `src/bridges/`: one `BridgeExtension` per feature (`base.ts`). Each bridge pairs a TipTap extension and its web handler (`onBridgeMessage`, `extendEditorState`) with native commands (`extendEditorInstance`) and CSS. `StarterKit.ts` exports `TenTapStartKit`.
- `src/RichText/`: the public React Native API. It covers `RichText.tsx` (the WebView host), `useEditorBridge`, `useBridgeState`, `useEditorContent`, `useScrollToCaret`, `keyboardAccessories.ts` (`useKeyboardAccessory`), `Toolbar/` and the theme.
- `src/RichText/Keyboard/`: the custom keyboard: `CustomKeyboard`, `ColorKeyboard`, `EditorKeyboardAvoidingView`, `TenTapView` and `keyboardSession.ts`. `drivers.ts` has three drivers. `native` uses the native module. `fallback` uses no native code: it sets `inputmode="none"` and, on Android, uses a hidden `TextInput`, so it works in Expo Go. `inline` is for web. The toolbar is placed from the measured keyboard geometry.
- Native module: `ios/TenTapKeyboard.mm` and `android/src/main/java/com/tentap/` (`TenTapKeyboardModule`, `KeyboardGeometry`, `InputModeScript`), with architecture-specific glue in `android/src/newarch` and `android/src/oldarch`.
- Codegen spec: `src/specs/NativeTenTapKeyboard.ts` (`codegenConfig` in `package.json`). It is a frozen contract: `yarn check:codegen` compares it, and the hand-written old-architecture Java spec, with the expected method list.
- Editor bundles: `src/simpleWebEditor/` is the built-in editor page. `yarn editor:build` turns it into `src/simpleWebEditor/build/editorHtml.js`. `src/webEditorUtils/` is the `@10play/tentap-editor/web` entry for custom bundles (built to `lib-web/`).
- Tests: Jest (`*.test.ts(x)`) covers the native side; Vitest (`*.vitest.ts(x)`) covers the web runtime and `scripts/`. Compatibility fixtures, such as 1.0 and 0.7 bundles and the advanced template, live in `test/fixtures/`.

## Commands

```sh
yarn                          # install every workspace
yarn editor:build             # build the built-in editor; needed before tests and the example apps
yarn editor:build-web-utils   # build lib-web (the example's Advanced screen also needs `yarn example editor:build`)
yarn typecheck && yarn lint   # lint uses Prettier through ESLint; `yarn lint --fix`
yarn test                     # Jest, native side
yarn test:web                 # Vitest, web runtime and scripts
yarn e2e:web                  # Playwright against e2e-web
yarn check:codegen            # codegen spec contract
yarn check:bundle             # Metro bundles the packed library without react-dom ([--tarball <tgz>])
node scripts/size-budget.js   # editor bundle size budget
yarn docs:llms                # regenerate website/static/llms.txt and llms-full.txt (CI runs yarn check:llms)
yarn workspace website build  # docs build; also checks links and anchors
```

Example apps:

```sh
yarn example pods             # iOS pods, new architecture (pods:oldarch for the old one)
yarn example ios | android    # debug with Metro (yarn example start)
yarn example build:ios | build:ios:release
yarn example build:android | build:android:oldarch | build:android:release
yarn example:expo prebuild    # regenerates example-expo/ios and android (not committed)
yarn example:expo ios | android | web
```

Maestro flows: `maestro test example/.maestro` (`yarn example e2e`) and `maestro test example-expo/.maestro`. The `caret/` flows (not in the default config) check the caret geometry when a caret probe runs alongside them (`-e CARET_PROBE=http://localhost:<port>`); see the headers of `example/.maestro/caret/caret-probe.mjs` (Android) and `caret-probe-ios.mjs` (iOS). Prefer Release builds, which embed the JS bundle, for the other flows.

## Rules

- **Backwards compatibility with 1.0.1 comes first.** Public APIs, props, bridge command strings, the wire protocol and 1.0 custom editor bundles must keep working, and upgrading must not require code changes. Add things; don't rename or remove them.
- `peerDependencies` stay `"*"`. Never narrow them or move runtime dependencies to peers. The React Native 0.74 floor is stated in the docs only. Don't add new dependencies.
- **Keyboard, toolbar and caret.** Every change must keep these three working:
  1. The toolbar sits fully visible, directly above the keyboard, whether it is the system keyboard or a custom one.
  2. While typing a lot of text, the caret line stays visible above the toolbar.
  3. The virtual keyboard shows, hides and switches correctly on iOS and Android, on both architectures.

  Verify them on a device with the software keyboard actually on screen. On the iOS simulator, turn off I/O > Keyboard > Connect Hardware Keyboard (or run `defaults write com.apple.iphonesimulator ConnectHardwareKeyboard -bool false` before booting). On Android, confirm `adb shell dumpsys input_method | grep mInputShown=true`. Check the geometry numerically (the caret probes do), look at the screenshots, and fix problems in the library, not in individual examples.
- Don't edit `src/simpleWebEditor/build/editorHtml*` or `lib*/`; they are generated. After changing `src/web`, `src/bridges` or `src/simpleWebEditor`, rerun `yarn editor:build`.
- Regenerate the llms files (`yarn docs:llms`) when you change the docs pages or the sidebar. Docs code samples must type-check against the current source.
- Use conventional commit messages (commitlint runs on commit). Don't comment on, close or auto-close GitHub issues, so no "Fixes #N" in commits.

## Gotchas

- The iOS simulator hides the software keyboard while a hardware keyboard is connected. Keyboard and caret checks then pass without a keyboard on screen, so disable it first.
- On the iOS 26.2 simulator, the WebContent process sometimes crashes, for example when the iOS caret probe draws its marker; use `--marker false`. The editor reloads by itself (`onContentProcessDidTerminate`), but a flow may flake. Rerun it, or use another simulator runtime.
- Native builds use a lot of disk (DerivedData, Gradle and `example/ios/build`). Check free space first, run `yarn clean` or delete the build outputs when you are done, and keep device logs small.
- Switching architectures: remove the build folders (`yarn clean`) between new- and old-architecture builds. After `pods:oldarch`, run `yarn example pods` again (or restore `example/ios/Podfile.lock` and the `Info.plist`) so the new-architecture files stay committed.
- An Android emulator restored from a snapshot can misbehave; cold boot it with `-no-snapshot-load`.
