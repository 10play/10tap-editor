# 1.1.0 issue and PR responses (drafts)

Drafts for the maintainer. Nothing here has been posted. Posting, closing and labelling are human actions, done after 1.1.0 is published and each fix has been checked against the released package.

Each entry lists the disposition from the release plan, the docs page that covers it, and anything to confirm before posting. The comment text is inside the fenced block.

Docs links use the published site: `https://10play.github.io/10tap-editor/docs/...`.

## Verification status (1.1.0 docs pass)

Checked on `v1.1-rewrite` before the release candidate:

- Automated and passing: unit and web suites, the 1.0.1 and 0.7.x compatibility gate, the isolated-bundle check (no `react-dom` in the native bundle), `npm pack`, and the two web E2E checks (#318 two editors, #205 dynamic height). The #318 check runs with the shim at 0.0.3, so it shows that the editor-id filtering alone keeps two editors apart; the 0.0.4 shim fix is still unreleased.
- Not run yet: every device gate (G-iOS-1/2/3, G-AND-1/2/3, G-ALL-1/2/3), the Maestro flows on a device, and an AGP 9 build. Entries that depend on them say so under "Before posting"; hold those comments until the gate has passed on the release candidate.

---

## Issues

### #348 Lists add `<p>` per entry (react-native-render-html)

- Disposition: answered, by design. Docs recipe added.
- Docs: `examples/renderHtml`

````md
Thanks for the report and the side-by-side screenshots, @Izocel!

This comes from TipTap/ProseMirror rather than from 10tap: a list item's schema is `paragraph block*`, so `getHTML()` always returns `<li><p>…</p></li>`. Every TipTap-based editor does this; web editors just remove the inner paragraph margins with CSS. `react-native-render-html` gives each `<p>` default margins and doesn't support `li > p` selectors, which is where the extra lines come from.

We're keeping the HTML output as it is, because changing it would break existing saved content and nested lists. The docs now have a page on rendering editor HTML: https://10play.github.io/10tap-editor/docs/examples/renderHtml. The short version is a `p` renderer that drops the margins inside list items:

```tsx
const renderers = {
  p: ({ TDefaultRenderer, tnode, style, ...props }) => (
    <TDefaultRenderer
      tnode={tnode}
      {...props}
      style={[style, tnode.parent?.tagName === 'li' && { marginTop: 0, marginBottom: 0 }]}
    />
  ),
};
// <RenderHtml source={{ html }} renderers={renderers} />
```

If you don't need paragraph spacing anywhere, `tagsStyles={{ p: { marginTop: 0, marginBottom: 0 } }}` works too. Closing this for now; feel free to reopen if you still see extra spacing.
````

### #346 AsyncMessages memory leak

- Disposition: fixed in 1.1.0 (per-editor RPC registry; entries are deleted when they settle).

````md
Thanks a lot for the detailed report and the precise diagnosis, @zzorba! You were right: the reply callbacks for `getHTML()` / `getText()` / `getJSON()` were never removed, so every call, including the debounced ones from `useEditorContent`, kept its content in memory for the whole session.

1.1.0 replaces that registry. Each editor now keeps its own table of pending requests, and an entry is removed as soon as its reply arrives (or when the editor unmounts), so the content can be garbage-collected. `useEditorContent` also fetches only when the content changes now, not on every selection change, which cuts the traffic a lot.

There are no API changes, so upgrading is all you need. If you'd like requests to fail instead of waiting forever when the WebView doesn't answer, there's a new opt-in `rpcTimeoutMs` option. If you still see memory growing after updating, please reopen and we'll take another look. Thanks again!
````

### #343 Editor never ready in 1.0.1

- Disposition: fixed in 1.1.0. #335 and #347 are duplicates; link them here when closing.

````md
Thanks @ddelange for the detailed report and the follow-up digging, and @abhijeetsingh-22 for confirming. Your hunch about the TipTap v3 migration was right.

In TipTap v2 the editor always ran one transaction when it was created, and tentap relied on that first transaction to send its initial state, which is where `isReady: true` came from. TipTap v3 skips it unless `autofocus` is set, so on 1.0.x the editor mounted fine (an empty document looks blank) but never reported itself ready until the user interacted with it. That's also why the inline-script and `onLoad` workarounds didn't help, and why it happened on the old architecture too (#335, #347).

1.1.0 makes readiness explicit: the web editor sends its full state and an `editor-ready` message as soon as it is created, and the native side marks the editor ready when it receives either one. Commands you send before that are queued instead of dropped. The native half also works with custom editor bundles built with 1.0.x, but rebuild yours to get the complete initial state.

You can remove any `onLoad` re-injection workarounds. Closing this; please reopen if the editor still gets stuck after upgrading.
````

### #342 Dynamic height does not work

- Disposition: fixed in 1.1.0.
- Docs: `api/useEditorBridge#dynamicheight`, `examples/scrollView`

````md
Thanks for the clear repro @TrevPennington, and @VertzCross for the bump!

There were two causes. On the React Native side, react-native-webview wraps the WebView in a container with `flex: 1`, and in Yoga that flex basis overrode the height we set, so the height only worked inside a ScrollView. On the web side, the editor CSS kept a `min-height: 100%`, so the editor could grow but never shrink.

Both are fixed in 1.1.0: with `dynamicHeight: true` the editor follows its content height in any parent and shrinks when you delete content. A `maxHeight` on the container is respected too; the editor then scrolls internally. If you use a custom editor bundle, update the `.dynamic-height .ProseMirror` rule as described in the advanced setup docs and rebuild.

To read the content height yourself, pass `onMessage` with `exclusivelyUseCustomOnMessage={false}` to `RichText` and handle `type === 'document-height'` (payload in px). Docs: https://10play.github.io/10tap-editor/docs/examples/scrollView

Closing this. Please reopen if you still see it after updating!
````

### #339 Cannot read property 'addEventListener' of undefined

- Disposition: fixed in 1.1.0. PR #341 superseded (credit).

````md
Thanks for the report, @atheck! An internal helper that tracks focus inside the editor's WebView was evaluated on the React Native side too, and it called `window.document.addEventListener` while its module loaded. Native has no `document`, so it threw. The old guard only covered Expo; bare apps usually didn't hit it because Metro's `inlineRequires` postponed loading the module, so any setup that loads imports eagerly crashed at startup.

In 1.1.0 nothing touches the DOM at import time anymore: the focus tracker is created lazily inside the WebView, and a lint rule keeps DOM globals out of the native code. There are no API changes, so just upgrade. Thanks also to the author of #341 for the fix proposal; the rewrite covers the same change.

If you still see this after upgrading, please reopen and include your metro.config.js.
````

### #338 Get text from selection

- Disposition: fixed in 1.1.0 (`getSelectedText(range?)`).
- Docs: `api/EditorBridge#getselectedtext`, `examples/workingWithContent`

````md
Thanks for the clear report, @Te12944265-AMAHA!

`editorState.selection.from/to` are ProseMirror document positions, not character offsets: every block boundary adds a position, so slicing `getText()` with them ends up off by a character per block. That's the missing first or last character you saw.

1.1.0 adds an async helper that reads the text inside the WebView from the live editor:

```ts
// current selection
const selected = await editor.getSelectedText();

// or a specific range (ProseMirror positions)
const text = await editor.getSelectedText({ from, to });
```

Blocks are separated by `\n`, matching the system "Copy". It's documented here: https://10play.github.io/10tap-editor/docs/api/EditorBridge#getselectedtext. With a custom editor bundle, rebuild it to use this. Feel free to reopen if anything still looks off!
````

### #336 dynamicHeight freeze on iOS 26

- Disposition: fixed in 1.1.0.

````md
Thanks @bytehala for the report, and @chrisp018 for narrowing it down to 1.0 vs 0.7. That made this much easier to track down.

The cause was a CSS change in 1.0: the editor styles switched `.ProseMirror` from `height: 100%` to `min-height: 100%`, but the `dynamicHeight` override only reset `height`. So the editor's minimum height was tied to the WebView's height: each time the WebView resized to fit the content, the content grew to fit the WebView. On iOS 26 this loop never settled. On top of that, keyboard padding was added to the document in dynamic height mode, which inflated the measured height.

1.1.0 clears the `min-height` in dynamic height mode, applies that rule at runtime so custom editor bundles get it too, and no longer adds keyboard padding when `dynamicHeight` is on. If you use the advanced setup, also update the `#root div.dynamic-height .ProseMirror` rule in your `index.html` to `height: auto; min-height: 0;`.

Please upgrade and let us know if you still see trouble with `dynamicHeight`!
````

### #332 Bold/italic invisible for Chinese text

- Disposition: answered. Docs recipe added; the default font is unchanged in 1.x for visual compatibility.
- Docs: `examples/customCss#chinese-japanese-and-korean-text`

````md
Thanks for the detailed report and the screenshots, @sfshine. Comparing with tiptap.dev helped a lot.

This turned out to be a font problem rather than a problem with `toggleBold` / `toggleItalic`: the marks are applied (that's why underline and strikethrough show up on the same text). The default editor doesn't set a font, so the WebView uses its default serif font, and for Chinese characters it falls back to a system font that has no bold or italic variant. tiptap.dev sets an explicit system font, which is why it looked fine there.

We decided not to change the default font in 1.x, because that would change how every existing editor looks. Instead, the docs now show a CJK-friendly setup: https://10play.github.io/10tap-editor/docs/examples/customCss#chinese-japanese-and-korean-text

```ts
CoreBridge.configureCSS(`
  .ProseMirror {
    font-family: -apple-system, system-ui, 'PingFang SC', 'Hiragino Sans GB',
      'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif;
    font-synthesis: weight style;
  }
`)
```

With this you can drop the text-stroke/skew workaround. If it still happens on a specific device or OS version, please reopen with the platform and version. Thanks again!
````

### #327 Whitespace stripped

- Disposition: fixed in 1.1.0 (opt-in `parseOptions`).
- Docs: `api/useEditorBridge#parseoptions`, `api/EditorBridge#setcontent`

````md
Thanks for the clear repro, @rikardwissing!

TenTap passes HTML straight to TipTap/ProseMirror, and ProseMirror's HTML parser collapses runs of whitespace by default (`preserveWhitespace: false`). The spaces were dropped from the document itself, so CSS `white-space` couldn't bring them back, and tentap had no way to pass parse options through.

1.1.0 adds an opt-in `parseOptions` setting:

```ts
const editor = useEditorBridge({
  initialContent: "<a href='hello'>hello</a>  <a href='world'>world</a>",
  parseOptions: { preserveWhitespace: 'full' },
});

// also applies to setContent, or override it per call:
editor.setContent(html, { parseOptions: { preserveWhitespace: 'full' } });
```

The default is unchanged. One thing to watch with `'full'`: newlines and indentation between tags in pretty-printed HTML are kept as content too. If you round-trip content saved from the editor, storing it with `getJSON()` keeps whitespace exactly with no parse options. With a custom editor bundle, rebuild it to use `parseOptions`.

Closing this now. If you still see spacing issues after upgrading, feel free to reopen!
````

### #324 Missing `toggleBold` in docs

- Disposition: answered, docs fixed (1.1 and 1.0 docs).
- Docs: `api/EditorBridge#togglebold`

````md
Thanks for reporting this, @jingjunm!

`toggleBold` was never missing from the library, only from the docs. `BoldBridge` (part of `TenTapStartKit`) adds it to the `EditorBridge`, so you can call it from a custom toolbar:

```tsx
const editor = useEditorBridge({ bridgeExtensions: TenTapStartKit });
const state = useBridgeState(editor);

<Button
  onPress={() => editor.toggleBold()}
  disabled={!state.canToggleBold}
  selected={state.isBoldActive}
/>
```

If you pass your own `bridgeExtensions` array, make sure `BoldBridge` is in it; otherwise `toggleBold` isn't added to the editor or its type.

We've fixed the EditorBridge docs page: `toggleBold` is listed again, the blockquote entry no longer says "toggle bold", `toggleStrike` was wrongly listed as `toggleStrikethrough`, and `setHardBreak`, `liftTaskListItem` and `sinkTaskListItem` were missing. Closing this, but feel free to reopen if anything still doesn't work for you.
````

### #323 dynamicHeight jumps to top

- Disposition: fixed in 1.1.0.
- Before posting: confirm on Android that the #236 / #244 Enter-key jitter did not come back (Maestro / G-ALL-3).

````md
Thanks @rikardwissing for tracking down the exact line, and @impsdc for the extra detail. That was the key clue.

With `dynamicHeight`, the editor reset its internal scroll position to the top on every content height change. That was a workaround for an Android jitter (#236 / #244) and assumed the WebView could always grow to fit the content. When the height is capped (a `maxHeight`, or a parent with a fixed height), the content scrolls inside the editor instead, and the reset sent you back to the top on every new line.

1.1.0 removes the reset and fixes the original jitter at its source: ProseMirror no longer scrolls the editor while the WebView is still growing. Once the editor hits its height cap, your scroll position and cursor stay where they are. With a custom editor bundle, rebuild it after upgrading.

If you still see jumping, please open a new issue with a small repro and we'll take a look.
````

### #322 Content doesn't load with `editable: false`

- Disposition: fixed in 1.1.0 (same root cause as #343).

````md
Thanks for the report, and thanks @impsdc for the repro repo!

The editor's `isReady` (and the rest of its state) only updated when the WebView sent a state update, which only happened after an editor transaction such as a focus, selection change or edit. With `editable: false` and no `autofocus`, nothing runs a transaction while loading, so `isReady` stayed `false` and any UI waiting for it never showed the content. That's also why `autofocus: true` seemed to fix it on iOS.

In 1.1.0 the editor sends its initial state as soon as it is created, so `isReady`, `empty` and `editable` are correct right away whether or not the editor is editable. The native side also marks the editor ready on its own, which covers custom bundles built with 1.0.x. Rebuild your custom bundle anyway to get the full initial state.

If you still see the editor stuck after upgrading, please reopen with your RN, react-native-webview and tentap versions. Thanks!
````

### #321 Android keyboard missing

- Disposition: fixed in 1.1.0.
- Before posting: confirm on an API 33 emulator with `autofocus: true` on the released build (G-ALL-3).

````md
Thanks for reporting this, @TrevPennington, and thanks to everyone who confirmed it.

On Android, `autofocus: true` uses a hidden native TextInput to bring up the keyboard before focus moves to the editor's WebView. That input was hidden with `display: 'none'`. On the new architecture (the default since Expo SDK 53 / RN 0.79) that makes the native view invisible, and Android won't let an invisible view take focus, so you got a cursor in the editor but no keyboard.

1.1.0 keeps the helper input focusable but transparent (and hidden from screen readers), so autofocus opens the keyboard on Android again. Please upgrade to 1.1.0.

If tapping the editor still doesn't open the keyboard after updating, please open a new issue with a minimal repro (versions and the screen's layout).
````

### #318 Multiple editor instances on Expo web

- Disposition: fixed in 1.1.0 (editor ids on every message, native filtering) plus the shim fix in `@10play/react-native-web-webview` 0.0.4.
- Before posting: the shim fix has to be released first. See [react-native-web-webview issue and PR](#react-native-web-webview-issue-and-pr-for-318) below. The two-editor Playwright check (G-WEB-1) passes on `v1.1-rewrite`.

````md
Thanks for the detailed report and the repro! You were right that messages from different editors were getting mixed up on Expo web. The iframe-based WebView we use on web, `@10play/react-native-web-webview`, listened to every `message` event on the page and didn't check which iframe it came from, so focus state, height updates and other messages from one editor reached every editor on the screen. Native iOS/Android weren't affected.

This is fixed on both sides:
- `@10play/react-native-web-webview` 0.0.4 only handles messages from its own iframe. Please upgrade with `npx expo install @10play/react-native-web-webview@latest`.
- `@10play/tentap-editor` 1.1.0 tags every message with the id of the editor that sent it and ignores messages meant for another editor.

With both, multiple editors on web work independently, including `dynamicHeight`, and you shouldn't need the custom `onMessage` workaround anymore. Closing this, but feel free to reopen if editors still affect each other after upgrading.
````

### #311 How to use `onChange`

- Disposition: answered, docs example added.
- Docs: `api/useEditorBridge#onchange`, `examples/workingWithContent`

````md
Hi! Thanks for the question, and sorry for the slow reply.

`onChange` is called with no arguments on purpose: sending the whole document from the WebView to React Native on every keystroke is expensive, so it only tells you that the content changed. That's why `text` is `undefined` in your snippet.

The easiest way to keep the content in state is the `useEditorContent` hook. It's debounced and handles this for you:

```tsx
const editor = useEditorBridge({
  autofocus: true,
  avoidIosKeyboard: true,
  bridgeExtensions: [...TenTapStartKit /* ... */],
});

const content = useEditorContent(editor, { type: 'text' }); // or 'html' | 'json'

useEffect(() => {
  if (content !== undefined) setMyState(content);
}, [content]);
```

If you'd rather use `onChange`, fetch the content yourself inside it, ideally debounced: `const text = await editor.getText();` (or `getHTML()` / `getJSON()`).

There's now a page with both patterns: https://10play.github.io/10tap-editor/docs/examples/workingWithContent. Closing for now, but feel free to reopen if you run into anything else!
````

### #309 Bold/Italic broken with advanced setup

- Disposition: fixed in 1.1.0 (extensions resolved once, pure configuration, `EditorContent` exported from `/web`) plus docs on keeping a single tiptap copy.
- Before posting: this needs the reporter to confirm. Ask rather than close; close after confirmation or after a few weeks without reply.
- Docs: `setup/advancedSetup#keeping-a-single-copy-of-tiptap`

````md
Hi @danhmaisgt, thanks for the detailed code, and sorry this took so long.

Bold, italic and link on an empty selection rely on ProseMirror "stored marks". We found two things in the advanced setup that break them:
- `useTenTap` re-created and re-configured the extensions on every render, which reset editor options on each transaction.
- `@10play/tentap-editor/web` ships its own copy of tiptap/ProseMirror. Your editor-web was also pulling in a second copy, through `EditorContent` from `@tiptap/react` and extensions like FontFamily, Color and TextStyle. Two copies in one editor don't recognize each other's state. The default editor only has one copy, which is why it worked once you removed `customSource`.

In 1.1.0:
- extensions are resolved once and configuring a bridge no longer mutates it;
- `EditorContent` and `useEditor` are exported from `@10play/tentap-editor` (web), so you don't need `@tiptap/react` directly;
- the advanced setup docs explain how to keep a single tiptap copy (same `@tiptap/*` version as tentap, plus `resolve.dedupe` in your vite config): https://10play.github.io/10tap-editor/docs/setup/advancedSetup#keeping-a-single-copy-of-tiptap

Could you upgrade, import `EditorContent` from `@10play/tentap-editor`, align your `@tiptap/*` versions, rebuild your editor bundle and let us know whether toggling bold or italic with nothing selected now applies to the next characters you type? If it still happens, please share your editor-web package.json and vite config. Thanks!
````

### #308 Adjust newline auto-scroll offset

- Disposition: fixed in 1.1.0 (`scrollBottomOffset`).
- Docs: `api/useEditorBridge#scrollbottomoffset`

````md
Thanks for the clear write-up and screenshot!

The auto-scroll is controlled by ProseMirror's `scrollThreshold` / `scrollMargin`, which tentap exposes through `editor.updateScrollThresholdAndMargin(px)`. The catch was that `RichText` reset that value every time the keyboard opened or closed, so a custom offset (like room for a floating toolbar) didn't stick.

1.1.0 adds a persistent extra bottom offset:

```tsx
const editor = useEditorBridge({
  avoidIosKeyboard: true,
  scrollBottomOffset: 60, // e.g. your floating toolbar height
});
```

It is added to both the scroll threshold and the editor's bottom padding, so new lines scroll into view before they reach your toolbar, and the last lines can still be scrolled above it. Docs: https://10play.github.io/10tap-editor/docs/api/useEditorBridge#scrollbottomoffset. Closing for now; let us know if anything still looks off.
````

### #302 Custom keyboard fails on RN 0.79.3

- Disposition: fixed in 1.1.0 (custom keyboard revival without `rootViewFactory` or bridge access).
- Before posting: device gates G-iOS-1, G-ALL-1 and G-ALL-2 (Expo SDK 54 dev client with `ExpoAppDelegate`, RN 0.79+ Swift AppDelegate) must pass.
- Docs: `api/CustomKeyboardUtils`, `examples/customKeyboard`

````md
Thanks for the detailed report, and to everyone who added information.

The old native keyboard built its React root view by looking up `rootViewFactory` on your AppDelegate. That only works when the AppDelegate subclasses `RCTAppDelegate`; since RN 0.79 the template uses a Swift AppDelegate that holds an `RCTReactNativeFactory`, so the lookup failed and the keyboard never rendered. We removed the keyboard in 1.0 because of problems like this.

Custom keyboards are back in 1.1.0, rebuilt from scratch. The keyboard is now an ordinary view in your own React tree, and a small native module only hides the system keyboard while the editor keeps focus. There's no second React root, no AppDelegate or bridge lookup, and no native view component, so it works with the RN 0.79+ templates, bridgeless mode and Expo's `ExpoAppDelegate`. Your 0.7.x code compiles unchanged (`rootRef` is now ignored).

After upgrading, run `pod install` / `npx expo prebuild` so the native module is linked. Docs: https://10play.github.io/10tap-editor/docs/examples/customKeyboard

Closing this; please open a new issue if the new keyboard gives you trouble.
````

### #299 "Editor isn't ready yet" warning

- Disposition: fixed in 1.1.0.

````md
Thanks for the report @sfshine, and for the follow-up. You were right: the WebView could be gone by the time the 200 ms timer fired.

On Android, `RichText` delayed a padding update with a `setTimeout` that was never cancelled. If the editor unmounted or remounted inside that window, the delayed call hit a null WebView and logged "Editor isn't ready yet".

In 1.1.0 the timer is cancelled on cleanup, and more generally commands sent before the editor is ready are queued and sent once it is, so the warning is gone. Your code doesn't need to change. If you still see it after upgrading, please reopen with a snippet of how the editor is mounted.
````

### #298 Heading toolbar offset

- Disposition: fixed in 1.1.0.

````md
Thanks for the clear repro and screenshots! The main toolbar and the heading (Aa) toolbar shared the same horizontal list, so after scrolling the main toolbar, the heading list opened with the old scroll offset. In 1.1.0 each toolbar context renders its own list, so the heading toolbar always opens at the start. Just update `@10play/tentap-editor`. If you still see an offset, feel free to reopen.
````

### #295 Customise HEADING_ITEMS

- Disposition: fixed in 1.1.0. PR #296 superseded (credit @nrcaz).
- Docs: `api/Components#customizing-the-heading-toolbar`

````md
Thanks for the proposal and the patch, @nrcaz! This shipped in 1.1.0: `<Toolbar />` takes a `headingItems` prop, and `HEADING_ITEMS` and `ToolbarContext` are exported, so you can build on the defaults without patch-package:

```tsx
import { Toolbar, HEADING_ITEMS } from '@10play/tentap-editor';

<Toolbar editor={editor} headingItems={HEADING_ITEMS.slice(0, 4)} /> // close + H1–H3
```

If you write your own list, add an item that calls `setToolbarContext(ToolbarContext.Main)` so users can get back to the main toolbar. `shouldHideDisabledToolbarItems` now applies to the heading items as well. Docs: https://10play.github.io/10tap-editor/docs/api/Components#customizing-the-heading-toolbar. Thanks again, closing this out!
````

### #291 1px dot after inline image

- Disposition: fixed in 1.1.0 (separator CSS reset).
- Before posting: check on an Android device or emulator with an inline image, `border-radius` and a dark background.

````md
Thanks for the clear report and screenshot, and sorry it took a while!

The dot wasn't your image: it was a hidden helper `<img class="ProseMirror-separator">` that ProseMirror adds after an inline node at the end of a line so the cursor can sit there. With `img` styles like `border-radius` or a background applied to all images, it became visible on Android.

1.1.0 resets padding, outline, background, border radius and shadow on the separator, so your own `img` styles can't make it visible again. Scoping custom image styles as `img:not(.ProseMirror-separator)` also avoids this kind of thing entirely.

If you're stuck on an older version, this workaround hides it:

```ts
editor.injectCSS('img.ProseMirror-separator{width:0!important;height:0!important;padding:0!important;background:none!important}');
```

The new-line-after-a-block-image problem (#273) is fixed separately. Closing this one; feel free to reopen if the dot comes back!
````

### #290 EditorBridge type errors

- Disposition: fixed in 1.1.0.

````md
Thanks for the report, and sorry for the slow reply!

The built-in bridges add their methods and state to `EditorBridge` / `BridgeState` through TypeScript module augmentation, and those augmentations only apply when the bridge files are part of your TS program. We publish `src/` next to `lib/`, so with deep imports such as `@10play/tentap-editor/src/...`, or with `moduleResolution: "node"`, `tsc` could check files like `src/RichText/Toolbar/actions.ts` without the bridge files, which gave the `toggleBold does not exist on type 'EditorBridge'` errors.

In 1.1.0 the source types are self-contained, so these errors go away however the files are pulled in. Everything you might deep-import (`Toolbar`, `DEFAULT_TOOLBAR_ITEMS`, `ToolbarItems`, `ToolbarItem`, `BridgeExtension`, `Images`, ...) is also exported from the package root, which is still the recommended import path.

Closing this; feel free to reopen if you still see type errors after upgrading!
````

### #289 dynamicHeight scrolls to top

- Disposition: fixed in 1.1.0, plus docs on using `dynamicHeight` in a ScrollView.
- Docs: `examples/scrollView`

````md
Thanks for the report and the repro repo, @RalissonMattias, and thanks @wujieli0207 and @rajeevCs for the +1s.

In `dynamicHeight` mode the web editor reset its scroll position to the top every time the content height changed, which meant on every new line. That reset was a workaround for a one-line jitter (#236). 1.1.0 removes it and fixes the jitter properly: ProseMirror no longer scrolls the editor while the WebView is growing, so your scroll position stays where it is.

`dynamicHeight` makes the WebView as tall as its content, so it's meant to sit inside your own `ScrollView`, which does the scrolling. There's a new docs page for this setup: https://10play.github.io/10tap-editor/docs/examples/scrollView

If you still see jumps after upgrading, please open a new issue with your layout.
````

### #285 ColorKeyboard empty on the new architecture

- Disposition: fixed in 1.1.0 (same-tree keyboard; theme fallback).
- Before posting: device gates G-iOS-1 and G-ALL-2.
- Docs: `examples/colorKeyboard`, `examples/customTheme#color-keyboard-theme`

````md
Thanks for the detailed report and the repro repo, @matt-cleveland, and @KecsetiIstvan for confirming.

You were right that #225 didn't fully solve this. On iOS the old keyboard rendered in a separate React root created through the old bridge or an AppDelegate `rootViewFactory`. Bridgeless mode and the newer templates don't provide those, and that separate root also didn't get the editor theme, so the keyboard came up empty. We removed it in 1.0 for that reason.

Custom keyboards, including `ColorKeyboard`, are back in 1.1.0 and rebuilt for the new architecture. The keyboard is now rendered in your app's own React tree, so it gets the theme and your context like any other component; a small native module only hides the system keyboard while the editor keeps focus. If a theme has no `colorKeyboard` section, the default color keyboard theme is used.

After upgrading, run `pod install` / `npx expo prebuild`. Docs: https://10play.github.io/10tap-editor/docs/examples/colorKeyboard

Closing this; please open a new issue if you run into problems with the new keyboard.
````

### #276 Editor within ScrollView

- Disposition: answered (react-native-webview 13.13.3 fixed the upstream bug), docs added.
- Docs: `examples/scrollView`

````md
Thanks for the detailed repro, and sorry this took a while.

The editor scrolling on its own when the keyboard opened came from a react-native-webview bug on the new architecture: `scrollEnabled={false}` (which `RichText` sets) was ignored, so WebKit scrolled the WebView to the caret. That was fixed upstream in react-native-webview 13.13.3 (react-native-webview/react-native-webview#3608).

To put the editor inside a `ScrollView`:
- Upgrade to react-native-webview 13.13.3 or newer and rebuild your native app (`pod install` / `expo prebuild`). Expo Go ships its own WebView build, so test in a dev build.
- Use `useEditorBridge({ dynamicHeight: true })` so the WebView grows with its content. 1.1.0 also fixes several dynamic height bugs.
- Leave `avoidIosKeyboard` off and let the parent handle the keyboard, e.g. with `KeyboardAwareScrollView` from `react-native-keyboard-controller`.

There's a docs page covering this: https://10play.github.io/10tap-editor/docs/examples/scrollView. If you still see the WebView scrolling separately after upgrading, please comment with your RN and react-native-webview versions and we'll reopen. Closing for now.
````

### #273 New line under image after `setImage`

- Disposition: fixed in 1.1.0.

````md
Thanks for the report, and sorry it took a while! Images are block nodes, so when `setImage()` was called at the end of the document the image became the last node and there was nowhere to put the cursor after it. The editor selected the image itself, and the next keystroke replaced it.

In 1.1.0 `setImage()` adds an empty paragraph after an image that ends the document and moves the cursor there, so you can keep typing below it. You can drop the `pointer-events: none` workaround. With a custom editor bundle, rebuild it after upgrading.

If you still see this, please reopen with your setup details.
````

### #269 Inline images in initialContent

- Disposition: answered, docs added.
- Docs: `examples/configureExtensions#inline-images`, `api/BridgeExtensions#imagebridge`

````md
Thanks for reporting this, and thanks @colton81 for sharing a workaround!

The image isn't deleted. By default `ImageBridge` (like TipTap's Image extension) treats images as block nodes, and block nodes can't live inside a `<p>`. When the editor parses `<p><img ...></p>` it moves the image out of the paragraph, leaving an empty `<p></p>`, and attributes the image schema doesn't know, like `style` and `loading`, are dropped. That's why removing the wrapping `<p>` seemed to fix it.

To keep images inline inside paragraphs:

```tsx
const editor = useEditorBridge({
  bridgeExtensions: [
    ...TenTapStartKit,
    ImageBridge.configureExtension({ inline: true }),
  ],
  initialContent,
});
```

This is now in the docs: https://10play.github.io/10tap-editor/docs/examples/configureExtensions#inline-images. If the image still doesn't show up, inspect the WebView and check whether the `<img>` is in the editor's DOM; if it is, the image is probably failing to load (network/ATS). Feel free to reopen with details.
````

### #255 Links added without protocol

- Disposition: fixed in 1.1.0.
- Docs: `api/BridgeExtensions#linkbridge`

````md
Thanks for the report, and thanks @abdi4 for the +1!

In 1.1.0, when you add a link from the toolbar or call `editor.setLink(...)`, a URL without a scheme gets `https://`, so `www.google.com` becomes `https://www.google.com` instead of a relative link. URLs that already have a scheme (`http://`, `https://`, `mailto:`, `tel:`, app schemes) and intentional relative or anchor links (`/path`, `#section`) are left alone. For a different default, set `defaultProtocol` with `LinkBridge.configureExtension(...)`.

Links created before upgrading keep the href they were saved with, so you may need to re-edit those. Please reopen if you still run into it after updating!
````

### #252 Link extension not working

- Disposition: fixed in 1.1.0, plus a docs tip.
- Docs: `api/Components#link-bar`

````md
Thanks for reporting this, and thanks @szimma-hunor for pointing to the workaround!

The link input closed itself as soon as it lost focus. Inside a `ScrollView` (or with slightly different timing on Android or web), tapping **Insert** first blurred the input, the link bar closed, and the tap never reached the button.

Fixed in 1.1.0:
- The link bar no longer closes when the input blurs, so **Insert** works reliably.
- The keyboard's **Done** key inserts the link too.
- The docs now recommend `keyboardShouldPersistTaps="handled"` on any `ScrollView` that wraps the editor or the toolbar.

Please update, and if you still see this, comment with a small repro and we'll reopen. Thanks!
````

### #227 Android editor never ready

- Disposition: fixed in 1.1.0.

````md
Thanks to everyone who reported this and shared workarounds, especially @kapir for the detailed report and @santhosh-umapathi-wikifolio for the reload hack, which helped narrow it down.

`isReady` was never set directly. It flipped to `true` on the first state update from the WebView, which at startup usually came from a message posted right after mount. On Android that message could arrive before the page finished loading and was silently dropped, so on some devices `isReady` stayed `false` until the user interacted with the editor.

In 1.1.0 readiness is explicit: the web editor announces itself when it's created, the native side marks the editor ready on that message, and every command sent before that (`setContent`, `setEditable`, `focus`, ...) is queued and sent in order once the editor is ready. You can remove the reload / `bridgeExtensions` workarounds. The native half works without rebuilding a custom bundle; rebuild it to get the full initial state.

One related gotcha: if you pass your own `onMessage` to `RichText`, set `exclusivelyUseCustomOnMessage={false}`, otherwise tentap's own handlers don't run.

If you still see this after upgrading, please reopen with your device, Android version and WebView version.
````

### #205 Dynamic height on Expo web

- Disposition: fixed in 1.1.0.
- Verified: the dynamic-height Playwright check (G-WEB-1) passes on `v1.1-rewrite`.

````md
Thanks for reporting this, @casperstr, and @mrkdyrit and @janlasota for the extra details and the workaround!

There were two causes:
1. On web, the WebView shim renders an `<iframe>` that only reads `style`, and `<RichText>` applied the dynamic height through `containerStyle`, so the height never reached the iframe.
2. The web editor measured its height with a helper that was turned off under Expo.

1.1.0 applies the dynamic height to the iframe's `style` on web and measures the height in every environment. It also merges your `containerStyle` with the editor's instead of replacing it; to merge `style` too, set the new `mergeStyles` option.

Tip: if you pass your own `onMessage` to `<RichText>`, also set `exclusivelyUseCustomOnMessage={false}`, otherwise the built-in height handling is skipped. Please update and let us know if you still see issues!
````

### #69 Faster font injection

- Disposition: answered, docs added (fonts from a file, `webviewBaseURL`). Injected CSS is now also re-applied after reloads.
- Docs: `examples/customCss#loading-fonts-from-a-file`

````md
Thanks for the nudge on this, and thanks @rmarquois for the working example!

You don't need to inline fonts as base64. The docs now describe loading them from a local file: https://10play.github.io/10tap-editor/docs/examples/customCss#loading-fonts-from-a-file

1. Get a local file URI for the font, e.g. with `expo-asset` or a font bundled with your app.
2. Pass an `@font-face { src: url('<localUri>') }` rule through `CoreBridge.configureCSS(...)`, so it's part of the editor from the first paint.
3. Render `<RichText editor={editor} allowFileAccess allowFileAccessFromFileURLs />`, and on iOS point `webviewBaseURL` at the folder containing the font.

This skips sending and parsing a large base64 string on every load. The base64 method still works if you'd rather avoid the setup. Also new in 1.1.0: CSS added with `injectCSS` is re-applied if the WebView reloads. Closing this out; feel free to reopen if you run into trouble on a specific platform.
````

### #67 Reduce dependencies

- Disposition: fixed in 1.1.0. Moving `@tiptap/*` to peer dependencies is wontfix in 1.x (breaking).
- Verified: `react-dom` is a devDependency plus an optional `*` peer, and `check:bundle` confirms the native bundle never imports it.

````md
This is cleaned up in 1.1.0:

- Removed dependencies the library never imported: `@tiptap/starter-kit`, `@tiptap/extension-code-block` and `@tiptap/extension-horizontal-rule`.
- Added `@tiptap/extension-paragraph` and `@tiptap/extension-text`, which CoreBridge uses and which until now only resolved through hoisting.
- `react-dom` is no longer a runtime dependency, only an optional peer dependency. It was only needed to prebuild the default editor, and pinning it to v18 caused peer conflicts in React 19 apps. If you use the advanced setup, keep `react-dom` in your own dependencies, as the docs already say.

The remaining `@tiptap/*` packages stay regular dependencies on purpose: the bridges import their tiptap extensions directly, so custom web editors and custom bridges need them installed, and moving them to peer dependencies would be a breaking change. Thanks for the patience!
````

### #62 Inject custom HTML

- Disposition: fixed in 1.1.0 (`insertContent`).
- Docs: `api/EditorBridge#insertcontent`

````md
Thanks everyone for the patience on this one, and thanks @goran-paunovic for the nudge toward a simple API.

1.1.0 adds `insertContent` to the editor bridge. It inserts HTML, plain text or TipTap JSON at the cursor (replacing the selection, if any) and works with the default editor, no custom bundle needed:

```tsx
editor.insertContent('<strong>Hello</strong> world');
editor.insertContent('just some text');
```

The content still has to fit the editor's schema, so a custom node type needs a bridge extension that defines it (advanced setup). For ordinary HTML snippets and text this should cover it. Docs: https://10play.github.io/10tap-editor/docs/api/EditorBridge#insertcontent

Closing this out; feel free to reopen if something doesn't behave as expected!
````

### #51 Custom keyboard not reactive

- Disposition: fixed in 1.1.0 (same-tree keyboard mounts and unmounts; reactive `useRemoteEditorBridge`).
- Before posting: G-ALL-1 (20 toggles leave mount and unmount counts equal).

````md
Thanks for writing this up! The old native keyboard rendered in a separate React root that was detached on the native side when the keyboard closed but never unmounted, so we couldn't safely subscribe to editor changes from inside it, and `useRemoteEditorBridge` had its subscription commented out.

In 1.1.0 custom keyboards are rendered in your app's own React tree. The keyboard component mounts when it opens and unmounts when it closes, so effects clean up normally, and it receives `editor`, `close` and `keyboardHeight` as props. `useBridgeState(editor)` inside the keyboard updates as the editor changes, and `useRemoteEditorBridge` subscribes again (it's also exported now). `ColorKeyboard` uses this to highlight the active color.

Docs: https://10play.github.io/10tap-editor/docs/api/CustomKeyboardUtils. Closing this; please open a new issue if something isn't reactive for you.
````

### #50 Custom keyboard jitter on Android

- Disposition: fixed in 1.1.0. No `softInputMode` change while switching; zero shift in `'stable'` mode, edge-to-edge and the overlay layout; the default `'system'` mode with `KeyboardAvoidingView` is best effort.
- Before posting: fill in the measured frame shift from gate G-AND-1 for the default mode.
- Docs: `examples/customKeyboard#android-keeping-the-toolbar-still`

````md
Thanks for reporting this, and thanks @canlongdifisoft102 for sharing your workaround!

The jitter came from the old Android keyboard switching the window's `softInputMode` between `adjustResize` and `adjustPan` while the keyboards swapped, so the window resized and the layout jumped for a few frames.

The custom keyboard in 1.1.0 never changes `softInputMode` during a switch. The custom keyboard takes the system keyboard's height and is laid out in the same update in which the system keyboard hides, so the toolbar stays put. For layouts where even a single frame matters there are two options:
- `layout="overlay"` with the new `EditorKeyboardAvoidingView`, which keeps the same padding through the switch;
- `androidKeyboardMode="stable"`, which sets `adjustNothing` once while the keyboard is mounted (Android 11+) and restores your mode on unmount.

Edge-to-edge apps don't resize at all, so they get a still toolbar by default. Details: https://10play.github.io/10tap-editor/docs/examples/customKeyboard#android-keeping-the-toolbar-still

Closing this; please open a new issue if you still see the toolbar jump with one of these setups.
````

---

## Pull requests

Closing comments for PRs superseded by the rewrite. Close only after 1.1.0 is released.

### #341 (fix for #339)

````md
Thank you for this fix! 1.1.0 rewrote the web editor utilities, and the focus tracker is now created lazily inside the WebView, which covers the same crash (#339). Since the files changed completely, we're closing this PR rather than merging it, but your diagnosis was exactly right. Credited in the changelog. Thanks!
````

### #340 (webviewRef null check)

````md
Thanks for this! The 1.1.0 rewrite of `RichText` cancels the Android padding timer on cleanup and queues commands until the editor is ready, which fixes the null WebView warning from #299 along with the related cases. Closing this PR in favor of that, and credited in the changelog. Thank you!
````

### #296 (headingItems, @nrcaz)

````md
Thanks a lot @nrcaz! 1.1.0 ships the `headingItems` prop from this PR, plus `HEADING_ITEMS` and `ToolbarContext` exports and docs (#295). The toolbar was reworked in the same release, so we applied the change there instead of merging this branch. Credited in the changelog. Thanks again!
````

### #206 (editor identity)

````md
Thank you for this! The 1.1.0 rewrite of `useEditorBridge` keeps the `editor` object stable across renders (and in StrictMode), which covers what this PR fixed. Closing in favor of that; credited in the changelog. Thanks!
````

### #350 (AGP 9, @gabrieldonadel)

- Before posting: build an app with AGP 9 against the release candidate. CI has no AGP 9 job, so "builds with AGP 9" is not verified yet; if it fails, keep the PR open.

````md
Thanks @gabrieldonadel! In 1.1.0 the Android part of the library was rewritten in Java (it now contains the custom keyboard module), so it no longer applies the Kotlin Gradle plugin at all, and it builds with AGP 9. That makes this change unnecessary, so we're closing it, but thank you for raising it; credited in the changelog.
````

### #334 (advanced example build)

- Before posting: WP-A already applied this change (commit 293de13) and credited the PR.

````md
Thanks for this! We applied the same fix as part of the 1.1.0 tooling update: the advanced example's vite config now resolves the local `lib-web` build. Closing this PR since the change is in, credited in the commit and changelog. Thanks!
````

### #239 (link input hint text) and #173 (custom toolbar list component)

Both were applied by hand on top of the rewritten toolbar (the branches no longer merge), so close them with credit after 1.1.0 is published.

#239:

````md
Thanks for this! 1.1.0 ships it: the link bar's placeholder comes from the new `toolbar.linkBarTheme.hintText` theme key (default `Type your URL here...`). The toolbar was rewritten in the same release, so we applied the change there instead of merging this branch, and credited you in the changelog. Docs: https://10play.github.io/10tap-editor/docs/examples/customTheme#link-bar. Thanks again!
````

#173:

````md
Thanks for this! 1.1.0 adds a `ListComponent` prop to `Toolbar`, so you can pass a bottom-sheet `FlatList` (or any component with `FlatList` props). It renders both the main and the heading toolbar. The toolbar was rewritten in the same release, so we applied the idea there instead of merging this branch, and credited you in the changelog. Docs: https://10play.github.io/10tap-editor/docs/api/Components#toolbar. Thanks again!
````

### #251 (exported hook types)

- Status: `@10play/tentap-editor/web` exports `useTenTap`, `sendMessage` and the `UseTenTapArgs` options type. `tiptapOptions` stays typed as `any`, as in 1.0: typing it as `UseEditorOptions` would make some existing editor-web code stop compiling in a minor release.
- Before posting: the maintainer decides whether to close this or keep it open for 2.0.

````md
Thanks for this, and sorry for the long wait! In 1.1.0 the web entry exports `useTenTap`, `sendMessage` and the `UseTenTapArgs` type. We kept `tiptapOptions` loosely typed for now, because typing it as `UseEditorOptions` would break the build for some existing custom editors in a minor release. We'll revisit stricter types for the next major. Closing this one; thank you for pushing on it!
````

---

## react-native-web-webview issue and PR for #318

Draft for `10play/react-native-web-webview`. Nothing has been filed. After the fix is released as 0.0.4, the tentap docs already require it (`setup/expoWeb`).

### Issue

````md
**Title:** Each WebView receives `message` events from every iframe on the page

Every `WebView` instance adds a `message` listener to `window` and calls `props.onMessage` for every event, without checking which iframe sent it. With two WebViews on one page, each one receives the other's messages.

In `@10play/tentap-editor` this makes multiple editors on Expo web overwrite each other's state and height (10play/10tap-editor#318).

**Expected:** a WebView only forwards messages whose `event.source` is its own iframe's `contentWindow`.

The listener also captures `props.onMessage` from the first render, so a changed `onMessage` prop is never called.
````

### PR

````md
**Title:** fix: only forward messages from the WebView's own iframe

- In the `message` listener, return early unless `event.source === iframeRef.current?.contentWindow`.
- Keep the latest `props.onMessage` in a ref, so the listener always calls the current handler without re-subscribing.
- Ignore events whose `data` is not a string, like the native WebView.

Tested with two WebViews on one page posting different messages: each `onMessage` only receives its own iframe's messages.

Fixes the web half of 10play/10tap-editor#318. Release as 0.0.4.
````
