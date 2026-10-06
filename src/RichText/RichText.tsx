import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Platform, StyleSheet, TextInput } from 'react-native';
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewProps,
} from 'react-native-webview';

import { editorHtml } from '../simpleWebEditor/build/editorHtml';
import { buildBootScript, injectBootIntoHtml } from '../shared/bootConfig';
import { CAPABILITIES } from '../shared/capabilities';
import {
  PROTOCOL_TYPES,
  decodeWebMessage,
  isForEditor,
} from '../shared/protocol';
import {
  getEditorController,
  type EditorController,
} from '../shared/contracts';
import type { EditorBridge } from '../types';
import type { EditorMessage } from '../types/Messaging';
import { isFabric } from '../utils/misc';
import { useKeyboard } from '../utils/useKeyboard';
import { REFOCUS_DELAY_MS } from './Keyboard/drivers';
import {
  AUTOFOCUS_KEYBOARD_CHECK_MS,
  buildBottomPaddingScript,
  getBootConfig,
  getInjectedJS,
  getKeyboardInsets,
  getWebViewStyles,
  shouldRemountOnFirstLoad,
  type KeyboardInsets,
} from './utils';

interface RichTextProps extends WebViewProps {
  editor: EditorBridge;

  /** Makes it so that the onMessage method provided by Tentap does not fire if you have your own custom onMessage method.
   * Introduced for backwards compatibility with previous versions of Tentap that had this behaviour by default.
   * */
  exclusivelyUseCustomOnMessage?: boolean;
}

const styles = StyleSheet.create({
  // Focusable but invisible: Android never focuses a view that is
  // `display: none` (#321).
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: 'none',
  },
});

const DEV_SERVER_URL = 'http://localhost:3000';
const KEYBOARD_PADDING_SCRIPT = 'tentap-keyboard-padding';
/** Android resizes the window after the keyboard event; wait for the new size. */
const ANDROID_INSET_DELAY_MS = 200;

type WebViewSource = NonNullable<WebViewProps['source']>;

interface PageInputs {
  controller: EditorController;
  dev: boolean;
  devServerUrl: string | undefined;
  customSource: string | undefined;
  baseUrl: string | undefined;
  /** The `dynamicHeight` the page boots with. */
  dynamicHeight: boolean;
}

/** One document load: the WebView is keyed on it and its source never changes. */
interface Page extends PageInputs {
  id: number;
  source: WebViewSource;
  /** Guarded boot script, for sources it cannot be inlined into. */
  bootScript: string;
}

let nextPageId = 1;

const NO_INSETS: KeyboardInsets = { padding: 0, scrollThreshold: 0 };
/**
 * Insets last sent through each controller. They outlive RichText, because
 * the controller keeps re-applying them to every page it loads.
 */
const appliedInsets = new WeakMap<EditorController, KeyboardInsets>();

const getPageInputs = (
  editor: EditorBridge,
  controller: EditorController
): PageInputs => ({
  controller,
  dev: !!editor.DEV,
  devServerUrl: editor.DEV_SERVER_URL,
  customSource: editor.customSource,
  baseUrl: editor.webviewBaseURL,
  dynamicHeight: !!editor.dynamicHeight,
});

/** A loaded bundle that can switch dynamic height without a reload. */
const canToggleDynamicHeight = (controller: EditorController) =>
  controller.isReady() && controller.supports(CAPABILITIES.SetDynamicHeight);

const isSamePage = (page: Page, inputs: PageInputs) =>
  (Object.keys(inputs) as (keyof PageInputs)[]).every(
    (key) =>
      page[key] === inputs[key] ||
      (key === 'dynamicHeight' && canToggleDynamicHeight(inputs.controller))
  );

const createPage = (editor: EditorBridge, inputs: PageInputs): Page => {
  const config = getBootConfig(editor, inputs.controller);
  return {
    ...inputs,
    id: nextPageId++,
    source: inputs.dev
      ? { uri: inputs.devServerUrl || DEV_SERVER_URL }
      : {
          html: injectBootIntoHtml(inputs.customSource || editorHtml, config),
          baseUrl: inputs.baseUrl,
        },
    bootScript: buildBootScript(config),
  };
};

/**
 * The current page. It is built once per editor and only rebuilt when an
 * option that needs a new document changes (`DEV`, `customSource`,
 * `webviewBaseURL`, and `dynamicHeight` for bundles that cannot switch it at
 * runtime), so later option changes never reload the WebView with a stale
 * boot config.
 */
const usePage = (editor: EditorBridge, controller: EditorController): Page => {
  const inputs = getPageInputs(editor, controller);
  const [page, setPage] = useState(() => createPage(editor, inputs));
  if (isSamePage(page, inputs)) return page;
  const next = createPage(editor, inputs);
  setPage(next);
  return next;
};

/**
 * The editor's `dynamicHeight`. When it differs from what the page booted
 * with, the page switches it at runtime; the message is coalesced, so it is
 * replayed after a reload of the same page.
 */
const useDynamicHeight = (
  editor: EditorBridge,
  controller: EditorController,
  page: Page
): boolean => {
  const dynamicHeight = !!editor.dynamicHeight;
  const applied = useRef({ page: page.id, value: page.dynamicHeight });
  useEffect(() => {
    if (applied.current.page !== page.id) {
      applied.current = { page: page.id, value: page.dynamicHeight };
    }
    if (applied.current.value === dynamicHeight) return;
    applied.current.value = dynamicHeight;
    controller.send(
      { type: PROTOCOL_TYPES.SetDynamicHeight, payload: dynamicHeight },
      { coalesceKey: PROTOCOL_TYPES.SetDynamicHeight }
    );
  }, [controller, dynamicHeight, page]);
  return dynamicHeight;
};

const useController = (editor: EditorBridge): EditorController => {
  const controller = getEditorController(editor);
  if (!controller) {
    throw new Error(
      '[TenTap] RichText needs the editor returned by useEditorBridge.'
    );
  }
  return controller;
};

/**
 * react-native-web-webview replaces its imperative handle on every render
 * (`null`, then a new object around the same iframe). The controller would
 * read that as a new page and drop back to `loading`, so on web it gets one
 * handle per WebView instance that forwards to the latest one.
 */
const createForwardingWebView = () => {
  let target: WebView | null = null;
  const handle = new Proxy({} as WebView, {
    get: (_, key) => {
      const value: unknown =
        target === null ? undefined : Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  const setTarget = (next: WebView | null) => {
    if (next !== null) target = next;
  };
  return { handle, setTarget };
};

/**
 * Android autofocus shows the IME through a hidden autoFocus TextInput. That
 * request is lost when its window has no focus yet (a Modal) or when the
 * previous screen's editor hides the IME while unmounting, so once the
 * editor autofocused, an IME that is still down is shown again the same way.
 */
const useAndroidAutofocusKeyboard = (
  editor: EditorBridge,
  controller: EditorController,
  hiddenInput: React.RefObject<TextInput | null>,
  isKeyboardUp: boolean
) => {
  const enabled = Platform.OS === 'android' && editor.autofocus;
  const keyboardUp = useRef(isKeyboardUp);
  useLayoutEffect(() => {
    keyboardUp.current = isKeyboardUp;
  });
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const showKeyboard = () => {
      const input = hiddenInput.current;
      const focusedInput = TextInput.State.currentlyFocusedInput();
      if (
        !input ||
        keyboardUp.current ||
        (focusedInput !== null && focusedInput !== input)
      ) {
        return;
      }
      // Focusing an input that already has focus does not show the IME.
      if (focusedInput === input) input.blur();
      input.focus();
      timer = setTimeout(() => editor.focus?.(), REFOCUS_DELAY_MS);
    };
    const unsubscribe = controller.subscribeReady((ready) => {
      clearTimeout(timer);
      if (ready) timer = setTimeout(showKeyboard, AUTOFOCUS_KEYBOARD_CHECK_MS);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [controller, editor, enabled, hiddenInput]);
};

let warnedAboutExclusiveOnMessage = false;

export const RichText = ({
  editor,
  onMessage,
  exclusivelyUseCustomOnMessage,
  style,
  containerStyle,
  ...props
}: RichTextProps) => {
  const controller = useController(editor);
  const page = usePage(editor, controller);
  const dynamicHeight = useDynamicHeight(editor, controller, page);
  const fabric = isFabric();
  const autofocusInput = useRef<TextInput>(null);

  // The WebView stays hidden until it loads (not until the editor is ready),
  // except on Fabric.
  const [loadedPage, setLoadedPage] = useState<number>();
  const visible = fabric || loadedPage === page.id;

  // react-native-webview 13.12.3-13.12.4 on iOS: the first instance is
  // replaced after it loads and never counts as ready.
  const [remountedPage, setRemountedPage] = useState<number>();
  const remountPending =
    remountedPage !== page.id && shouldRemountOnFirstLoad();

  // Android cannot reuse a WebView whose renderer is gone; mount a new one.
  const [rendererLosses, setRendererLosses] = useState(0);

  const webViewKey = [
    page.id,
    remountPending ? 'first' : 'main',
    rendererLosses,
  ].join(':');

  const forwardingWebView = useMemo(
    () => (Platform.OS === 'web' ? createForwardingWebView() : null),
    // One per WebView instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [webViewKey]
  );
  useLayoutEffect(() => {
    if (!forwardingWebView) return;
    controller.setWebView(forwardingWebView.handle);
    return () => controller.setWebView(null);
  }, [controller, forwardingWebView]);

  useLayoutEffect(() => {
    if (!remountPending) return;
    controller.setRemountPending(true);
    return () => controller.setRemountPending(false);
  }, [controller, remountPending]);

  // Messages that arrive before the WebView is shown are held back, so
  // readiness (and autofocus with it) never happens on a hidden WebView.
  const inbox = useRef<{ open: boolean; queue: unknown[] }>({
    open: fabric,
    queue: [],
  });
  useLayoutEffect(() => {
    inbox.current = { open: fabric, queue: [] };
  }, [fabric, page]);
  useEffect(() => {
    if (!visible || inbox.current.open) return;
    const { queue } = inbox.current;
    inbox.current = { open: true, queue: [] };
    queue.forEach((data) => controller.handleWebViewMessage(data));
  }, [controller, visible]);

  const exclusive = (exclusivelyUseCustomOnMessage ?? true) && !!onMessage;
  const exclusiveRef = useRef(exclusive);
  useLayoutEffect(() => {
    exclusiveRef.current = exclusive;
  });

  // Every accepted message is dispatched to the bridges, as in 1.0.
  useLayoutEffect(
    () =>
      controller.subscribeMessages(({ type, payload }) => {
        if (exclusiveRef.current) return;
        const message = { type, payload } as EditorMessage;
        editor.bridgeExtensions?.forEach((bridge) =>
          bridge.onEditorMessage?.(message, editor)
        );
      }),
    [controller, editor]
  );

  useEffect(() => {
    if (
      !__DEV__ ||
      warnedAboutExclusiveOnMessage ||
      !onMessage ||
      exclusivelyUseCustomOnMessage !== undefined
    ) {
      return;
    }
    warnedAboutExclusiveOnMessage = true;
    console.warn(
      '[TenTap] RichText got an onMessage prop, so bridges no longer receive ' +
        'editor messages (onChange and custom bridges stop working). Pass ' +
        'exclusivelyUseCustomOnMessage={false} to keep them, or ' +
        'exclusivelyUseCustomOnMessage to silence this warning.'
    );
  }, [exclusivelyUseCustomOnMessage, onMessage]);

  const subscribeHeight = useCallback(
    (listener: () => void) => controller.subscribeHeight(listener),
    [controller]
  );
  const getHeight = useCallback(() => controller.getHeight(), [controller]);
  const contentHeight = useSyncExternalStore(subscribeHeight, getHeight) ?? 0;

  const { isKeyboardUp, keyboardHeight, windowOverlaysKeyboard } =
    useKeyboard();
  useAndroidAutofocusKeyboard(editor, controller, autofocusInput, isKeyboardUp);
  const insets = getKeyboardInsets({
    platform: Platform.OS,
    avoidKeyboard: !!editor.avoidIosKeyboard,
    dynamicHeight,
    scrollBottomOffset: editor.scrollBottomOffset,
    isKeyboardUp,
    keyboardHeight,
    windowOverlaysKeyboard,
  });
  const padding = insets?.padding;
  const scrollThreshold = insets?.scrollThreshold;
  useEffect(() => {
    if (padding === undefined || scrollThreshold === undefined) return;
    const previous = appliedInsets.get(controller) ?? NO_INSETS;
    if (
      previous.padding === padding &&
      previous.scrollThreshold === scrollThreshold
    ) {
      return;
    }
    const apply = () => {
      appliedInsets.set(controller, { padding, scrollThreshold });
      if (previous.padding !== padding) {
        controller.registerPersistentScript(
          KEYBOARD_PADDING_SCRIPT,
          buildBottomPaddingScript(padding)
        );
      }
      if (previous.scrollThreshold !== scrollThreshold) {
        // `updateScrollThresholdAndMargin` comes from CoreBridge, which a
        // custom bridge list may omit.
        editor.updateScrollThresholdAndMargin?.(scrollThreshold);
      }
    };
    if (Platform.OS === 'android' && !windowOverlaysKeyboard) {
      const timer = setTimeout(apply, ANDROID_INSET_DELAY_MS);
      return () => clearTimeout(timer);
    }
    apply();
    return undefined;
  }, [controller, editor, padding, scrollThreshold, windowOverlaysKeyboard]);

  const bridgeStyleSheets = useMemo(
    () => getInjectedJS(editor.bridgeExtensions ?? []),
    [editor.bridgeExtensions]
  );

  const webViewStyles = getWebViewStyles({
    theme: editor.theme,
    visible,
    dynamicHeight,
    height: contentHeight,
    mergeStyles: !!editor.mergeStyles,
    style,
    containerStyle,
    platform: Platform.OS,
  });

  // The boot script is part of our own HTML; anything else gets it before
  // content loads and again once loaded, in case that injection lost the race.
  const inlineBoot = !page.dev && props.source === undefined;

  const handleMessage = (event: WebViewMessageEvent) => {
    // On Expo web every WebView may receive every editor's messages (#318).
    const message = decodeWebMessage(event.nativeEvent.data);
    if (message && !isForEditor(message.editorId, controller.editorId)) return;
    onMessage?.(event);
    // The instance about to be replaced must not make the editor ready.
    if (remountPending) return;
    const { data } = event.nativeEvent;
    if (inbox.current.open) controller.handleWebViewMessage(data);
    else inbox.current.queue.push(data);
  };

  return (
    <>
      {editor.autofocus && Platform.OS === 'android' && (
        <TextInput
          ref={autofocusInput}
          autoFocus
          caretHidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.hiddenInput}
        />
      )}
      <WebView
        key={webViewKey}
        ref={forwardingWebView?.setTarget ?? editor.webviewRef}
        scrollEnabled={false}
        source={page.source}
        injectedJavaScript={bridgeStyleSheets}
        injectedJavaScriptBeforeContentLoaded={
          inlineBoot ? undefined : page.bootScript
        }
        hideKeyboardAccessoryView={true}
        webviewDebuggingEnabled={__DEV__}
        keyboardDisplayRequiresUserAction={false}
        {...props}
        style={webViewStyles.style}
        containerStyle={webViewStyles.containerStyle}
        onMessage={handleMessage}
        onLoadStart={(event) => {
          if (!remountPending) controller.onLoadStart();
          props.onLoadStart?.(event);
        }}
        onLoad={(event) => {
          setLoadedPage(page.id);
          if (remountPending) {
            setRemountedPage(page.id);
          } else {
            if (!inlineBoot) {
              editor.webviewRef.current?.injectJavaScript(page.bootScript);
            }
            controller.onLoad();
          }
          props.onLoad?.(event);
        }}
        onLoadEnd={(event) => {
          if (!remountPending) controller.onLoadEnd();
          props.onLoadEnd?.(event);
        }}
        onLayout={(event) => {
          if (dynamicHeight) {
            controller.reportContainerHeight(event.nativeEvent.layout.height);
          }
          props.onLayout?.(event);
        }}
        onRenderProcessGone={(event) => {
          // The dead WebView must not be scripted again; until the new one
          // mounts, everything sent is queued.
          controller.setWebView(null);
          setRendererLosses((count) => count + 1);
          props.onRenderProcessGone?.(event);
        }}
        onContentProcessDidTerminate={(event) => {
          controller.onProcessTerminated();
          props.onContentProcessDidTerminate?.(event);
        }}
      />
    </>
  );
};
