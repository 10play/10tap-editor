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
import {
  getEditorController,
  type EditorController,
} from '../shared/contracts';
import type { EditorBridge } from '../types';
import type { EditorMessage } from '../types/Messaging';
import { isFabric } from '../utils/misc';
import { useKeyboard } from '../utils/useKeyboard';
import {
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

const isSamePage = (page: Page, inputs: PageInputs) =>
  (Object.keys(inputs) as (keyof PageInputs)[]).every(
    (key) => page[key] === inputs[key]
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
 * `webviewBaseURL`, `dynamicHeight`), so later option changes never reload
 * the WebView with a stale boot config.
 */
const usePage = (editor: EditorBridge, controller: EditorController): Page => {
  const inputs = getPageInputs(editor, controller);
  const [page, setPage] = useState(() => createPage(editor, inputs));
  if (isSamePage(page, inputs)) return page;
  const next = createPage(editor, inputs);
  setPage(next);
  return next;
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
  const fabric = isFabric();

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
  const insets = getKeyboardInsets({
    platform: Platform.OS,
    avoidKeyboard: !!editor.avoidIosKeyboard,
    dynamicHeight: page.dynamicHeight,
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
    dynamicHeight: page.dynamicHeight,
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
          autoFocus
          caretHidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.hiddenInput}
        />
      )}
      <WebView
        key={webViewKey}
        ref={editor.webviewRef}
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
          if (page.dynamicHeight) {
            controller.reportContainerHeight(event.nativeEvent.layout.height);
          }
          props.onLayout?.(event);
        }}
        onRenderProcessGone={(event) => {
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
