# Changelog

Releases before 1.1.0 are described on the [GitHub releases page](https://github.com/10play/10tap-editor/releases).

## 1.1.0 (unreleased)

A rewrite of the editor core with a backwards-compatible public API, fixes for every open bug report, and the return of custom keyboards. Upgrade notes are in the [1.1 migration guide](https://10play.github.io/10tap-editor/docs/migrations/v1.1).

### Highlights

- **Custom keyboards are back** and work on the new architecture (bridgeless included), the old architecture, Expo dev clients and Expo Go. `CustomKeyboard`, `ColorKeyboard`, `CustomKeyboardExtension`, the `colorKeyboard` theme and the `Color` / `ColorKeyboardTheme` types are exported again with their 0.7.x API. The keyboard is now rendered in your own React tree, while the editor keeps focus, caret and selection (#51, #285, #302, #50).
- **Reliable startup.** The editor reports `isReady` as soon as it is created, commands sent before that are queued instead of dropped, and readiness no longer depends on autofocus or editing (#343, #322, #227, #299).
- **Dynamic height** grows and shrinks in any parent, respects a capped height and keeps the scroll position (#342, #336, #323, #289, #205).

### Added

- `insertContent(content)` on the editor bridge (#62).
- `getSelectedText(range?)` on the editor bridge (#338).
- `parseOptions` option, and `setContent(content, { parseOptions, emitUpdate })` (#327).
- `scrollBottomOffset` option (#308).
- `avoidKeyboard` option, an alias of `avoidIosKeyboard`.
- `mergeStyles` option to merge the `RichText` `style` prop instead of replacing the defaults (#205).
- `rpcTimeoutMs` option and the `TentapRpcTimeoutError` / `TentapUnsupportedError` errors.
- `Toolbar` `headingItems` prop; `HEADING_ITEMS` and `ToolbarContext` are exported (#295).
- Custom keyboard additions: `layout="inline" | "overlay"`, `defaultHeight`, `closeOnEditorPress`, `androidKeyboardMode="system" | "stable"`, `forceFallback`, `onOpen`, `onClose`, `onKeyboardError`; keyboard components receive `editor`, `close` and `keyboardHeight`; `useCustomKeyboard`, `useCustomKeyboardHeight`, `CustomKeyboardHeightContext` and `EditorKeyboardAvoidingView`.
- `useKeyboard()` also returns `isCustomKeyboardOpen`, `activeCustomKeyboardID`, `systemKeyboardHeight` and `lastKeyboardHeight`, and keeps `keyboardHeight` while switching keyboards.
- `useRemoteEditorBridge` is exported and re-renders when the editor changes (#51).
- `EditorContent` and `useEditor` are exported from `@10play/tentap-editor/web` (#309).
- Bridges receive an optional sixth `BridgeContext` argument in `extendEditorInstance`, with a queued `send`, `rpc` and `supports(capability)`.

### Fixed

- The editor never became ready on 1.0.x, also with `editable: false` and on Android (#343, #322, #227).
- `getHTML` / `getText` / `getJSON` replies were never released (#346).
- "Editor isn't ready yet" warnings after unmounting during the Android padding timer (#299).
- Crash with `Cannot read property 'addEventListener' of undefined` when imports are not inlined (#339).
- Dynamic height ignored outside a `ScrollView`, could not shrink, looped on iOS 26, jumped to the top on new lines, and didn't apply on Expo web (#342, #336, #323, #289, #205).
- Android: autofocus didn't open the keyboard on the new architecture (#321).
- Multiple editors on Expo web received each other's messages; requires `@10play/react-native-web-webview` 0.0.4 or newer (#318).
- Bold and italic on an empty selection with the advanced setup (#309).
- Type errors such as `toggleBold does not exist on type 'EditorBridge'` with deep imports or `moduleResolution: "node"` (#290).
- Links without a scheme were saved as relative links (#255).
- The link bar closed before Insert could be pressed, for example inside a `ScrollView` (#252).
- No way to continue typing after inserting an image at the end of the document (#273).
- A visible dot after inline images on Android (#291).
- The heading toolbar kept the main toolbar's scroll offset (#298).
- Bridge configs containing an apostrophe broke the editor.
- Injected CSS was lost when the WebView reloaded.
- Custom editor bundles built with 0.7.x didn't receive the `HistoryBridge` config, which TipTap v3 renamed to `undoRedo`; it is now also sent under `history`.

### Changed

- `RichText` merges your `containerStyle` with its own instead of replacing it; `style` still replaces unless `mergeStyles` is set.
- `setImage` adds an empty paragraph after an image that ends the document.
- `setLink` adds `https://` to URLs without a scheme.
- `shouldHideDisabledToolbarItems` also applies to heading items.
- The link bar no longer closes on blur; the keyboard's Done key inserts the link.
- `useTenTap` composes `tiptapOptions.onCreate`, `onUpdate`, `onSelectionUpdate` and `onTransaction` with its own handlers instead of letting them replace them.
- The web editor sends an initial `stateUpdate` on creation, and `editor-ready` now carries a payload. Messages may carry `editorId` and `v` fields.
- `useEditorContent` fetches content on content changes only, ignores out-of-order replies and stops after unmount.
- On iOS the WebView is remounted after its first load only with react-native-webview 13.12.3 and 13.12.4.
- The WebView reloads and restores the editor when its content process is killed.
- `EditorTheme.colorKeyboard` is optional.
- Type-level: `EditorBridge` has the new required members `insertContent` and `getSelectedText`.

### Deprecated

- `CustomKeyboard` `rootRef` (ignored) and `TenTapView` (renders nothing).

### Native and tooling

- New `TenTapKeyboard` native module (iOS Objective-C++, Android Java) with a `codegenConfig` (`RNTenTapSpec`). Android no longer applies the Kotlin plugin, which also makes the library build with AGP 9.
- The native module needs React Native 0.74+ (Expo SDK 51+). `peerDependencies` stay `*`.
- iOS deployment target follows `min_ios_version_supported` (15.1 by default).
- Removed the unused `@tiptap/starter-kit`, `@tiptap/extension-code-block` and `@tiptap/extension-horizontal-rule` dependencies and added `@tiptap/extension-paragraph` and `@tiptap/extension-text`. `react-dom` is no longer a runtime dependency (#67).
- `@10play/tentap-editor/web` can be loaded with `require`.

### Credits

These pull requests were superseded by the rewrite; thank you to their authors: #341 (#339), #340 (#299), #296 (#295), #206 (stable editor identity), #350 (AGP 9 / no Kotlin plugin) and #334 (advanced example build). #239 (link input hint text) and #173 (custom toolbar list component) were adopted.
