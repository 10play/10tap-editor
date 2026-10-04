# WP-K final pass checklist

The 1.1 docs were drafted from the release plan before WP-C, WP-D, WP-E, WP-F, WP-G, WP-H, WP-M, WP-N, WP-O and WP-Z landed. Check each item below against the integrated code, fix the docs, then delete this file.

Verify: `yarn workspace website build` (Yarn 3 ignores `--cwd`, so the plan's `yarn --cwd website build` runs the root scripts and fails) and `npx markdown-link-check -q -c website/.markdown-link-check.json website/docs/*.md website/docs/*/*.md`.

## Names and signatures to confirm

- `useEditorBridge` options (WP-D): `parseOptions`, `scrollBottomOffset`, `avoidKeyboard`, `mergeStyles`, `rpcTimeoutMs`. `api/useEditorBridge.md` documents `mergeStyles` as a `useEditorBridge` option; move it if WP-D/WP-E made it a `RichText` prop.
- `stateUpdateDebounceMs` (master §3.2, WP-D list) is not documented. Find out whether it landed on `useEditorBridge` or `useTenTap` and add it to `api/useEditorBridge.md` or the `useTenTap` section of `setup/advancedSetup.md`.
- `setContent(content, { parseOptions, emitUpdate })`, `insertContent(content)`, `getSelectedText(range?)` (WP-G): signatures, clamping, `\n` block separator, and what `insertContent` does against a legacy bundle (documented only as "rebuild the bundle").
- Errors (WP-Z): `TentapRpcTimeoutError` and `TentapUnsupportedError` exported from the root.
- `BridgeContext` sixth argument and `CAPABILITIES` export (`api/BridgeExtensions.md#writing-your-own-bridge`); the RPC reply shape `{ content, messageId }`.
- Toolbar (WP-H): `headingItems`; `shouldHideDisabledToolbarItems` applying to heading items; link bar behaviour (no close on blur, Done inserts); auto `hidden` while a custom keyboard is open. Not yet documented: the PR #173 list component prop and the PR #239 link hint text key. Add both to `api/Components.md` (and the theme key to `examples/customTheme.md`).
- Keyboard (WP-M): every `CustomKeyboard` prop and default in `api/CustomKeyboardUtils.md`; the keyboard component props; `CustomKeyboardExtension` `options.height`; `useCustomKeyboard` return shape and where it can be called (inside `CustomKeyboard` context only, or anywhere); `useCustomKeyboardHeight`, `CustomKeyboardHeightContext`, `EditorKeyboardAvoidingView` props; `useKeyboard` field names; `onKeyboardError` payload; what setting `activeKeyboardID` to `undefined` does (back to the system keyboard, or dismiss).
- `examples/customKeyboard.md` react-native-keyboard-controller recipe: run it in `examplelatest` (the `KeyboardStickyView` `offset.closed` usage is untested).
- Theme (WP-T): `colorKeyboard` optional, replace-not-merge for `colorSelection` / `highlightSelection`, dark theme includes the color keyboard.

## Behaviour claims to confirm

- `RichText`: `containerStyle` always merged; `style` gated by `mergeStyles`; dev warning for `onMessage` without `exclusivelyUseCustomOnMessage`; reload restores content, CSS, coalesced settings and pending RPCs (`api/Components.md#editor-swaps-and-reloads`).
- Readiness: `isReady` false again during reload; initial core state values listed in `api/BridgeState.md#usebridgestate`.
- `useEditorContent`: fetch on ready and content updates only.
- Dynamic height: `maxHeight` keeps scroll position; no keyboard padding in dynamic mode on both platforms; web iframe height on `style`.
- Advanced setup: `useTenTap` handler composition list, which options stay overridable, the runtime dynamic-height CSS, `EditorContent` / `useEditor` exports from `/web`, and the `resolve.dedupe` list.
- `migrations/v1.1.md` and `CHANGELOG.md`: `react-dom` moved out of `dependencies` (WP-Z, only after `check:bundle`); iOS remount range; the native floor and AGP 9 claims (WP-O build results).
- `setup/installation.md`: the "Android API level 29+" note predates 1.1 and conflicts with the native module's minSdk 24. Confirm which minimum the editor really needs.

## Issue drafts

- Fill in the gate results that `issue-responses.md` asks for (#50 frame shift, #302 / #285 / #51 device gates, #323, #321, #318, #205, #291).
- Update the PR #239 / #173 / #251 entries once WP-H and WP-L land.
- The #318 shim issue and PR are drafts only; file them in `10play/react-native-web-webview` and release 0.0.4 before posting the #318 comment.

## Release

- `CHANGELOG.md` says "1.1.0 (unreleased)"; set the date at release. The release-it conventional-changelog plugin has no `infile`, so it does not update this file; either add `"infile": "CHANGELOG.md"` (WP-J/WP-Z) or keep editing it by hand.
- When 1.2 docs start, cut 1.1 with `yarn workspace website docusaurus docs:version 1.1`.
