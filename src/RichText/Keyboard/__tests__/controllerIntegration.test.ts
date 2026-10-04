import { createKeyboardStore } from '../../../native/keyboardStore';
import {
  createEditorController,
  type NativeEditorController,
} from '../../../native/EditorController';
import { WEB_RUNTIME_CAPABILITIES } from '../../../shared/capabilities';
import {
  attachEditorController,
  type WebViewHandle,
} from '../../../shared/contracts';
import {
  PROTOCOL_TYPES,
  PROTOCOL_VERSION,
  createEditorReadyPayload,
  createWebMessage,
  encodeMessage,
  type ActionEnvelope,
} from '../../../shared/protocol';
import type { BridgeState, EditorBridge } from '../../../types';
import type { NativeKeyboardModule } from '../drivers';
import { createEditorChannel } from '../editorChannel';
import {
  createKeyboardSession,
  type KeyboardSessionOptions,
} from '../keyboardSession';
import {
  IOS_ANIMATION,
  createFakeBackHandler,
  createFakeKeyboard,
  createFakeLayoutAnimation,
  createFakeNativeModule,
  createFakePage,
  flush,
  type FakeNativeModule,
  type FakePage,
} from './fakes';

/**
 * The keyboard against the real `EditorController`: scripts go through its
 * outbox and persistent registry, and run in a fake page whose messages come
 * back through `handleWebViewMessage`.
 */

const EDITOR_ID = 'tt-keyboard';

interface EditorState {
  isReady: boolean;
  isFocused: boolean;
}

/** Commands and scripts as the WebView receives them, in order. */
type Delivery =
  { kind: 'script'; js: string } | { kind: 'command'; type: string };

class PageWebView implements WebViewHandle {
  readonly deliveries: Delivery[] = [];

  constructor(public page: FakePage) {}

  postMessage(data: string): void {
    const envelope = JSON.parse(data) as ActionEnvelope;
    this.deliveries.push({ kind: 'command', type: envelope.payload.type });
  }

  injectJavaScript(js: string): void {
    this.deliveries.push({ kind: 'script', js });
    this.page.run(js);
  }

  requestFocus(): void {}

  reload(): void {}
}

const createControllerEditor = (
  controller: NativeEditorController<EditorState>
): EditorBridge => {
  const editor = {
    theme: { webview: {}, webviewContainer: {} },
    webviewRef: { current: null },
    getEditorState: () => controller.getState() as unknown as BridgeState,
    _subscribeToEditorStateUpdate: (cb: (state: BridgeState) => void) =>
      controller.subscribeState((state) => cb(state as unknown as BridgeState)),
    focus: jest.fn(() => controller.send({ type: 'focus' })),
    blur: jest.fn(() => controller.send({ type: 'blur' })),
  } as unknown as EditorBridge;
  attachEditorController(editor, controller);
  return editor;
};

const setup = ({
  platform = 'ios',
  native = createFakeNativeModule(),
  focused = true,
  ready = true,
}: {
  platform?: 'ios' | 'android';
  native?: FakeNativeModule | null;
  focused?: boolean;
  ready?: boolean;
} = {}) => {
  const controller = createEditorController<EditorState>({
    platform,
    initialState: { isReady: false, isFocused: false },
    editorId: EDITOR_ID,
  });
  const fromPage = (data: string) => controller.handleWebViewMessage(data);
  const newPage = () =>
    createFakePage({ runtime: true, editorId: EDITOR_ID, onPost: fromPage });
  const webView = new PageWebView(newPage());
  controller.attach();
  controller.setWebView(webView);
  controller.onLoadStart();

  const post = (type: string, payload?: unknown) =>
    controller.handleWebViewMessage(
      encodeMessage(createWebMessage(type, payload, EDITOR_ID))
    );
  const boot = () => {
    post(
      PROTOCOL_TYPES.EditorReady,
      createEditorReadyPayload(EDITOR_ID, WEB_RUNTIME_CAPABILITIES)
    );
    post(PROTOCOL_TYPES.StateUpdate, { isReady: true, isFocused: focused });
  };
  if (ready) boot();

  const keyboard = createFakeKeyboard();
  const store = createKeyboardStore({
    keyboard,
    getWindowSize: () => ({ width: 390, height: 844 }),
    platform,
  });
  const editor = createControllerEditor(controller);
  const options: KeyboardSessionOptions = {
    closeOnEditorPress: true,
    androidKeyboardMode: 'system',
    heightOf: () => undefined,
    onActiveKeyboardChange: jest.fn(),
  };
  const session = createKeyboardSession({
    platform,
    editor,
    channel: createEditorChannel(editor),
    store,
    nativeModule: native as NativeKeyboardModule | null,
    forceFallback: false,
    getHiddenInput: () => ({ focus: jest.fn() }),
    layoutAnimation: createFakeLayoutAnimation().layoutAnimation,
    backHandler: createFakeBackHandler().backHandler,
    getOptions: () => options,
  });
  session.attach();
  keyboard.emit('keyboardWillShow', 300, IOS_ANIMATION);
  keyboard.emit('keyboardDidShow', 300);

  /** The WebView reloads: a fresh page boots and handshakes again. */
  const reload = () => {
    webView.page = newPage();
    controller.onLoadStart();
    boot();
  };

  const openFully = async (id = 'kb') => {
    session.open(id);
    await flush();
    keyboard.emit('keyboardWillHide', 300, IOS_ANIMATION);
    await flush();
    expect(session.getView().phase).toBe('open');
  };

  return {
    controller,
    webView,
    editor,
    session,
    native,
    options,
    post,
    boot,
    reload,
    openFully,
    phase: () => session.getView().phase,
  };
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('custom keyboard with the editor controller', () => {
  it('closes on a tap the injected listener reports from the page', async () => {
    const t = setup();
    await t.openFully();
    t.webView.page.tap(true);
    expect(t.phase()).toBe('open');

    t.webView.page.tap();
    expect(t.webView.page.postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        type: PROTOCOL_TYPES.EditorPress,
        editorId: EDITOR_ID,
        v: PROTOCOL_VERSION,
      })
    );
    expect(t.phase()).toBe('closing');
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenLastCalledWith(
      false
    );
  });

  it("ignores taps posted by another editor's page", async () => {
    const t = setup();
    await t.openFully();
    t.controller.handleWebViewMessage(
      JSON.stringify({ type: PROTOCOL_TYPES.EditorPress, editorId: 'tt-other' })
    );
    expect(t.phase()).toBe('open');
  });

  it("closes on the app's editor.focus() but not on its own", async () => {
    const t = setup({ native: null, focused: false });
    t.session.open('kb');
    expect(t.editor.focus).toHaveBeenCalledTimes(1);
    expect(t.phase()).toBe('opening');

    t.post(PROTOCOL_TYPES.StateUpdate, { isReady: true, isFocused: true });
    await flush();
    expect(t.webView.page.setInputMode).toHaveBeenLastCalledWith('none');

    t.editor.focus();
    expect(t.phase()).toBe('closing');
    expect(t.webView.page.setInputMode).toHaveBeenLastCalledWith(null);
  });

  it('latches inputmode before the focus command of an editor that is still loading', async () => {
    const t = setup({ native: null, focused: false, ready: false });
    t.session.open('kb');
    expect(t.webView.deliveries).toEqual([]);

    t.boot();
    const deliveries = t.webView.deliveries;
    const latch = deliveries.findIndex(
      (delivery) => delivery.kind === 'script' && delivery.js.includes("'none'")
    );
    const focus = deliveries.findIndex(
      (delivery) => delivery.kind === 'command' && delivery.type === 'focus'
    );
    expect(latch).toBeGreaterThanOrEqual(0);
    expect(focus).toBeGreaterThan(latch);
    expect(t.webView.page.setInputMode).toHaveBeenCalledWith('none');
  });

  it('resets after a reload and keeps listening for taps on the new page', async () => {
    const t = setup({ native: null });
    await t.openFully();
    const firstPage = t.webView.page;

    t.reload();
    expect(t.phase()).toBe('closed');
    expect(t.options.onActiveKeyboardChange).toHaveBeenLastCalledWith(
      undefined
    );
    expect(t.webView.page).not.toBe(firstPage);
    expect(t.webView.page.setInputMode).toHaveBeenLastCalledWith(null);

    await t.openFully();
    t.webView.page.tap();
    expect(t.phase()).toBe('closing');
  });

  it('tears down silently after the editor was disposed', async () => {
    const t = setup({ native: null });
    await t.openFully();
    t.controller.dispose();
    t.session.detach();
    expect(console.warn).not.toHaveBeenCalled();
  });
});
