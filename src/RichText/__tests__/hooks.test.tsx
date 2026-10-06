import React, { StrictMode } from 'react';
import { Text } from 'react-native';
import type WebView from 'react-native-webview';
import { act, render, renderHook, screen } from '@testing-library/react-native';
import BridgeExtension from '../../bridges/base';
import { BoldBridge } from '../../bridges/bold';
import { TenTapStartKit } from '../../bridges/StarterKit';
import { CoreBridge, CoreEditorActionType } from '../../bridges/core';
import { getEditorController } from '../../shared/contracts';
import { TentapRpcTimeoutError } from '../../shared/errors';
import { PROTOCOL_TYPES, type BridgeMessage } from '../../shared/protocol';
import {
  FakeWebView,
  handshake,
  legacyReady,
  webMessage,
} from '../../native/__tests__/helpers';
import type {
  BridgeState,
  EditorBridge,
  EditorBridgeOptions,
} from '../../types';
import * as misc from '../../utils/misc';
import { EditorHelper, useRemoteEditorBridge } from '../EditorHelper';
import { useBridgeState } from '../useBridgeState';
import { useEditorBridge, type RecursivePartial } from '../useEditorBridge';
import { useEditorContent } from '../useEditorContent';

const controllerOf = (editor: EditorBridge) => {
  const controller = getEditorController(editor);
  if (!controller) throw new Error('editor has no controller');
  return controller;
};

/** Connects a fake WebView and completes the v2 handshake. */
const connect = (editor: EditorBridge, { ready = true } = {}) => {
  const controller = controllerOf(editor);
  const webView = new FakeWebView();
  controller.setWebView(webView);
  controller.onLoadStart();
  if (ready) {
    act(() => controller.handleWebViewMessage(handshake(controller.editorId)));
  }
  return { controller, webView };
};

const receive = (editor: EditorBridge, type: string, payload?: unknown) =>
  act(() =>
    controllerOf(editor).handleWebViewMessage(webMessage(type, payload))
  );

const replyTo = (
  editor: EditorBridge,
  request: BridgeMessage | undefined,
  type: string,
  content: unknown
) => {
  const { messageId } = request?.payload as { messageId: string };
  receive(editor, type, { content, messageId });
};

const stateUpdate = (patch: Partial<BridgeState>): BridgeState =>
  ({
    selection: { from: 1, to: 1 },
    isFocused: true,
    isReady: true,
    editable: true,
    empty: false,
    ...patch,
  }) as BridgeState;

const renderEditor = (options?: EditorBridgeOptions) =>
  renderHook(
    (props: EditorBridgeOptions | undefined) => useEditorBridge(props),
    {
      initialProps: options,
    }
  );

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useEditorBridge', () => {
  it('returns the same editor across 100 rerenders', () => {
    const { result, rerender } = renderEditor({ initialContent: 'a' });
    const first = result.current;

    for (let i = 0; i < 100; i++) {
      rerender({ initialContent: `content ${i}`, onChange: () => {} });
    }

    expect(result.current).toBe(first);
    expect(getEditorController(result.current)).toBe(
      getEditorController(first)
    );
  });

  it('keeps a working editor in StrictMode', () => {
    const editors: EditorBridge[] = [];
    const Probe = () => {
      editors.push(useEditorBridge());
      return null;
    };
    render(
      <StrictMode>
        <Probe />
      </StrictMode>
    );
    const editor = editors[editors.length - 1]!;
    editors.forEach((rendered) => expect(rendered).toBe(editor));

    const { webView } = connect(editor);
    editor.toggleBold();

    expect(webView.types).toContain('toggle-bold');
    expect(EditorHelper.editorLastInstance).toBe(editor);
  });

  it('lets 1.0 code assign option and state fields', () => {
    const { result } = renderEditor({ autofocus: true });
    const editor = result.current;
    const theme = { ...editor.theme, webview: { backgroundColor: 'red' } };

    editor.theme = theme;
    editor.autofocus = false;
    // 1.0 copied state fields onto the editor without declaring them.
    const fields = editor as unknown as Record<string, unknown>;
    fields.isFocused = true;

    expect(editor.theme).toBe(theme);
    expect(editor.autofocus).toBe(false);
    expect(fields.isFocused).toBe(true);
  });

  it('exposes every 1.0 member, delegating to the controller', () => {
    const { result } = renderEditor({ autofocus: true, dynamicHeight: true });
    const editor = result.current;

    expect(editor).toEqual(
      expect.objectContaining({
        autofocus: true,
        dynamicHeight: true,
        bridgeExtensions: TenTapStartKit,
        getEditorState: expect.any(Function),
        injectCSS: expect.any(Function),
        _updateEditorState: expect.any(Function),
        _subscribeToEditorStateUpdate: expect.any(Function),
        _onContentUpdate: expect.any(Function),
        _subscribeToContentUpdate: expect.any(Function),
        toggleBold: expect.any(Function),
        getSelectedText: expect.any(Function),
        insertContent: expect.any(Function),
      })
    );
    expect(editor.webviewRef).toHaveProperty('current', null);
    expect(editor.theme.toolbar).toBeDefined();
  });

  it('starts from a fully populated core state', () => {
    const { result } = renderEditor({ editable: false });

    expect(result.current.getEditorState()).toEqual({
      selection: { from: 0, to: 0 },
      isFocused: false,
      isReady: false,
      editable: false,
      empty: true,
    });
  });

  it('exposes state fields and the WebView as live getters, as 1.0 did', () => {
    const { result } = renderEditor();
    const editor = result.current as EditorBridge & Record<string, unknown>;
    const { webView } = connect(editor);

    receive(editor, PROTOCOL_TYPES.StateUpdate, {
      ...stateUpdate({ isBoldActive: true }),
    });

    expect(editor.isReady).toBe(true);
    expect(editor.isBoldActive).toBe(true);
    expect(editor.current).toBe(webView);
    expect(typeof editor.toggleBold).toBe('function');
  });

  it('hands the WebView assigned to webviewRef to the controller', () => {
    const { result } = renderEditor();
    const editor = result.current;
    const webView = new FakeWebView();

    // What React does with `ref={editor.webviewRef}`.
    (editor.webviewRef as { current: unknown }).current = webView;

    const controller = controllerOf(editor);
    controller.onLoadStart();
    act(() => controller.handleWebViewMessage(handshake(controller.editorId)));
    editor.toggleBold();

    expect(editor.webviewRef.current).toBe(webView);
    expect(webView.types).toContain('toggle-bold');
  });

  it('queues commands until the editor is ready, then sends them in order', () => {
    const { result } = renderEditor();
    const editor = result.current;
    const { controller, webView } = connect(editor, { ready: false });

    editor.setContent('<p>Early</p>');
    editor.toggleBold();
    expect(webView.envelopes).toHaveLength(0);

    act(() => controller.handleWebViewMessage(handshake(controller.editorId)));

    expect(webView.types).toEqual(['set-content', 'toggle-bold']);
  });

  it('focuses once the editor is ready when autofocus is set', () => {
    const { result } = renderEditor({ autofocus: true });
    const { webView } = connect(result.current);

    expect(webView.messages).toContainEqual({
      type: CoreEditorActionType.Focus,
      payload: 'end',
    });
    expect(webView.focusCount).toBe(1);
  });

  it('tolerates autofocus and editable changes without CoreBridge', () => {
    const { result, rerender } = renderEditor({
      autofocus: true,
      bridgeExtensions: [BoldBridge],
    });
    const { webView } = connect(result.current);

    rerender({ editable: false, bridgeExtensions: [BoldBridge] });

    expect(webView.types).toEqual([]);
    expect(result.current.getEditorState().editable).toBe(false);
  });

  it('becomes ready for legacy bundles that only post editor-ready', () => {
    jest.useFakeTimers();
    const { result } = renderEditor();
    const editor = result.current;
    const { controller } = connect(editor, { ready: false });

    act(() => controller.handleWebViewMessage(legacyReady()));
    act(() => jest.runOnlyPendingTimers());

    expect(editor.getEditorState().isReady).toBe(true);
  });

  it('sends editable changes but not the initial value', () => {
    const { result, rerender } = renderEditor({ editable: false });
    const editor = result.current;
    const { webView } = connect(editor);
    expect(webView.types).not.toContain('set-editable');

    rerender({ editable: true });

    expect(webView.messages).toContainEqual({
      type: CoreEditorActionType.SetEditable,
      payload: true,
    });
    expect(editor.editable).toBe(true);
  });

  it('calls the latest onChange and notifies content subscribers', () => {
    const first = jest.fn();
    const latest = jest.fn();
    const { result, rerender } = renderEditor({ onChange: first });
    const editor = result.current;
    const subscriber = jest.fn();
    editor._subscribeToContentUpdate(subscriber);
    rerender({ onChange: latest });

    editor._onContentUpdate();

    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('reads option fields from the latest render', () => {
    const { result, rerender } = renderEditor({
      theme: { webview: { backgroundColor: 'red' } },
    });
    const editor = result.current;
    expect(editor.theme.webview).toEqual({ backgroundColor: 'red' });

    rerender({
      dynamicHeight: true,
      avoidKeyboard: true,
      scrollBottomOffset: 60,
      parseOptions: { preserveWhitespace: 'full' },
      mergeStyles: true,
      theme: { webview: { backgroundColor: 'blue' } },
    });

    expect(editor).toMatchObject({
      dynamicHeight: true,
      avoidIosKeyboard: true,
      avoidKeyboard: true,
      scrollBottomOffset: 60,
      parseOptions: { preserveWhitespace: 'full' },
      mergeStyles: true,
    });
    expect(editor.theme.webview).toEqual({ backgroundColor: 'blue' });
  });

  it('warns once when bridges change after mount and keeps the original ones', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result, rerender } = renderEditor({
      bridgeExtensions: [CoreBridge],
    });

    rerender({ bridgeExtensions: [CoreBridge, BoldBridge] });
    rerender({ bridgeExtensions: [CoreBridge, BoldBridge] });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(result.current.bridgeExtensions).toEqual([CoreBridge]);
    expect(result.current).not.toHaveProperty('toggleBold');
  });

  it('does not warn when configured copies keep the same names', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = renderEditor({
      bridgeExtensions: [...TenTapStartKit, BoldBridge.configureCSS('b{}')],
    });

    rerender({
      bridgeExtensions: [...TenTapStartKit, BoldBridge.configureCSS('b{}')],
    });

    expect(warn).not.toHaveBeenCalled();
  });

  it('passes the positional arguments and a BridgeContext to extendEditorInstance', () => {
    const extend = jest.fn((send: (message: BridgeMessage) => void) => ({
      ping: () => send({ type: 'ping' }),
      injectCSS: () => 'bridge wins',
    }));
    const custom = new BridgeExtension({
      forceName: 'custom',
      extendEditorInstance: extend,
    });
    const { result } = renderEditor({
      bridgeExtensions: [CoreBridge, custom],
    });
    const editor = result.current as EditorBridge & { ping: () => void };
    const { webView } = connect(editor);

    const [, webviewRef, editorState, setState, platform, context] = extend.mock
      .calls[0] as unknown as Parameters<
      NonNullable<BridgeExtension['extendEditorInstance']>
    >;
    expect(webviewRef).toBe(editor.webviewRef);
    expect(editorState?.current).toBe(editor.getEditorState());
    expect(setState).toBe(editor._updateEditorState);
    expect(platform).toBe('ios');
    expect(context?.editorId).toBe(controllerOf(editor).editorId);

    editor.ping();
    expect(webView.types).toContain('ping');
    expect(editor.injectCSS('x')).toBe('bridge wins');
  });

  it('rejects async reads after rpcTimeoutMs', async () => {
    jest.useFakeTimers();
    const { result } = renderEditor({ rpcTimeoutMs: 100 });
    connect(result.current);

    const html = result.current.getHTML();
    jest.advanceTimersByTime(100);

    await expect(html).rejects.toBeInstanceOf(TentapRpcTimeoutError);
  });

  it('injects CSS through the controller, re-applied after a reload', () => {
    const { result } = renderEditor();
    const editor = result.current;
    const { controller, webView } = connect(editor);

    editor.injectCSS('p { color: red; }', 'red');
    controller.onLoadStart();
    act(() => controller.handleWebViewMessage(handshake(controller.editorId)));

    const applied = webView.scripts.filter((js) => js.includes('color: red'));
    expect(applied).toHaveLength(2);
  });
});

describe('useBridgeState', () => {
  it('returns state published before it subscribed and follows updates', () => {
    const { result } = renderEditor();
    const editor = result.current;
    connect(editor);
    receive(editor, PROTOCOL_TYPES.StateUpdate, stateUpdate({ empty: true }));

    const { result: state } = renderHook(() => useBridgeState(editor));
    expect(state.current.empty).toBe(true);

    receive(editor, PROTOCOL_TYPES.StateUpdate, stateUpdate({ empty: false }));
    expect(state.current.empty).toBe(false);
  });
});

describe('useEditorContent', () => {
  const lastRequest = (webView: FakeWebView, type: string) =>
    webView.messages.filter((message) => message.type === type).pop();

  const setup = (
    options?: Parameters<typeof useEditorContent>[1],
    { handshake: completeHandshake = false } = {}
  ) => {
    jest.useFakeTimers();
    const { result: editorResult } = renderEditor();
    const editor = editorResult.current;
    const { webView } = connect(editor, { ready: completeHandshake });
    const hook = renderHook(() => useEditorContent(editor, options));
    return { editor, webView, ...hook };
  };

  const flush = () => act(() => jest.runOnlyPendingTimers());

  it('fetches when the editor becomes ready', async () => {
    const { editor, webView, result } = setup();
    receive(editor, PROTOCOL_TYPES.StateUpdate, stateUpdate({}));
    flush();

    replyTo(
      editor,
      lastRequest(webView, 'get-html'),
      'send-html-back',
      '<p>a</p>'
    );
    await act(async () => {});

    expect(result.current).toBe('<p>a</p>');
  });

  it('refetches on content updates but not on selection changes', () => {
    const { editor, webView } = setup(
      { type: 'json', debounceInterval: 10 },
      { handshake: true }
    );
    flush();
    expect(webView.types.filter((t) => t === 'get-json')).toHaveLength(1);

    receive(
      editor,
      PROTOCOL_TYPES.StateUpdate,
      stateUpdate({ selection: { from: 3, to: 3 } })
    );
    flush();
    expect(webView.types.filter((t) => t === 'get-json')).toHaveLength(1);

    act(() => editor._onContentUpdate());
    act(() => editor._onContentUpdate());
    flush();
    expect(webView.types.filter((t) => t === 'get-json')).toHaveLength(2);
  });

  it('refetches on every state update of a legacy bundle', () => {
    const { editor, webView } = setup({ type: 'json', debounceInterval: 10 });
    receive(editor, PROTOCOL_TYPES.StateUpdate, stateUpdate({}));
    flush();

    receive(
      editor,
      PROTOCOL_TYPES.StateUpdate,
      stateUpdate({ selection: { from: 3, to: 3 } })
    );
    flush();

    expect(webView.types.filter((t) => t === 'get-json')).toHaveLength(2);
  });

  it('drops responses that arrive after a newer request', async () => {
    const { editor, webView, result } = setup({ type: 'text' });
    receive(editor, PROTOCOL_TYPES.StateUpdate, stateUpdate({}));
    flush();
    const stale = lastRequest(webView, 'get-text');
    act(() => editor._onContentUpdate());
    flush();
    const fresh = lastRequest(webView, 'get-text');

    replyTo(editor, fresh, 'send-text-back', 'fresh');
    replyTo(editor, stale, 'send-text-back', 'stale');
    await act(async () => {});

    expect(result.current).toBe('fresh');
  });

  it('remembers fetched HTML so a crashed WebView restores it', async () => {
    const { editor, webView } = setup();
    receive(editor, PROTOCOL_TYPES.StateUpdate, stateUpdate({}));
    flush();
    replyTo(
      editor,
      lastRequest(webView, 'get-html'),
      'send-html-back',
      '<p>kept</p>'
    );
    await act(async () => {});

    const controller = controllerOf(editor);
    act(() => controller.onProcessTerminated());
    act(() => controller.handleWebViewMessage(handshake(controller.editorId)));

    expect(webView.messages).toContainEqual({
      type: CoreEditorActionType.SetContent,
      payload: { content: '<p>kept</p>', emitUpdate: false },
    });
  });

  it('does not fetch or update after unmount', async () => {
    const { editor, webView, unmount } = setup();
    receive(editor, PROTOCOL_TYPES.StateUpdate, stateUpdate({}));
    flush();
    const pending = lastRequest(webView, 'get-html');
    act(() => editor._onContentUpdate());
    const error = jest.spyOn(console, 'error');

    unmount();
    flush();
    replyTo(editor, pending, 'send-html-back', '<p>late</p>');
    await act(async () => {});

    expect(webView.types.filter((t) => t === 'get-html')).toHaveLength(1);
    expect(error).not.toHaveBeenCalled();
  });
});

describe('EditorHelper', () => {
  const Editor = ({ onEditor }: { onEditor: (e: EditorBridge) => void }) => {
    onEditor(useEditorBridge());
    return null;
  };

  it('falls back to the previous editor when the last one unmounts', () => {
    let first: EditorBridge | undefined;
    let second: EditorBridge | undefined;
    const { rerender } = render(
      <>
        <Editor onEditor={(e) => (first = e)} />
        <Editor onEditor={(e) => (second = e)} />
      </>
    );
    expect(EditorHelper.editorLastInstance).toBe(second);

    rerender(
      <>
        <Editor onEditor={(e) => (first = e)} />
      </>
    );
    expect(EditorHelper.editorLastInstance).toBe(first);

    rerender(<></>);
    expect(EditorHelper.editorLastInstance).toBeUndefined();
  });

  it('useRemoteEditorBridge follows the current editor (#51)', () => {
    const Remote = () => {
      const editor = useRemoteEditorBridge();
      return <Text>{editor ? 'editor' : 'none'}</Text>;
    };
    const App = ({ withEditor }: { withEditor: boolean }) => (
      <>
        <Remote />
        {withEditor && <Editor onEditor={() => {}} />}
      </>
    );
    const { rerender } = render(<App withEditor={false} />);
    expect(screen.getByText('none')).toBeOnTheScreen();

    rerender(<App withEditor />);
    expect(screen.getByText('editor')).toBeOnTheScreen();

    rerender(<App withEditor={false} />);
    expect(screen.getByText('none')).toBeOnTheScreen();
  });
});

describe('utils', () => {
  it('no longer ships isExpo', () => {
    expect(Object.keys(misc)).toEqual(['isFabric']);
  });

  it('still exports RecursivePartial from the hook module', () => {
    const partial: RecursivePartial<{ a: { b: number } }> = { a: {} };
    expect(partial).toEqual({ a: {} });
  });

  it('webviewRef is typed as the 1.0 RefObject<WebView>', () => {
    const { result } = renderEditor();
    const ref: React.RefObject<WebView> = result.current.webviewRef;
    expect(ref).toBe(result.current.webviewRef);
  });
});
