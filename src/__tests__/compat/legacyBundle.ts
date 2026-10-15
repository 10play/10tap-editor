import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { JSDOM, VirtualConsole, type DOMWindow } from 'jsdom';

/**
 * Runs a real editor web bundle (the `editorHtml` a WebView would load) in
 * jsdom, so compat tests can talk to the exact bundles shipped in 1.0.1 and
 * 0.7.x (test/fixtures/legacy, extracted from the npm tarballs).
 */

const LEGACY_DIR = path.resolve(__dirname, '../../../test/fixtures/legacy');

export const LEGACY_VERSIONS = ['1.0.1', '0.7.5-alpha.0'] as const;
export type LegacyVersion = (typeof LEGACY_VERSIONS)[number];

type LegacyManifest = Record<string, { file: string; sha256: string }>;

/** The published HTML, verified against the checksum recorded at extraction. */
export const readLegacyHtml = (version: LegacyVersion): string => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(LEGACY_DIR, 'manifest.json'), 'utf8')
  ) as LegacyManifest;
  const entry = manifest[version];
  if (!entry) throw new Error(`No legacy bundle recorded for ${version}`);
  const html = fs.readFileSync(path.join(LEGACY_DIR, entry.file), 'utf8');
  if (createHash('sha256').update(html).digest('hex') !== entry.sha256) {
    throw new Error(
      `${entry.file} was modified; restore it with test/fixtures/legacy/extract.js`
    );
  }
  return html;
};

export interface WebMessage {
  type: string;
  payload?: unknown;
}

export interface LoadPageOptions {
  /** Same contract as react-native-webview's prop of that name. */
  injectedJavaScriptBeforeContentLoaded?: string;
  /** Receives every raw string the page posts to native. */
  onMessage?: (data: string) => void;
}

export interface EditorPage {
  readonly window: DOMWindow;
  /** Messages posted through `window.ReactNativeWebView`, parsed, in order. */
  readonly messages: WebMessage[];
  /** Uncaught errors from page scripts. */
  readonly errors: Error[];
  /** Delivers a native message the way react-native-webview does on iOS. */
  postMessage: (data: string) => void;
  injectJavaScript: (script: string) => void;
  /** Resolves with the first posted message (past or future) matching `predicate`. */
  waitForMessage: (
    predicate: (message: WebMessage) => boolean,
    timeoutMs?: number
  ) => Promise<WebMessage>;
  close: () => void;
}

type PageWindow = DOMWindow & {
  ReactNativeWebView: { postMessage: (data: string) => void };
};

const MODULE_SCRIPT =
  /<script\b[^>]*\btype="module"[^>]*>([\s\S]*?)<\/script>/gi;

/**
 * jsdom does not run module scripts, so they are cut out of the document and
 * evaluated after parsing (where the browser would run them), wrapped to keep
 * module scope and strict mode. Vite's single-file output may end with
 * `export default x();`, which is kept as a plain statement.
 */
const splitModuleScripts = (html: string) => {
  const scripts: string[] = [];
  const document = html.replace(MODULE_SCRIPT, (_tag, body: string) => {
    scripts.push(body.replace(/\bexport\s+default\s+([^;]+;)\s*$/, '$1'));
    return '';
  });
  return { document, scripts };
};

/** APIs ProseMirror and the 1.0 runtime touch that jsdom lacks. */
const installBrowserStubs = (window: DOMWindow) => {
  class StubEvent extends window.Event {}
  class NoopResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.assign(window, {
    ClipboardEvent: window.ClipboardEvent ?? StubEvent,
    DragEvent: window.DragEvent ?? StubEvent,
    ResizeObserver: window.ResizeObserver ?? NoopResizeObserver,
  });
  const rangePrototype = window.Range.prototype;
  const emptyRect = () => new window.DOMRect(0, 0, 0, 0);
  rangePrototype.getBoundingClientRect ??= emptyRect;
  rangePrototype.getClientRects ??= () =>
    Object.assign([], { item: () => null }) as unknown as DOMRectList;
  window.document.elementFromPoint ??= () => null;
};

export const loadEditorPage = (
  html: string,
  { injectedJavaScriptBeforeContentLoaded, onMessage }: LoadPageOptions = {}
): EditorPage => {
  const messages: WebMessage[] = [];
  const errors: Error[] = [];
  const virtualConsole = new VirtualConsole().on('jsdomError', (error) => {
    errors.push(error);
  });
  const { document, scripts } = splitModuleScripts(html);

  const dom = new JSDOM(document, {
    url: 'about:blank',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse: (window) => {
      installBrowserStubs(window);
      (window as PageWindow).ReactNativeWebView = {
        postMessage: (data: string) => {
          messages.push(JSON.parse(data) as WebMessage);
          onMessage?.(data);
        },
      };
      if (injectedJavaScriptBeforeContentLoaded) {
        window.eval(injectedJavaScriptBeforeContentLoaded);
      }
    },
  });
  const { window } = dom;
  for (const script of scripts) {
    window.eval(`(function(){"use strict";${script}\n})();`);
  }

  const waitForMessage: EditorPage['waitForMessage'] = (
    predicate,
    timeoutMs = 3000
  ) =>
    new Promise((resolve, reject) => {
      const deadline = Date.now() + timeoutMs;
      const check = () => {
        const match = messages.find(predicate);
        if (match) resolve(match);
        else if (Date.now() > deadline) {
          reject(
            new Error(
              `No matching message within ${timeoutMs}ms; got ${JSON.stringify(
                messages.map((message) => message.type)
              )}`
            )
          );
        } else setTimeout(check, 5);
      };
      check();
    });

  return {
    window,
    messages,
    errors,
    postMessage: (data) => {
      window.dispatchEvent(new window.MessageEvent('message', { data }));
    },
    injectJavaScript: (script) => {
      window.eval(script);
    },
    waitForMessage,
    close: () => window.close(),
  };
};

export const loadLegacyBundle = (
  version: LegacyVersion,
  options?: LoadPageOptions
): EditorPage => loadEditorPage(readLegacyHtml(version), options);
