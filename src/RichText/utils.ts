import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import type BridgeExtension from '../bridges/base';
import { buildStyleSheetScript } from '../native/injector';
import {
  buildBootConfig,
  buildLegacyGlobalsScript,
  type BootConfig,
  type RuntimePlatform,
} from '../shared/bootConfig';
import {
  getEditorController,
  type EditorController,
} from '../shared/contracts';
import type { EditorBridge } from '../types';

/**
 * Script that creates or updates `<style data-tag={styleSheetTag}>` with
 * `css`, ready to be injected into the editor WebView.
 * @param css - the stylesheet text
 * @param styleSheetTag - identifies the style element to create or update
 */
export const getStyleSheetCSS = (css: string, styleSheetTag: string) =>
  buildStyleSheetScript(css, styleSheetTag);

/** One stylesheet per bridge, tagged with the bridge name. */
export const getInjectedJS = (bridgeExtensions: BridgeExtension[]) =>
  bridgeExtensions
    .map(({ extendCSS, name }) => getStyleSheetCSS(extendCSS || '', name))
    .join('') + 'true;';

export const toRuntimePlatform = (os: typeof Platform.OS): RuntimePlatform => {
  switch (os) {
    case 'android':
    case 'web':
    case 'windows':
    case 'macos':
      return os;
    default:
      return 'ios';
  }
};

type PageIdentity = Pick<EditorController, 'editorId' | 'platform'>;

/** The boot configuration of `editor`'s next page load. */
export const getBootConfig = (
  editor: EditorBridge,
  { editorId, platform }: PageIdentity
): BootConfig =>
  buildBootConfig({
    editorId,
    bridges: editor.bridgeExtensions ?? [],
    platform,
    initialContent: editor.initialContent,
    editable: editor.editable,
    disableColorHighlight: editor.disableColorHighlight,
    dynamicHeight: editor.dynamicHeight,
    parseOptions: editor.parseOptions,
  });

/**
 * Sets the 1.0 window globals (`bridgeExtensionConfigMap`, `initialContent`,
 * …) that custom editor bundles read before they mount.
 */
export const getInjectedJSBeforeContentLoad = (editor: EditorBridge) =>
  buildLegacyGlobalsScript(
    getBootConfig(
      editor,
      getEditorController(editor) ?? {
        editorId: '',
        platform: toRuntimePlatform(Platform.OS),
      }
    )
  );

/**
 * react-native-webview 13.12.3 and 13.12.4 on iOS need the WebView to be
 * remounted after its first load before it delivers messages
 * (react-native-webview#3578, reverted in 13.12.5).
 */
export const requiresIosRemount = (version: string | undefined): boolean =>
  /^13\.12\.[34](?!\d)/.test(version ?? '');

let webViewVersion: string | null | undefined;

/** The installed react-native-webview version, if its package.json resolves. */
export const getWebViewVersion = (): string | undefined => {
  if (webViewVersion === undefined) {
    try {
      const pkg: unknown = require('react-native-webview/package.json');
      const { version } = (pkg ?? {}) as { version?: unknown };
      webViewVersion = typeof version === 'string' ? version : null;
    } catch {
      webViewVersion = null;
    }
  }
  return webViewVersion ?? undefined;
};

export const shouldRemountOnFirstLoad = (): boolean =>
  Platform.OS === 'ios' && requiresIosRemount(getWebViewVersion());

/** How long Android autofocus may take to bring up the IME before it is retried. */
export const AUTOFOCUS_KEYBOARD_CHECK_MS = 1000;

/** 1.0 bottom padding while the keyboard is up and the window resizes for it. */
export const TOOLBAR_HEIGHT = 44;
/** Space between the caret and an overlaying keyboard (1.0 iOS behaviour). */
const KEYBOARD_GAP = 10;
/**
 * Space kept between the caret and whatever covers the bottom of the editor,
 * about one line of text.
 */
export const CARET_MARGIN = 24;

export interface CoverFrame {
  top: number;
  bottom: number;
}

/**
 * How far the cover reaches up into the editor, in window coordinates: the
 * keyboard (from `keyboardTop`) and the views drawn on it (`accessories`,
 * such as the toolbar). Views that start above the editor's top are not on
 * the keyboard (a static toolbar above the editor) and are ignored. An
 * editor that reaches well behind the keyboard with no view registered on
 * it likely has a bar of the app's own there (a 1.0 custom toolbar), so a
 * toolbar's height is kept clear above the keyboard. Negative when the
 * cover ends below the editor, 0 when nothing covers it.
 */
export const getCoverOverlap = (
  editor: CoverFrame,
  accessories: readonly CoverFrame[],
  keyboardTop: number | null
): number => {
  let coverTop = Infinity;
  for (const accessory of accessories) {
    if (accessory.top > editor.top && accessory.bottom > accessory.top) {
      coverTop = Math.min(coverTop, accessory.top);
    }
  }
  if (keyboardTop !== null) {
    const unregisteredBar =
      coverTop === Infinity && editor.bottom - keyboardTop > TOOLBAR_HEIGHT;
    coverTop = Math.min(
      coverTop,
      unregisteredBar ? keyboardTop - TOOLBAR_HEIGHT : keyboardTop
    );
  }
  return Number.isFinite(coverTop) ? editor.bottom - coverTop : 0;
};

export interface CaretScrollInput {
  /** The caret in window coordinates. */
  caret: CoverFrame;
  /** The part of the scroll view nothing covers, in window coordinates. */
  visible: CoverFrame;
  /** The scroll view's current content offset. */
  scrollOffset: number;
  margin: number;
}

/**
 * The content offset that brings the caret `margin` inside the visible part
 * of a scroll view, or null when it already is.
 */
export const getCaretScroll = ({
  caret,
  visible,
  scrollOffset,
  margin,
}: CaretScrollInput): number | null => {
  if (caret.bottom + margin > visible.bottom) {
    return scrollOffset + caret.bottom + margin - visible.bottom;
  }
  if (caret.top - margin < visible.top) {
    return Math.max(0, scrollOffset - (visible.top - caret.top + margin));
  }
  return null;
};

export interface KeyboardInsetsInput {
  platform: string;
  avoidKeyboard: boolean;
  dynamicHeight: boolean;
  scrollBottomOffset: number | undefined;
  isKeyboardUp: boolean;
  keyboardHeight: number;
  /** The keyboard covers the window instead of resizing it. */
  windowOverlaysKeyboard: boolean;
  /**
   * Measured reach of the keyboard and toolbar into the editor
   * (`getCoverOverlap`), null until the editor was measured.
   */
  coverOverlap?: number | null;
}

export interface KeyboardInsets {
  /** `.ProseMirror` bottom padding in px. */
  padding: number;
  /** Bottom scroll threshold and margin in px. */
  scrollThreshold: number;
}

/**
 * Bottom insets that keep the caret `CARET_MARGIN` above the keyboard and
 * the toolbar on it, or above the editor's own bottom edge when that ends
 * higher, or `null` when RichText should leave them to the app.
 *
 * The inset is how far the keyboard and toolbar reach into the editor as
 * measured in the window, so it holds wherever the editor ends: behind the
 * keyboard, above a `KeyboardAvoidingView`, or inside one that already
 * avoids it. Until the first measurement it falls back to the keyboard
 * height (or, where the window resizes, the toolbar height), which only an
 * editor set to `avoidIosKeyboard` gets, as in 1.0. Dynamic-height editors
 * get no keyboard inset, since it would feed back into the measured height
 * (#336); they keep the constant `scrollBottomOffset`, which a capped
 * editor needs to scroll its last line above something drawn over it
 * (#308).
 */
export const getKeyboardInsets = ({
  platform,
  avoidKeyboard,
  dynamicHeight,
  scrollBottomOffset,
  isKeyboardUp,
  keyboardHeight,
  windowOverlaysKeyboard,
  coverOverlap = null,
}: KeyboardInsetsInput): KeyboardInsets | null => {
  const native = platform === 'ios' || platform === 'android';
  const keyboardUp = native && isKeyboardUp && !dynamicHeight;
  const measured = keyboardUp && coverOverlap !== null;
  if (!avoidKeyboard && scrollBottomOffset === undefined && !measured) {
    return null;
  }
  const offset = scrollBottomOffset ?? 0;
  let keyboardInset = 0;
  if (measured) {
    keyboardInset = Math.ceil(Math.max(0, coverOverlap) + CARET_MARGIN);
  } else if (keyboardUp && avoidKeyboard && keyboardHeight > 0) {
    keyboardInset = windowOverlaysKeyboard
      ? keyboardHeight + KEYBOARD_GAP
      : TOOLBAR_HEIGHT;
  }
  const inset = keyboardInset + offset;
  return { padding: inset, scrollThreshold: inset };
};

/** Sets the editor's bottom padding; `0` restores the stylesheet value. */
export const buildBottomPaddingScript = (padding: number): string =>
  '(function(){var e=document.querySelector(".ProseMirror");' +
  `if(e)e.style.paddingBottom=${JSON.stringify(
    padding > 0 ? `${padding}px` : ''
  )}})();true;`;

export interface WebViewStylesInput {
  theme: Pick<EditorBridge['theme'], 'webview' | 'webviewContainer'>;
  /** False hides the WebView until its first load. */
  visible: boolean;
  dynamicHeight: boolean;
  /** Content height reported by the editor. */
  height: number;
  /** Merge the app's `style`/`containerStyle` over the defaults instead of replacing them. */
  mergeStyles: boolean;
  style: StyleProp<ViewStyle>;
  containerStyle: StyleProp<ViewStyle>;
  platform: string;
}

/**
 * `style` and `containerStyle` for the editor WebView.
 *
 * As in 1.0, an app `style` replaces the defaults and an app
 * `containerStyle` replaces the theme's, unless `mergeStyles` is set. The
 * dynamic height is always applied last and overrides the `flex: 1` of
 * react-native-webview, the theme or the app, which would otherwise start
 * Yoga from a basis of 0 and ignore the height (#342). The editor never
 * grows past its content but shrinks to a parent's `maxHeight` or fixed
 * height, and then scrolls (#289, #323). On web the iframe shim reads only
 * `style`, so it gets the height too (#205).
 */
export const getWebViewStyles = ({
  theme,
  visible,
  dynamicHeight,
  height,
  mergeStyles,
  style,
  containerStyle,
  platform,
}: WebViewStylesInput): {
  style: StyleProp<ViewStyle>;
  containerStyle: StyleProp<ViewStyle>;
} => {
  // `flex: 0` leaves an auto basis that Fabric recomputes as the height
  // changes; longhands next to `flex: 1` kept the first, empty layout inside
  // a capped parent. On web CSS `flex: 0` means a 0% basis, so the height
  // is the basis there.
  const sized: ViewStyle | undefined = !dynamicHeight
    ? undefined
    : platform === 'web'
      ? { height, flexGrow: 0, flexShrink: 1, flexBasis: height }
      : { height, flex: 0, flexShrink: 1 };
  // Hidden with opacity, not `display: none`: a WebView first laid out at
  // 0x0 keeps a zero-height root in its Android accessibility tree.
  const defaults: StyleProp<ViewStyle> = [
    { flex: 1 },
    { opacity: visible ? 1 : 0 },
    theme.webview,
  ];
  const keepDefaults = (own: StyleProp<ViewStyle>) =>
    mergeStyles || own === undefined;
  return {
    style: [
      keepDefaults(style) ? defaults : undefined,
      style,
      platform === 'web' ? sized : undefined,
    ],
    containerStyle: [
      keepDefaults(containerStyle) ? theme.webviewContainer : undefined,
      containerStyle,
      sized,
    ],
  };
};
