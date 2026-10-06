# Changelog

Releases before 1.1.0 are described on the [GitHub releases page](https://github.com/10play/10tap-editor/releases).

## 1.1.0 (unreleased)

A rewrite of the editor core with a backwards-compatible public API, fixes for every open bug report, and the return of custom keyboards. Upgrade notes are in the [1.1 migration guide](https://10play.github.io/10tap-editor/docs/migrations/v1.1).

### Highlights

- **Custom keyboards are back** and work on the new architecture (bridgeless included), the old architecture, Expo dev clients and Expo Go. `CustomKeyboard`, `ColorKeyboard`, `CustomKeyboardExtension`, the `colorKeyboard` theme and the `Color` / `ColorKeyboardTheme` types are exported again with their 0.7.x API. The keyboard is now rendered in your own React tree, while the editor keeps focus, caret and selection (#51, #285, #302). On Android the toolbar stays still while switching keyboards with `androidKeyboardMode="stable"` (Android 11+, not in Expo Go) or in an edge-to-edge app; with the default mode and `adjustResize` it still moves during the switch (#50).
- **Reliable startup.** The editor reports `isReady` as soon as it is created, commands sent before that are queued instead of dropped, and readiness no longer depends on autofocus or editing (#343, #322, #227, #299).
- **Dynamic height** grows and shrinks in any parent, respects a capped height and keeps the scroll position (#342, #336, #323, #289, #205).

### Added

- `insertContent(content)` on the editor bridge (#62).
- `getSelectedText(range?)` on the editor bridge (#338).
- `parseOptions` option, and `setContent(content, { parseOptions, emitUpdate })` (#327).
- `scrollBottomOffset` option (#308).
- `avoidKeyboard` option, an alias of `avoidIosKeyboard`.
- `mergeStyles` option to merge the `RichText` `style` and `containerStyle` props over the defaults instead of replacing them (#205).
- `rpcTimeoutMs` option and the `TentapRpcTimeoutError` / `TentapUnsupportedError` errors.
- `Toolbar` `headingItems` prop; `HEADING_ITEMS` and `ToolbarContext` are exported (#295).
- `Toolbar` `ListComponent` prop to render the toolbar with another list, such as a bottom-sheet `FlatList` (PR #173).
- `linkBarTheme.hintText` theme key for the link input placeholder (PR #239).
- Toolbar buttons have accessibility labels, the button role and a selected/disabled state; `ToolbarItem` takes an optional `label`.
- Custom keyboard additions: `layout="inline" | "overlay"`, `defaultHeight`, `closeOnEditorPress`, `androidKeyboardMode="system" | "stable"`, `forceFallback`, `onOpen`, `onClose`, `onKeyboardError`; keyboard components receive `editor`, `close` and `keyboardHeight`; `CustomKeyboardExtension` takes an `options.height`; `useCustomKeyboard`, `useCustomKeyboardHeight` and `EditorKeyboardAvoidingView`; `defaultColorKeyboardTheme` and `darkColorKeyboardTheme` are exported.
- `useKeyboard()` also returns `isCustomKeyboardOpen`, `activeCustomKeyboardID`, `systemKeyboardHeight`, `lastKeyboardHeight` and `windowOverlaysKeyboard`, and keeps `keyboardHeight` while switching keyboards. Its return type is exported as `KeyboardState`.
- `useRemoteEditorBridge` is exported and re-renders when the editor changes (#51).
- `EditorContent` and `useEditor` are exported from `@10play/tentap-editor/web` (#309).
- `useTenTap` `stateUpdateDebounceMs` option.
- Bridges receive an optional sixth `BridgeContext` argument in `extendEditorInstance`, with a queued `send`, `rpc` and `supports(capability)`. The `BridgeContext`, `RpcOptions`, `SendOptions`, `Capabilities` and `CapabilityName` types are exported.

### Fixed

- The editor never became ready on 1.0.x, also with `editable: false` and on Android (#343, #322, #227).
- `getHTML` / `getText` / `getJSON` replies were never released (#346).
- "Editor isn't ready yet" warnings after unmounting during the Android padding timer (#299).
- Crash with `Cannot read property 'addEventListener' of undefined` when imports are not inlined (#339).
- Dynamic height ignored outside a `ScrollView`, could not shrink, looped on iOS 26, jumped to the top on new lines, and didn't apply on Expo web (#342, #336, #323, #289, #205).
- Android: autofocus didn't open the keyboard on the new architecture (#321).
- Multiple editors on Expo web received each other's messages, in their state and in a custom `onMessage` (#318).
- Type errors such as `toggleBold does not exist on type 'EditorBridge'` with deep imports or `moduleResolution: "node"` (#290).
- Links without a scheme were saved as relative links (#255).
- The link bar closed before Insert could be pressed, for example inside a `ScrollView` (#252).
- No way to continue typing after inserting an image at the end of the document (#273).
- A visible dot after inline images on Android (#291).
- The heading toolbar kept the main toolbar's scroll offset (#298).
- Bridge configs containing an apostrophe broke the editor.
- Injected CSS was lost when the WebView reloaded.
- Custom editor bundles built with 0.7.x dropped `HistoryBridge` (undo/redo), which TipTap v3 renamed to `undoRedo`; its config and whitelist entry are now also sent under `history`.
- On the old Android architecture, TalkBack and UI test tools could see the editor's text at zero size until it was focused. The WebView is now hidden with opacity, not `display: none`, while it loads.

### Changed

- `dynamicHeight` can be changed after mount without reloading the WebView. Custom editor bundles built with an earlier version still reload, with `initialContent`.
- With `dynamicHeight`, `RichText` applies the content height after your `containerStyle`, so it can no longer be overridden. `style` and `containerStyle` otherwise still replace the defaults unless `mergeStyles` is set.
- `RichText` throws a clear error when `editor` doesn't come from `useEditorBridge`. Spread copies (`{ ...editor }`) keep working as in 1.0.
- `useEditorBridge` reads `bridgeExtensions` once and warns in development when the list changes after mount.
- `setImage` adds an empty paragraph after an image that ends the document.
- `setLink` adds `https://` to URLs without a scheme, or the `defaultProtocol` passed to `LinkBridge.configureExtension`, and `mailto:` to plain email addresses.
- `shouldHideDisabledToolbarItems` also applies to heading items.
- The link bar no longer closes on blur; the keyboard's Done key inserts the link.
- `useTenTap` composes `tiptapOptions.onCreate`, `onUpdate`, `onSelectionUpdate` and `onTransaction` with its own handlers instead of letting them replace them.
- The web editor sends `editor-ready` followed by a full `stateUpdate` on creation, and `editor-ready` now carries a payload. Messages may carry `editorId` and `v` fields, and there are new message types (`boot-error`, `tentap-editor-press`).
- Commands called before the editor is ready are queued instead of dropped with an "Editor isn't ready yet" warning.
- `RichText` logs a development warning when `onMessage` is passed without `exclusivelyUseCustomOnMessage`.
- `useEditorContent` fetches content on content changes only (with custom bundles built before 1.1, on every state update as before), ignores out-of-order replies and stops after unmount.
- On iOS the WebView is remounted after its first load only with react-native-webview 13.12.3 and 13.12.4.
- The WebView reloads and restores the editor when its content process is killed.
- `EditorTheme.colorKeyboard` is optional; the types of `editor.theme`, `defaultEditorTheme` and `darkEditorTheme` still always include it.
- Type-level: `EditorBridge` has the new required members `insertContent` and `getSelectedText`.

### Deprecated

- `CustomKeyboard` `rootRef` (ignored), `CustomKeyboard` `onKeyboardHideAndroid` (use `onClose`) and `TenTapView` (renders nothing).

### Native and tooling

- New `TenTapKeyboard` native module (iOS Objective-C++, Android Java) with a `codegenConfig` (`RNTenTapSpec`). Android no longer applies the Kotlin Gradle plugin, which AGP 9's built-in Kotlin support conflicts with.
- **Native floor: React Native 0.74+ (Expo SDK 51+).** The Android module is built on `BaseReactPackage`, which React Native 0.73 and older lack, so the Android build fails there; stay on 1.0.x. The `react-native` peer dependency stays `*`, as in 1.0. The JavaScript part does not require the native module: without it (Expo Go, web, an unlinked build) custom keyboards use a JavaScript fallback.
- iOS deployment target follows `min_ios_version_supported` (15.1 by default).
- Added the `@tiptap/extension-paragraph` and `@tiptap/extension-text` dependencies. All 1.0 dependencies are still installed, including `@tiptap/react` and `react-dom`, so a 1.0 advanced setup that imports `EditorContent` from `@tiptap/react` still builds. `react-dom` now accepts React 18 or 19 (`^18.2.0 || ^19.0.0`), so an app that already has a matching `react-dom` no longer gets a second copy (#67). Apps that target the web, or build a custom editor bundle, should pin a `react-dom` that matches their `react`.
- `@10play/tentap-editor/web` can be loaded with `require`.
- The package ships only `scripts/buildEditor.js` from `scripts/`.
- The repository's example apps are now `example/` (bare React Native 0.81, built and tested on both architectures) and `example-expo/` (Expo SDK 57 with a development build). They replace `examplelatest/` and `exampleoldarch/`.

### Credits

These pull requests were superseded by the rewrite; thank you to their authors: #341 (#339), #340 (#299), #296 (#295), #206 (stable editor identity), #350 (AGP 9 / no Kotlin plugin) and #334 (advanced example build). #239 (link input hint text) and #173 (custom toolbar list component) were adopted.
