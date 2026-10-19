import React, { forwardRef, useImperativeHandle, useLayoutEffect } from 'react';
import { View, type NativeSyntheticEvent } from 'react-native';
import type { WebViewProps } from 'react-native-webview';

type WebViewSource = NonNullable<WebViewProps['source']>;
type NativeEventOf<K extends keyof WebViewProps> =
  NonNullable<WebViewProps[K]> extends (
    event: NativeSyntheticEvent<infer T>
  ) => void
    ? T
    : never;
type HostInstance = NativeSyntheticEvent<unknown>['target'];

export interface WebViewHandle {
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  stopLoading: () => void;
  injectJavaScript: (script: string) => void;
  requestFocus: () => void;
  postMessage: (message: string) => void;
  clearFormData: () => void;
  clearCache: (includeDiskFiles: boolean) => void;
  clearHistory: () => void;
}

/**
 * Recorded state of one mounted mock WebView. Simulated events call the latest
 * props, so tests should wrap them in `act`.
 */
export interface MockWebView {
  readonly id: number;
  props: WebViewProps;
  mounted: boolean;
  /** Every distinct `source` object the WebView received, in order. */
  readonly sources: WebViewSource[];
  /** Scripts passed to `injectJavaScript`. */
  readonly injectedJavaScript: string[];
  /** Messages passed to `postMessage`. */
  readonly postedMessages: string[];
  reloadCount: number;
  focusRequestCount: number;
  /** Simulates a message from the web side; non-string data is JSON encoded. */
  simulateMessage: (data: unknown) => void;
  simulateLoadStart: () => void;
  simulateLoad: () => void;
  simulateLoadEnd: () => void;
  simulateRenderProcessGone: (didCrash?: boolean) => void;
  simulateContentProcessDidTerminate: () => void;
}

const instances: MockWebView[] = [];
let nextId = 1;
let newHandleEveryRender = false;

export const mockWebViews = {
  get instances(): readonly MockWebView[] {
    return instances;
  },
  /** The most recently created WebView. Throws if none was rendered. */
  latest(): MockWebView {
    const last = instances[instances.length - 1];
    if (!last) {
      throw new Error('No mock WebView has been rendered');
    }
    return last;
  },
  /**
   * Hands out a new imperative handle on every render, as
   * react-native-web-webview does.
   */
  set newHandleEveryRender(value: boolean) {
    newHandleEveryRender = value;
  },
  reset() {
    instances.length = 0;
    nextId = 1;
    newHandleEveryRender = false;
  },
};

const hostInstance: HostInstance = {
  measure: () => {},
  measureInWindow: () => {},
  measureLayout: () => {},
  setNativeProps: () => {},
  focus: () => {},
  blur: () => {},
};

const syntheticEvent = <T,>(nativeEvent: T): NativeSyntheticEvent<T> => {
  let defaultPrevented = false;
  let propagationStopped = false;
  return {
    nativeEvent,
    bubbles: false,
    cancelable: false,
    currentTarget: hostInstance,
    target: hostInstance,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: true,
    timeStamp: Date.now(),
    type: '',
    preventDefault: () => {
      defaultPrevented = true;
    },
    isDefaultPrevented: () => defaultPrevented,
    stopPropagation: () => {
      propagationStopped = true;
    },
    isPropagationStopped: () => propagationStopped,
    persist: () => {},
  };
};

const sourceUrl = (source: WebViewSource | undefined) => {
  if (source && 'uri' in source && source.uri) return source.uri;
  if (source && 'baseUrl' in source && source.baseUrl) return source.baseUrl;
  return 'about:blank';
};

const createMockWebView = (initialProps: WebViewProps): MockWebView => {
  const navigation = (loading: boolean): NativeEventOf<'onLoad'> => ({
    url: sourceUrl(webView.props.source),
    loading,
    title: '',
    canGoBack: false,
    canGoForward: false,
    lockIdentifier: 0,
    navigationType: 'other',
  });

  const webView: MockWebView = {
    id: nextId++,
    props: initialProps,
    mounted: false,
    sources: [],
    injectedJavaScript: [],
    postedMessages: [],
    reloadCount: 0,
    focusRequestCount: 0,
    simulateMessage: (data) => {
      const { navigationType: _, ...base } = navigation(false);
      webView.props.onMessage?.(
        syntheticEvent({
          ...base,
          data: typeof data === 'string' ? data : JSON.stringify(data),
        })
      );
    },
    simulateLoadStart: () => {
      webView.props.onLoadStart?.(syntheticEvent(navigation(true)));
    },
    simulateLoad: () => {
      webView.props.onLoad?.(syntheticEvent(navigation(false)));
    },
    simulateLoadEnd: () => {
      webView.props.onLoadEnd?.(syntheticEvent(navigation(false)));
    },
    simulateRenderProcessGone: (didCrash = true) => {
      webView.props.onRenderProcessGone?.(syntheticEvent({ didCrash }));
    },
    simulateContentProcessDidTerminate: () => {
      const { navigationType: _, ...base } = navigation(false);
      webView.props.onContentProcessDidTerminate?.(syntheticEvent(base));
    },
  };
  return webView;
};

const MockWebViewComponent = forwardRef<WebViewHandle, WebViewProps>(
  (props, ref) => {
    const [webView] = React.useState(() => createMockWebView(props));

    useLayoutEffect(() => {
      webView.props = props;
      const lastSource = webView.sources[webView.sources.length - 1];
      if (props.source && props.source !== lastSource) {
        webView.sources.push(props.source);
      }
    });

    useLayoutEffect(() => {
      webView.mounted = true;
      if (!instances.includes(webView)) instances.push(webView);
      return () => {
        webView.mounted = false;
      };
    }, [webView]);

    useImperativeHandle(
      ref,
      () => ({
        goBack: () => {},
        goForward: () => {},
        reload: () => {
          webView.reloadCount += 1;
        },
        stopLoading: () => {},
        injectJavaScript: (script) => {
          webView.injectedJavaScript.push(script);
        },
        requestFocus: () => {
          webView.focusRequestCount += 1;
        },
        postMessage: (message) => {
          webView.postedMessages.push(message);
        },
        clearFormData: () => {},
        clearCache: () => {},
        clearHistory: () => {},
      }),
      // No dependency list, like react-native-web-webview.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      newHandleEveryRender ? undefined : [webView]
    );

    return (
      <View style={props.containerStyle}>
        <View testID={props.testID ?? 'webview'} style={props.style} />
      </View>
    );
  }
);

MockWebViewComponent.displayName = 'WebView';

export const WebView = MockWebViewComponent;
export default MockWebViewComponent;
