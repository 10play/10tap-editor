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

export interface KeyboardInsetsInput {
  platform: string;
  avoidKeyboard: boolean;
  dynamicHeight: boolean;
  scrollBottomOffset: number | undefined;
  isKeyboardUp: boolean;
  keyboardHeight: number;
  /** The keyboard covers the window instead of resizing it. */
  windowOverlaysKeyboard: boolean;
}

export interface KeyboardInsets {
  /** `.ProseMirror` bottom padding in px. */
  padding: number;
  /** Bottom scroll threshold and margin in px. */
  scrollThreshold: number;
}

/**
 * Bottom insets that keep the caret above the keyboard and toolbar, or
 * `null` when RichText should leave them to the app (no `avoidKeyboard`
 * and no `scrollBottomOffset`, as in 1.0).
 *
 * Where the keyboard overlays the window (iOS, Android `'stable'` mode or
 * edge-to-edge) the inset is the keyboard height; where the window resizes
 * it is only the toolbar. Dynamic-height editors get no padding, since it
 * would feed back into the measured height (#336).
 */
export const getKeyboardInsets = ({
  platform,
  avoidKeyboard,
  dynamicHeight,
  scrollBottomOffset,
  isKeyboardUp,
  keyboardHeight,
  windowOverlaysKeyboard,
}: KeyboardInsetsInput): KeyboardInsets | null => {
  if (!avoidKeyboard && scrollBottomOffset === undefined) return null;
  const offset = scrollBottomOffset ?? 0;
  if (dynamicHeight) return { padding: 0, scrollThreshold: offset };

  const native = platform === 'ios' || platform === 'android';
  const keyboardUp = avoidKeyboard && native && isKeyboardUp;
  let keyboardInset = 0;
  if (keyboardUp && keyboardHeight > 0) {
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
