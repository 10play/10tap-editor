import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import {
  FIXTURE_EDITOR_ID,
  FIXTURE_MESSAGE_ID,
  wireFixtures,
  type WireFixture,
} from '../../__fixtures__/wire';
import { LEGACY_CAPABILITIES } from '../../shared/capabilities';
import {
  attachEditorController,
  type BridgeContext,
  type EditorController,
  type RpcOptions,
  type SendOptions,
} from '../../shared/contracts';
import {
  PROTOCOL_TYPES,
  withMessageId,
  type BridgeMessage,
} from '../../shared/protocol';
import type { BridgeState, EditorBridge } from '../../types';
import BridgeExtension from '../base';
import { CoreBridge, CoreEditorActionType } from '../core';
import { HistoryBridge } from '../history';
import { TenTapStartKit } from '../StarterKit';

type Assert<T extends true> = T;
type SameString<A extends string, B extends string> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;
// Compile-time lock: core members that are protocol types keep their wire strings.
type _ProtocolAligned = [
  Assert<
    SameString<
      `${CoreEditorActionType.EditorReady}`,
      typeof PROTOCOL_TYPES.EditorReady
    >
  >,
  Assert<
    SameString<
      `${CoreEditorActionType.StateUpdate}`,
      typeof PROTOCOL_TYPES.StateUpdate
    >
  >,
  Assert<
    SameString<
      `${CoreEditorActionType.DocumentHeight}`,
      typeof PROTOCOL_TYPES.DocumentHeight
    >
  >,
];

interface Sent {
  message: BridgeMessage;
  options?: SendOptions;
  rpc?: RpcOptions;
}

const createWebView = () => ({
  postMessage: jest.fn(),
  injectJavaScript: jest.fn(),
  requestFocus: jest.fn(),
  reload: jest.fn(),
});

/** A BridgeContext that records what the bridges send. */
const createContext = (platform: BridgeContext['platform'] = 'ios') => {
  const sent: Sent[] = [];
  const webView = createWebView();
  const injected: string[] = [];
  let state = { isFocused: false } as BridgeState;
  const context: BridgeContext<BridgeState> = {
    platform,
    editorId: FIXTURE_EDITOR_ID,
    send: (message, options) => sent.push({ message, options }),
    rpc: <T>(message: BridgeMessage, rpc?: RpcOptions) => {
      sent.push({
        message: withMessageId(message, FIXTURE_MESSAGE_ID),
        rpc: rpc ?? {},
      });
      return Promise.resolve('reply' as T);
    },
    getState: () => state,
    setState: (next) => (state = next),
    supports: () => true,
    getCapabilities: () => LEGACY_CAPABILITIES,
    subscribeMessage: () => () => {},
    injectJS: (js) => injected.push(js),
    getWebView: () => webView,
  };
  /** What a 1.1 host passes as the positional `sendBridgeMessage`. */
  const sendBridgeMessage = (message: BridgeMessage) => context.send(message);
  return {
    context,
    sendBridgeMessage,
    sent,
    injected,
    webView,
    getState: () => state,
  };
};

type Instance = Record<string, (...args: unknown[]) => unknown>;

const extendAll = (
  bridges: BridgeExtension[],
  sendBridgeMessage: (message: BridgeMessage) => void,
  context?: BridgeContext<BridgeState>
): Instance =>
  Object.assign(
    {},
    ...bridges.map((bridge) =>
      bridge.extendEditorInstance?.(
        sendBridgeMessage,
        undefined,
        undefined,
        undefined,
        context?.platform,
        context
      )
    )
  );

/** JSON round trip: what actually goes over the wire. */
const wire = (value: unknown) => JSON.parse(JSON.stringify(value));

const nativeCalls = wireFixtures.filter(
  (fixture): fixture is WireFixture & { call: { method: string } } =>
    fixture.direction === 'native-to-web' && fixture.call !== undefined
);

describe('native halves of the bridges', () => {
  it('keep the protocol wire strings of core members', () => {
    const aligned: _ProtocolAligned = [true, true, true];
    expect(aligned).toEqual([true, true, true]);
  });

  it.each(nativeCalls.map((fixture) => [fixture.id, fixture] as const))(
    '%s produces the fixture message through the context',
    (_id, fixture) => {
      const { context, sendBridgeMessage, sent } = createContext();
      const instance = extendAll(TenTapStartKit, sendBridgeMessage, context);

      void instance[fixture.call.method]!(...fixture.call.args);

      expect(sent).toHaveLength(1);
      expect(wire(sent[0]!.message)).toEqual(fixture.message);
      expect(sent[0]!.rpc !== undefined).toBe(fixture.rpc === true);
      expect(sent[0]!.rpc?.capability).toBe(
        fixture.rpc ? fixture.capability : undefined
      );
    }
  );

  it.each(nativeCalls.map((fixture) => [fixture.id, fixture] as const))(
    '%s produces the fixture message from a five-argument host',
    (_id, fixture) => {
      const sendBridgeMessage = jest.fn<void, [BridgeMessage]>();
      const instance = extendAll(TenTapStartKit, sendBridgeMessage);

      void instance[fixture.call.method]!(...fixture.call.args);

      expect(sendBridgeMessage).toHaveBeenCalledTimes(1);
      const anyMessageId = expect.any(String) as unknown as string;
      expect(wire(sendBridgeMessage.mock.calls[0]![0])).toEqual(
        fixture.rpc
          ? withMessageId(fixture.message, anyMessageId)
          : fixture.message
      );
    }
  );

  it('coalesces only the idempotent setters, keyed by message type', () => {
    const { context, sendBridgeMessage, sent } = createContext();
    const instance = extendAll(TenTapStartKit, sendBridgeMessage, context);

    instance.setEditable!(false);
    instance.setPlaceholder!('Write here');
    instance.updateScrollThresholdAndMargin!(20);
    instance.setContent!('<p>x</p>');
    instance.toggleBold!();

    expect(sent.map(({ options }) => options?.coalesceKey)).toEqual([
      'set-editable',
      'set-placeholder',
      'update-scroll-threshold-and-margin',
      undefined,
      undefined,
    ]);
  });

  it('only sends parseOptions and emitUpdate when given (#327)', () => {
    const { context, sent } = createContext();
    const instance = extendAll([CoreBridge], jest.fn(), context);

    instance.setContent!('<p>a</p>', { emitUpdate: false });

    expect(wire(sent[0]!.message)).toEqual({
      type: 'set-content',
      payload: { content: '<p>a</p>', emitUpdate: false },
    });
  });

  it('focus requests WebView focus and marks the state focused', () => {
    const { context, webView, getState } = createContext('ios');
    const instance = extendAll([CoreBridge], jest.fn(), context);

    instance.focus!('end');

    expect(webView.requestFocus).toHaveBeenCalledTimes(1);
    expect(getState().isFocused).toBe(true);
  });

  it('delays the WebView focus request on Android', () => {
    jest.useFakeTimers();
    try {
      const { context, webView } = createContext('android');
      const instance = extendAll([CoreBridge], jest.fn(), context);

      instance.focus!('end');
      expect(webView.requestFocus).not.toHaveBeenCalled();
      jest.advanceTimersByTime(100);
      expect(webView.requestFocus).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('injectJS goes through the context, which queues it until ready', () => {
    const { context, injected, webView } = createContext();
    const instance = extendAll([CoreBridge], jest.fn(), context);

    instance.injectJS!('true;');

    expect(injected).toEqual(['true;']);
    expect(webView.injectJavaScript).not.toHaveBeenCalled();
  });
});

describe('five-argument hosts', () => {
  const extendCore = () => {
    const sendBridgeMessage = jest.fn<void, [BridgeMessage]>();
    const webView = createWebView();
    const webviewRef = { current: webView } as unknown as RefObject<WebView>;
    const editorState: RefObject<BridgeState | {}> = {
      current: { isFocused: false },
    };
    const setEditorState = jest.fn();
    const instance = CoreBridge.extendEditorInstance!(
      sendBridgeMessage,
      webviewRef,
      editorState,
      setEditorState,
      'ios'
    );
    return { instance, sendBridgeMessage, webView, setEditorState };
  };

  const editorBridge = (overrides: Partial<EditorBridge> = {}) =>
    ({
      autofocus: false,
      focus: jest.fn(),
      _updateEditorState: jest.fn(),
      _onContentUpdate: jest.fn(),
      ...overrides,
    }) as unknown as EditorBridge;

  it('resolves RPCs from the matching reply', async () => {
    const { instance, sendBridgeMessage } = extendCore();

    const html = instance.getHTML();
    const text = instance.getText();
    const [htmlRequest, textRequest] = sendBridgeMessage.mock.calls.map(
      ([message]) => message as { payload: { messageId: string } }
    );
    const reply = (type: string, messageId: string, content: string) =>
      CoreBridge.onEditorMessage!(
        { type, payload: { messageId, content } } as never,
        editorBridge()
      );

    expect(
      reply('send-text-back', textRequest!.payload.messageId, 'Hello')
    ).toBe(true);
    expect(
      reply('send-html-back', htmlRequest!.payload.messageId, '<p>Hello</p>')
    ).toBe(true);
    await expect(html).resolves.toBe('<p>Hello</p>');
    await expect(text).resolves.toBe('Hello');
    // A reply nobody waits for (e.g. resolved by an EditorController) is ignored.
    expect(reply('send-html-back', htmlRequest!.payload.messageId, 'x')).toBe(
      false
    );
  });

  it('uses the WebView ref and state setter', () => {
    const { instance, webView, setEditorState } = extendCore();

    instance.focus('start');
    instance.injectJS('true;');

    expect(webView.requestFocus).toHaveBeenCalledTimes(1);
    expect(webView.injectJavaScript).toHaveBeenCalledWith('true;');
    expect(setEditorState).toHaveBeenCalledWith({ isFocused: true });
  });

  it('autofocuses on editor-ready only without an EditorController', () => {
    const ready = { type: CoreEditorActionType.EditorReady } as never;
    const legacy = editorBridge({ autofocus: true });
    const controlled = editorBridge({ autofocus: true });
    attachEditorController(
      controlled,
      {} as unknown as EditorController<object>
    );

    CoreBridge.onEditorMessage!(ready, legacy);
    CoreBridge.onEditorMessage!(ready, controlled);

    expect(legacy.focus).toHaveBeenCalledWith('end');
    expect(controlled.focus).not.toHaveBeenCalled();
  });

  it('routes state and content updates to the editor', () => {
    const editor = editorBridge();
    const state = { isReady: true };

    CoreBridge.onEditorMessage!(
      { type: CoreEditorActionType.StateUpdate, payload: state } as never,
      editor
    );
    CoreBridge.onEditorMessage!(
      { type: CoreEditorActionType.ContentUpdate } as never,
      editor
    );

    expect(editor._updateEditorState).toHaveBeenCalledWith(state);
    expect(editor._onContentUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('BridgeExtension', () => {
  it('keeps the names and order of TenTapStartKit', () => {
    expect(TenTapStartKit.map((bridge) => bridge.name)).toEqual([
      'bold',
      'undoRedo',
      'code',
      'italic',
      'strike',
      'underline',
      'orderedList',
      'heading',
      'image',
      'bulletList',
      'blockquote',
      'taskList',
      'link',
      'color',
      'highlight',
      'doc',
      'placeholder',
      'listItem',
      'dropCursor',
      'hardBreak',
    ]);
  });

  it('configures tiptap extensions without changing the bridge (#309)', () => {
    const original = HistoryBridge.tiptapExtension;

    const first = HistoryBridge.configureTiptapExtensionsOnRunTime(
      { depth: 5 },
      { name: 'undoRedo' }
    );
    const second = HistoryBridge.configureTiptapExtensionsOnRunTime(
      { depth: 5 },
      { name: 'undoRedo' }
    );

    expect(HistoryBridge.tiptapExtension).toBe(original);
    expect(first[0]).not.toBe(original);
    expect(first[0]!.options).toMatchObject({ depth: 5 });
    expect(second[0]!.options).toEqual(first[0]!.options);
    expect(HistoryBridge.configureTiptapExtensionsOnRunTime()).toEqual([
      original,
    ]);
  });

  it('returns no undefined entries for CSS-only bridges', () => {
    const cssOnly = new BridgeExtension({
      forceName: 'css',
      extendCSS: 'p { color: red; }',
    });

    expect(cssOnly.configureTiptapExtensionsOnRunTime({}, undefined)).toEqual(
      []
    );
  });

  it('clones on configure, keeping the name', () => {
    const configured = CoreBridge.configureExtension({ a: 1 });
    const styled = CoreBridge.configureCSS('p {}');
    const extended = CoreBridge.extendExtension({ b: 2 });

    expect(configured).not.toBe(CoreBridge);
    expect(configured.name).toBe(CoreBridge.name);
    expect(configured.config).toEqual({ a: 1 });
    expect(styled.extendCSS).toBe('p {}');
    expect(extended.extendConfig).toEqual({ b: 2 });
    expect(CoreBridge.config).toBeUndefined();
  });

  it('still accepts five-argument extendEditorInstance bridges', () => {
    const custom = new BridgeExtension<{}, { ping: () => void }, BridgeMessage>(
      {
        forceName: 'ping',
        extendEditorInstance: (send, _ref, _state, _setState, platform) => ({
          ping: () => send({ type: 'ping', payload: platform }),
        }),
      }
    );
    const send = jest.fn();

    custom.extendEditorInstance!(
      send,
      undefined,
      undefined,
      undefined,
      'android'
    ).ping();

    expect(send).toHaveBeenCalledWith({ type: 'ping', payload: 'android' });
  });
});
