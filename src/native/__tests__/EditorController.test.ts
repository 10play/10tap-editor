import { getWireFixture, FIXTURE_EDITOR_ID } from '../../__fixtures__/wire';
import { CAPABILITIES } from '../../shared/capabilities';
import {
  TentapRpcTimeoutError,
  TentapUnsupportedError,
} from '../../shared/errors';
import {
  LEGACY_READY_TIMEOUT_MS,
  PROTOCOL_TYPES,
  type BridgeMessage,
} from '../../shared/protocol';
import {
  SET_CONTENT_TYPE,
  createBridgeContext,
  createEditorController,
  getLastAttachedController,
} from '../EditorController';
import {
  EDITOR_ID,
  FakeWebView,
  handshake,
  initialState,
  legacyReady,
  setup,
  webMessage,
} from './helpers';

const setContent = (content: string): BridgeMessage => ({
  type: SET_CONTENT_TYPE,
  payload: { content },
});
const setEditable = (editable: boolean): BridgeMessage => ({
  type: 'set-editable',
  payload: editable,
});
const getHTML: BridgeMessage = { type: 'get-html' };
const reply = (messageId: string, content: unknown) =>
  webMessage('send-html-back', { messageId, content }, EDITOR_ID);

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('wire format', () => {
  it('locks the set-content type to the golden fixture', () => {
    expect(SET_CONTENT_TYPE).toBe(
      getWireFixture('core.set-content').message.type
    );
  });

  it('posts v2 envelopes with unique ids and the editor id', () => {
    const { controller, webView } = setup({ editorId: FIXTURE_EDITOR_ID });
    controller.handleWebViewMessage(handshake(FIXTURE_EDITOR_ID));
    controller.send({
      type: 'set-content',
      payload: { content: '<p>Hello</p>' },
    });

    expect(webView.envelopes).toEqual([getWireFixture('envelope.v2').message]);
  });

  it('sets the RPC message id from the shared sequence', () => {
    const { controller, webView } = setup({ editorId: FIXTURE_EDITOR_ID });
    controller.handleWebViewMessage(handshake(FIXTURE_EDITOR_ID));
    void controller.rpc(getHTML);

    expect(webView.messages).toEqual([getWireFixture('core.get-html').message]);
  });
});

describe('readiness', () => {
  it('queues commands until the handshake, then flushes them in order (#227, #299)', () => {
    const { controller, webView } = setup();
    controller.send(setContent('<p>a</p>'));
    controller.send({ type: 'focus', payload: 'end' });
    controller.injectJS('1;');

    expect(webView.envelopes).toEqual([]);
    expect(controller.isReady()).toBe(false);

    controller.handleWebViewMessage(handshake());

    expect(controller.isReady()).toBe(true);
    expect(webView.types).toEqual(['set-content', 'focus']);
    expect(webView.scripts).toEqual(['1;']);
    expect(controller.getCapabilities()).toMatchObject({
      legacy: false,
      protocol: 2,
    });
  });

  it('becomes ready a macrotask after a legacy editor-ready', () => {
    jest.useFakeTimers();
    const { controller, webView } = setup();
    controller.send(setContent('<p>a</p>'));

    controller.handleWebViewMessage(legacyReady());
    expect(controller.isReady()).toBe(false);

    jest.advanceTimersByTime(0);
    expect(controller.isReady()).toBe(true);
    expect(controller.getCapabilities().legacy).toBe(true);
    expect(webView.types).toEqual(['set-content']);
  });

  it('treats a stateUpdate without a handshake as a legacy bundle', () => {
    const { controller, webView } = setup();
    controller.send(setEditable(false));

    controller.handleWebViewMessage(
      webMessage('stateUpdate', { isReady: true, editable: true })
    );

    expect(controller.isReady()).toBe(true);
    expect(controller.getCapabilities().legacy).toBe(true);
    expect(webView.types).toEqual(['set-editable']);
    expect(controller.getState()).toMatchObject({
      isReady: true,
      editable: true,
    });
  });

  it('falls back to ready after the page loaded without any message (#343)', () => {
    jest.useFakeTimers();
    const { controller } = setup();
    controller.onLoad();
    controller.onLoadEnd();

    jest.advanceTimersByTime(LEGACY_READY_TIMEOUT_MS - 1);
    expect(controller.isReady()).toBe(false);
    jest.advanceTimersByTime(1);
    expect(controller.isReady()).toBe(true);
  });

  it('upgrades capabilities when the handshake arrives after the fallback', () => {
    jest.useFakeTimers();
    const { controller, webView } = setup();
    controller.injectCSS('p{}');
    controller.onLoadEnd();
    jest.advanceTimersByTime(LEGACY_READY_TIMEOUT_MS);
    expect(controller.supports(CAPABILITIES.Styles)).toBe(false);
    const readyListener = jest.fn();
    controller.subscribeReady(readyListener);

    controller.handleWebViewMessage(handshake());

    expect(controller.supports(CAPABILITIES.Styles)).toBe(true);
    expect(controller.isReady()).toBe(true);
    expect(readyListener).not.toHaveBeenCalled();
    expect(webView.scripts).toHaveLength(2);
  });

  it('owns isReady in the state store', () => {
    const { controller } = setup();
    controller.setState({ ...initialState, isReady: true });
    expect(controller.getState().isReady).toBe(false);

    controller.handleWebViewMessage(handshake());
    expect(controller.getState().isReady).toBe(true);
    controller.setState({ ...initialState, isReady: false });
    expect(controller.getState().isReady).toBe(true);
  });

  it('notifies ready subscribers and runs onReady once per load, after the flush', () => {
    const typesAtReady: string[][] = [];
    const { controller, webView } = setup({
      onReady: () => typesAtReady.push(webView.types),
    });
    const readyListener = jest.fn();
    controller.subscribeReady(readyListener);
    controller.send({ type: 'blur' });

    controller.handleWebViewMessage(handshake());
    controller.handleWebViewMessage(webMessage('stateUpdate', {}, EDITOR_ID));

    expect(typesAtReady).toEqual([['blur']]);
    expect(readyListener).toHaveBeenCalledTimes(1);
    expect(readyListener).toHaveBeenCalledWith(true);

    controller.onLoadStart();
    expect(readyListener).toHaveBeenLastCalledWith(false);
    controller.handleWebViewMessage(handshake());
    expect(typesAtReady).toHaveLength(2);
  });

  it('ignores messages for other editors and accepts untagged ones (#318)', () => {
    const { controller } = setup();
    const listener = jest.fn();
    controller.subscribeMessages(listener);

    controller.handleWebViewMessage(handshake('tt-other'));
    expect(controller.isReady()).toBe(false);
    expect(listener).not.toHaveBeenCalled();

    controller.handleWebViewMessage(webMessage('content-update'));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores data that is not a message', () => {
    const { controller } = setup();
    const listener = jest.fn();
    controller.subscribeMessages(listener);

    controller.handleWebViewMessage({ type: 'editor-ready' });
    controller.handleWebViewMessage('not json');
    controller.handleWebViewMessage('{"payload":1}');

    expect(listener).not.toHaveBeenCalled();
    expect(controller.isReady()).toBe(false);
  });
});

describe('outbox', () => {
  it('coalesces keyed commands at their last position', () => {
    const { controller, webView } = setup();
    controller.send(setEditable(false), { coalesceKey: 'editable' });
    controller.send(setContent('<p>x</p>'));
    controller.send(setEditable(true), { coalesceKey: 'editable' });

    controller.handleWebViewMessage(handshake());

    expect(webView.messages).toEqual([
      setContent('<p>x</p>'),
      setEditable(true),
    ]);
  });

  it('posts keyed commands immediately once ready', () => {
    const { controller, webView } = setup();
    controller.handleWebViewMessage(handshake());
    controller.send(setEditable(false), { coalesceKey: 'editable' });
    controller.send(setEditable(true), { coalesceKey: 'editable' });

    expect(webView.messages).toEqual([setEditable(false), setEditable(true)]);
  });

  it('never drops content commands or RPCs when it overflows', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { controller, webView } = setup();
    controller.send(setContent('<p>keep</p>'));
    const html = controller.rpc<string>(getHTML);
    for (let i = 0; i < 600; i++) controller.send({ type: 'toggle-bold' });

    controller.handleWebViewMessage(handshake());

    expect(webView.types.slice(0, 2)).toEqual(['set-content', 'get-html']);
    expect(webView.types).toHaveLength(500);
    expect(warn).toHaveBeenCalledTimes(1);

    const request = webView.messages[1] as {
      payload: { messageId: string };
    };
    controller.handleWebViewMessage(
      reply(request.payload.messageId, '<p>keep</p>')
    );
    return expect(html).resolves.toBe('<p>keep</p>');
  });
});

describe('rpc', () => {
  it('resolves by messageId and leaves no pending entry (#346)', async () => {
    const { controller, webView } = setup();
    controller.handleWebViewMessage(handshake());
    const message: BridgeMessage = { type: 'get-html' };

    const pending = Array.from({ length: 3 }, () =>
      controller.rpc<string>(message)
    );
    expect(controller['rpcs'].size).toBe(3);
    webView.messages.forEach((request, index) => {
      const { messageId } = request.payload as { messageId: string };
      controller.handleWebViewMessage(reply(messageId, `<p>${index}</p>`));
    });

    await expect(Promise.all(pending)).resolves.toEqual([
      '<p>0</p>',
      '<p>1</p>',
      '<p>2</p>',
    ]);
    expect(controller['rpcs'].size).toBe(0);
    expect(message).toEqual({ type: 'get-html' });
  });

  it('dispatches replies to subscribers too', () => {
    const { controller, webView } = setup();
    controller.handleWebViewMessage(handshake());
    const listener = jest.fn();
    controller.subscribeMessage('send-html-back', listener);
    void controller.rpc(getHTML);
    const { messageId } = webView.messages[0]!.payload as {
      messageId: string;
    };

    controller.handleWebViewMessage(reply(messageId, 'x'));

    expect(listener).toHaveBeenCalledWith(
      { messageId, content: 'x' },
      expect.objectContaining({ type: 'send-html-back' })
    );
  });

  it('rejects queued requests the legacy bundle cannot answer', async () => {
    jest.useFakeTimers();
    const { controller, webView } = setup();
    const selected = controller.rpc(
      { type: 'get-selected-text' },
      {
        capability: CAPABILITIES.SelectedText,
      }
    );
    void controller.rpc(getHTML);

    controller.handleWebViewMessage(legacyReady());
    jest.advanceTimersByTime(0);

    await expect(selected).rejects.toBeInstanceOf(TentapUnsupportedError);
    expect(webView.types).toEqual(['get-html']);

    await expect(
      controller.rpc(
        { type: 'get-selected-text' },
        { capability: CAPABILITIES.SelectedText }
      )
    ).rejects.toMatchObject({ capability: CAPABILITIES.SelectedText });
    expect(controller['rpcs'].size).toBe(1);
  });

  it('sends capability requests to bundles that advertise them', () => {
    const { controller, webView } = setup();
    void controller.rpc(
      { type: 'get-selected-text' },
      { capability: CAPABILITIES.SelectedText }
    );
    controller.handleWebViewMessage(handshake());

    expect(webView.types).toEqual(['get-selected-text']);
  });

  it('rejects with TentapRpcTimeoutError after rpcTimeoutMs', async () => {
    jest.useFakeTimers();
    const { controller } = setup({ rpcTimeoutMs: 1000 });
    const html = controller.rpc(getHTML);
    const quick = controller.rpc(getHTML, { timeoutMs: 10 });

    jest.advanceTimersByTime(10);
    await expect(quick).rejects.toBeInstanceOf(TentapRpcTimeoutError);
    jest.advanceTimersByTime(990);
    await expect(html).rejects.toMatchObject({
      requestType: 'get-html',
      timeoutMs: 1000,
    });
    expect(controller['rpcs'].size).toBe(0);
  });

  it('has no timeout by default', () => {
    jest.useFakeTimers();
    const { controller } = setup();
    void controller.rpc(getHTML);
    jest.advanceTimersByTime(60_000);
    expect(controller['rpcs'].size).toBe(1);
  });
});

describe('reload', () => {
  const readyWithHistory = () => {
    const setupResult = setup();
    const { controller } = setupResult;
    controller.handleWebViewMessage(handshake());
    controller.send(setEditable(false), { coalesceKey: 'editable' });
    controller.send(
      { type: 'set-placeholder', payload: 'a' },
      {
        coalesceKey: 'placeholder',
      }
    );
    controller.send(setContent('<p>first</p>'));
    controller.send({ type: 'toggle-bold' });
    controller.send(setContent('<p>last</p>'));
    controller.send(setEditable(true), { coalesceKey: 'editable' });
    controller.injectCSS('p{color:red}', 'theme');
    controller.registerPersistentScript('inputmode', 'inputmode();');
    return setupResult;
  };

  it('replays the last content, coalesced commands, CSS and scripts after a reload', () => {
    const { controller, webView } = readyWithHistory();
    const html = controller.rpc<string>(getHTML);
    const sent = webView.envelopes.length;
    const injected = webView.scripts.length;

    controller.onLoadStart();
    expect(controller.isReady()).toBe(false);
    expect(controller.getState().isReady).toBe(false);
    controller.handleWebViewMessage(handshake());

    const replayed = webView.messages.slice(sent);
    expect(replayed.map((message) => message.type)).toEqual([
      'set-content',
      'set-placeholder',
      'set-editable',
      'get-html',
    ]);
    expect(replayed[0]).toEqual(setContent('<p>last</p>'));
    expect(replayed[2]).toEqual(setEditable(true));
    expect(webView.scripts.slice(injected)).toEqual([
      expect.stringContaining('p{color:red}'),
      'inputmode();',
    ]);

    const { messageId } = replayed[3]!.payload as { messageId: string };
    controller.handleWebViewMessage(reply(messageId, '<p>last</p>'));
    return expect(html).resolves.toBe('<p>last</p>');
  });

  it('replays remembered content instead of an older setContent', () => {
    const { controller, webView } = readyWithHistory();
    controller.rememberContent('<p>typed</p>');
    const sent = webView.envelopes.length;

    controller.onProcessTerminated();
    expect(webView.reloadCount).toBe(1);
    controller.onLoadStart();
    controller.handleWebViewMessage(handshake());

    expect(webView.messages[sent]).toEqual({
      type: SET_CONTENT_TYPE,
      payload: { content: '<p>typed</p>', emitUpdate: false },
    });
  });

  it('restarts when a second handshake arrives in the same load', () => {
    const { controller, webView } = readyWithHistory();
    const sent = webView.envelopes.length;

    controller.handleWebViewMessage(handshake());

    expect(controller.isReady()).toBe(true);
    expect(webView.types.slice(sent)).toEqual([
      'set-content',
      'set-placeholder',
      'set-editable',
    ]);
  });

  it('does not replay anything when the page was never ready', () => {
    const { controller, webView } = setup();
    controller.send(setContent('<p>a</p>'));
    controller.onLoadStart();
    controller.onLoadStart();
    controller.handleWebViewMessage(handshake());

    expect(webView.types).toEqual(['set-content']);
  });

  it('treats a new WebView instance as a new page', () => {
    const { controller, webView } = setup();
    controller.handleWebViewMessage(handshake());
    controller.send(setContent('<p>a</p>'));

    controller.setWebView(null);
    expect(controller.isReady()).toBe(false);
    const next = new FakeWebView();
    controller.setWebView(next);
    controller.onLoadStart();
    controller.handleWebViewMessage(handshake());

    expect(webView.types).toEqual(['set-content']);
    expect(next.types).toEqual(['set-content']);
  });
});

describe('iOS remount', () => {
  it('never readies the instance that is about to be replaced', () => {
    jest.useFakeTimers();
    const controller = createEditorController({
      platform: 'ios',
      initialState,
      editorId: EDITOR_ID,
    });
    const first = new FakeWebView();
    controller.attach();
    controller.setRemountPending(true);
    controller.setWebView(first);
    controller.onLoadStart();
    controller.send(setContent('<p>early</p>'));
    controller.send({ type: 'focus', payload: 'end' });

    controller.handleWebViewMessage(handshake());
    controller.handleWebViewMessage(webMessage('stateUpdate', {}, EDITOR_ID));
    controller.onLoad();
    jest.advanceTimersByTime(LEGACY_READY_TIMEOUT_MS);
    expect(controller.isReady()).toBe(false);

    controller.setRemountPending(false);
    controller.setWebView(null);
    const second = new FakeWebView();
    controller.setWebView(second);
    controller.onLoadStart();
    controller.handleWebViewMessage(handshake());

    expect(first.envelopes).toEqual([]);
    expect(second.types).toEqual(['set-content', 'focus']);
  });
});

describe('injection', () => {
  it('applies CSS now when ready and again on every ready', () => {
    const { controller, webView } = setup();
    controller.injectCSS('a{}');
    controller.injectCSS('b{}');
    controller.injectCSS('c{}', 'other');
    expect(webView.scripts).toEqual([]);

    controller.handleWebViewMessage(handshake());
    expect(webView.scripts).toHaveLength(2);
    expect(webView.scripts[0]).toContain('"b{}"');
    expect(webView.scripts[0]).toContain('"custom-css"');
    expect(webView.scripts[1]).toContain('"other"');

    controller.injectCSS('d{}', 'other');
    expect(webView.scripts[2]).toContain('"d{}"');
  });

  it('runs persistent scripts now and on every ready, until removed', () => {
    const { controller, webView } = setup();
    controller.registerPersistentScript('a', 'a();');
    controller.registerPersistentScript('b', 'b();');
    controller.handleWebViewMessage(handshake());
    expect(webView.scripts).toEqual(['a();', 'b();']);

    controller.registerPersistentScript('a', 'a2();');
    controller.registerPersistentScript('b', null);
    expect(webView.scripts).toEqual(['a();', 'b();', 'a2();']);

    controller.onLoadStart();
    controller.handleWebViewMessage(handshake());
    expect(webView.scripts.slice(3)).toEqual(['a2();']);
  });

  it('does not replay one-off scripts after a reload', () => {
    const { controller, webView } = setup();
    controller.handleWebViewMessage(handshake());
    controller.injectJS('once();');
    controller.onLoadStart();
    controller.handleWebViewMessage(handshake());

    expect(webView.scripts).toEqual(['once();']);
  });
});

describe('container height', () => {
  it('is sent only to bundles that support it, and again after a reload', () => {
    const { controller, webView } = setup();
    controller.reportContainerHeight(300);
    controller.reportContainerHeight(480);
    controller.handleWebViewMessage(handshake());
    expect(webView.messages).toEqual([
      getWireFixture('protocol.container-height').message,
    ]);

    controller.onLoadStart();
    controller.handleWebViewMessage(legacyReady());
    controller.handleWebViewMessage(webMessage('stateUpdate', {}));
    controller.reportContainerHeight(500);
    expect(webView.types).toEqual([PROTOCOL_TYPES.ContainerHeight]);
  });
});

describe('inbound', () => {
  it('keeps the latest document height', () => {
    const { controller } = setup();
    const listener = jest.fn();
    controller.subscribeHeight(listener);

    controller.handleWebViewMessage(webMessage('document-height', 320));
    controller.handleWebViewMessage(webMessage('document-height', 'tall'));
    controller.handleWebViewMessage(webMessage('document-height', 320));

    expect(controller.getHeight()).toBe(320);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('routes messages by type, unknown types included', () => {
    const { controller } = setup();
    const press = jest.fn();
    const all = jest.fn();
    const unsubscribe = controller.subscribeMessage(
      PROTOCOL_TYPES.EditorPress,
      press
    );
    controller.subscribeMessages(all);

    controller.handleWebViewMessage(webMessage('tentap-editor-press'));
    controller.handleWebViewMessage(webMessage('my-custom', { a: 1 }));
    unsubscribe();
    controller.handleWebViewMessage(webMessage('tentap-editor-press'));

    expect(press).toHaveBeenCalledTimes(1);
    expect(all.mock.calls.map(([message]) => message.type)).toEqual([
      'tentap-editor-press',
      'my-custom',
      'tentap-editor-press',
    ]);
  });

  it('skips state notifications when nothing changed', () => {
    const { controller } = setup();
    const listener = jest.fn();
    controller.subscribeState(listener);
    controller.handleWebViewMessage(handshake());
    const state = { isFocused: true, editable: true };

    controller.handleWebViewMessage(webMessage('stateUpdate', state));
    controller.handleWebViewMessage(webMessage('stateUpdate', state));

    expect(listener).toHaveBeenCalledTimes(2);
    expect(controller.getState()).toEqual({ ...state, isReady: true });
  });

  it('emits content updates to subscribers', () => {
    const { controller } = setup();
    const listener = jest.fn();
    const unsubscribe = controller.subscribeContent(listener);
    controller.emitContentUpdate();
    unsubscribe();
    controller.emitContentUpdate();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('warns about boot errors in development', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { controller } = setup();
    controller.handleWebViewMessage(
      JSON.stringify(getWireFixture('protocol.boot-error').message)
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('boot error'),
      expect.objectContaining({ reason: 'config-missing' })
    );
  });
});

describe('commands', () => {
  it('reports every send with the internal token of runInternal', () => {
    const { controller } = setup();
    const listener = jest.fn();
    const token = Symbol('keyboard');
    controller.onCommand(listener);

    controller.send({ type: 'focus' });
    const result = controller.runInternal(token, () => {
      controller.send({ type: 'focus' });
      return 42;
    });
    controller.send({ type: 'blur' });

    expect(result).toBe(42);
    expect(listener.mock.calls).toEqual([
      [{ type: 'focus' }, {}],
      [{ type: 'focus' }, { internal: token }],
      [{ type: 'blur' }, {}],
    ]);
  });

  it('restores the token when the callback throws', () => {
    const { controller } = setup();
    const listener = jest.fn();
    controller.onCommand(listener);
    expect(() =>
      controller.runInternal(Symbol('x'), () => {
        throw new Error('boom');
      })
    ).toThrow('boom');
    controller.send({ type: 'focus' });
    expect(listener).toHaveBeenCalledWith({ type: 'focus' }, {});
  });
});

describe('lifecycle', () => {
  it('survives a StrictMode attach/detach/attach cycle', async () => {
    const { controller, webView } = setup({ rpcTimeoutMs: 1000 });
    jest.useFakeTimers();
    const html = controller.rpc<string>(getHTML);
    controller.detach();
    jest.advanceTimersByTime(5000);
    controller.attach();

    expect(getLastAttachedController()).toBe(controller);
    controller.handleWebViewMessage(handshake());
    const { messageId } = webView.messages[0]!.payload as {
      messageId: string;
    };
    controller.handleWebViewMessage(reply(messageId, '<p>ok</p>'));
    await expect(html).resolves.toBe('<p>ok</p>');
  });

  it('tracks the most recently attached controller', () => {
    const first = setup().controller;
    const second = setup().controller;
    expect(getLastAttachedController()).toBe(second);
    second.detach();
    expect(getLastAttachedController()).toBe(first);
    first.detach();
  });

  it('drops everything on dispose and ignores later calls', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { controller, webView } = setup();
    const settled = jest.fn();
    controller.rpc(getHTML).then(settled, settled);
    controller.send({ type: 'blur' });

    controller.dispose();
    controller.send({ type: 'focus' });
    controller.handleWebViewMessage(handshake());

    expect(controller['rpcs'].size).toBe(0);
    expect(webView.envelopes).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('send() called after')
    );
    expect(getLastAttachedController()).not.toBe(controller);
    return Promise.resolve().then(() => expect(settled).not.toHaveBeenCalled());
  });
});

describe('createBridgeContext', () => {
  it('exposes the controller to bridges', async () => {
    const { controller, webView } = setup();
    const context = createBridgeContext(controller);
    controller.handleWebViewMessage(handshake());

    context.send(setEditable(false), { coalesceKey: 'editable' });
    const text = context.rpc<string>({ type: 'get-text' });
    const { messageId } = webView.messages[1]!.payload as {
      messageId: string;
    };
    controller.handleWebViewMessage(
      webMessage('send-text-back', { messageId, content: 'hi' })
    );

    await expect(text).resolves.toBe('hi');
    expect(context.getWebView()).toBe(webView);
    expect(context.editorId).toBe(EDITOR_ID);
    expect(context.supports(CAPABILITIES.InsertContent)).toBe(true);
    expect(context.getState().isReady).toBe(true);
  });
});
