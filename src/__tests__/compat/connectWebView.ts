import { act } from '@testing-library/react-native';
import {
  mockWebViews,
  type MockWebView,
} from '../../__mocks__/react-native-webview';
import { loadEditorPage, type EditorPage } from './legacyBundle';

/**
 * Plays the part of the platform WebView for jest tests: whenever a mock
 * WebView mounts with an `html` source, that HTML is loaded in jsdom, page
 * messages are delivered to `onMessage`, and `postMessage`/`injectJavaScript`
 * calls are forwarded to the page. A remounted WebView gets a fresh page.
 */
export interface WebViewConnection {
  /** The page of the most recently mounted WebView. */
  readonly page: EditorPage | undefined;
  disconnect: () => void;
}

const POLL_MS = 5;

export const connectWebViews = (): WebViewConnection => {
  let webView: MockWebView | undefined;
  let page: EditorPage | undefined;
  let posted = 0;
  let injected = 0;

  const attach = (next: MockWebView) => {
    page?.close();
    webView = next;
    posted = 0;
    injected = 0;
    const { source, injectedJavaScriptBeforeContentLoaded } = next.props;
    if (!source || !('html' in source) || typeof source.html !== 'string') {
      throw new Error('connectWebViews only supports html sources');
    }
    page = loadEditorPage(source.html, {
      injectedJavaScriptBeforeContentLoaded,
      onMessage: (data) => act(() => next.simulateMessage(data)),
    });
    act(() => {
      next.simulateLoadStart();
      next.simulateLoad();
      next.simulateLoadEnd();
    });
  };

  const pump = () => {
    const latest = mockWebViews.instances.findLast((view) => view.mounted);
    if (latest && latest !== webView) attach(latest);
    if (!webView || !page) return;
    while (posted < webView.postedMessages.length) {
      page.postMessage(webView.postedMessages[posted++]!);
    }
    while (injected < webView.injectedJavaScript.length) {
      page.injectJavaScript(webView.injectedJavaScript[injected++]!);
    }
  };

  const timer = setInterval(pump, POLL_MS);
  pump();

  return {
    get page() {
      return page;
    },
    disconnect: () => {
      clearInterval(timer);
      page?.close();
    },
  };
};
