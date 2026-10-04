import {
  LEGACY_VERSIONS,
  loadLegacyBundle,
  type EditorPage,
  type LegacyVersion,
} from '../../__tests__/compat/legacyBundle';
import { TenTapStartKit } from '../../bridges/StarterKit';
import { buildBootConfig, buildBootScript } from '../../shared/bootConfig';
import { CAPABILITIES } from '../../shared/capabilities';
import { TentapUnsupportedError } from '../../shared/errors';
import type { WebViewHandle } from '../../shared/contracts';
import {
  createEditorController,
  type NativeEditorController,
} from '../EditorController';
import { initialState, type TestState } from './helpers';

// TODO(WP-F): drop once the focus tracker no longer touches the DOM at import time (#339).
jest.mock('../../webEditorUtils/focusListener', () => ({
  focusListener: { isFocused: false },
}));

/**
 * The controller driving the real 1.0.1 and 0.7.x web bundles in jsdom, with
 * both directions delivered asynchronously like react-native-webview does.
 */

const EDITOR_ID = 'tt-legacy';

let page: EditorPage | undefined;

afterEach(() => {
  page?.close();
  page = undefined;
});

const until = async (predicate: () => boolean, timeoutMs = 5000) => {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('Timed out waiting');
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
};

const mount = (
  version: LegacyVersion,
  beforeLoad?: (controller: NativeEditorController<TestState>) => void
) => {
  const controller = createEditorController<TestState>({
    platform: 'ios',
    initialState,
    editorId: EDITOR_ID,
  });
  const webView: WebViewHandle = {
    postMessage: (data) => setTimeout(() => page?.postMessage(data)),
    injectJavaScript: (js) => setTimeout(() => page?.injectJavaScript(js)),
    requestFocus: () => {},
    reload: () => {},
  };
  controller.attach();
  controller.setWebView(webView);
  controller.onLoadStart();
  beforeLoad?.(controller);

  const config = buildBootConfig({
    editorId: EDITOR_ID,
    bridges: TenTapStartKit,
    platform: 'ios',
    initialContent: '<p>Hello</p>',
  });
  page = loadLegacyBundle(version, {
    injectedJavaScriptBeforeContentLoaded: buildBootScript(config),
    onMessage: (data) =>
      setTimeout(() => controller.handleWebViewMessage(data)),
  });
  controller.onLoad();
  controller.onLoadEnd();
  return controller;
};

describe.each(LEGACY_VERSIONS)('controller with the %s bundle', (version) => {
  it('becomes ready as a legacy bundle (#343)', async () => {
    const controller = mount(version);

    await until(() => controller.isReady());

    expect(controller.getCapabilities().legacy).toBe(true);
    expect(controller.getState().isReady).toBe(true);
  });

  it('delivers commands issued before the bundle is ready (#227, #299)', async () => {
    const controller = mount(version, (early) => {
      early.send({ type: 'set-content', payload: { content: '<p>Early</p>' } });
    });
    const html = controller.rpc<string>({ type: 'get-html' });

    await expect(html).resolves.toBe('<p>Early</p>');
    expect(controller['rpcs'].size).toBe(0);
  });

  it('answers RPCs and applies CSS and persistent scripts', async () => {
    const controller = mount(version);
    controller.injectCSS('p { color: red; }', 'compat-css');
    controller.registerPersistentScript(
      'marker',
      '(function(){document.body.setAttribute("data-marker","1")})();true;'
    );
    await until(() => controller.isReady());

    await expect(controller.rpc({ type: 'get-text' })).resolves.toBe('Hello');
    const { document } = page!.window;
    expect(
      document.querySelector('style[data-tag="compat-css"]')?.textContent
    ).toBe('p { color: red; }');
    expect(document.body.getAttribute('data-marker')).toBe('1');
    expect(page!.errors).toEqual([]);
  });

  it('rejects requests the bundle cannot answer', async () => {
    const controller = mount(version);
    await expect(
      controller.rpc(
        { type: 'get-selected-text' },
        { capability: CAPABILITIES.SelectedText }
      )
    ).rejects.toBeInstanceOf(TentapUnsupportedError);
  });
});
