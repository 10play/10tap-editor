import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BOOT_CONFIG_GLOBAL,
  buildBootConfig,
  buildBootScript,
  buildLegacyGlobalsScript,
  type BootConfig,
} from '../../shared/bootConfig';
import { WEB_RUNTIME_CAPABILITIES } from '../../shared/capabilities';
import {
  BOOT_ERROR_TIMEOUT_MS,
  PROTOCOL_VERSION,
  createActionEnvelope,
  encodeMessage,
  type BridgeMessage,
} from '../../shared/protocol';
import { boot, getWebRuntime, sendMessage, type WebRuntime } from '../runtime';

type TestWindow = Window & {
  eval: (script: string) => unknown;
  contentInjected?: boolean;
  lastMessageID?: string;
};

const EDITOR_ID = 'tt-runtime';

const config = (overrides: Partial<BootConfig> = {}): BootConfig => ({
  ...buildBootConfig({
    editorId: EDITOR_ID,
    bridges: [{ name: 'bold' }, { name: 'undoRedo', config: { depth: 5 } }],
    platform: 'ios',
    initialContent: '<p>Hi</p>',
  }),
  ...overrides,
});

let runtimes: WebRuntime[] = [];

/** A fresh browsing context with a recording `ReactNativeWebView`. */
const createWindow = (bootScript?: string) => {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  const win = iframe.contentWindow as unknown as TestWindow;
  const posted: Record<string, unknown>[] = [];
  win.ReactNativeWebView = {
    postMessage: (data: string) => posted.push(JSON.parse(data)),
  };
  if (bootScript) win.eval(bootScript);
  const start = () => {
    const runtime = boot(win);
    runtimes.push(runtime);
    return runtime;
  };
  return { win, posted, start };
};

const envelope = (
  message: BridgeMessage,
  options: { id?: string; editorId?: string } = {}
) => encodeMessage(createActionEnvelope(message, options));

const dispatch = (
  target: Window | Document,
  win: Window & typeof globalThis,
  data: string
) => target.dispatchEvent(new win.MessageEvent('message', { data }));

afterEach(() => {
  runtimes.forEach((runtime) => runtime.dispose());
  runtimes = [];
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('boot', () => {
  it('reads the inline boot config and installs window.__tentap', () => {
    const { win, start } = createWindow(buildBootScript(config()));
    const runtime = start();

    expect(runtime.config?.editorId).toBe(EDITOR_ID);
    expect(win.__tentap).toMatchObject({
      protocol: PROTOCOL_VERSION,
      editorId: EDITOR_ID,
      capabilities: WEB_RUNTIME_CAPABILITIES,
    });
  });

  it('returns the same runtime for repeated calls', () => {
    const { win, start } = createWindow(buildBootScript(config()));
    const runtime = start();

    expect(boot(win)).toBe(runtime);
    expect(getWebRuntime(win)).toBe(runtime);
  });

  it('falls back to the 1.0 globals written by a 1.0.x native side', () => {
    const legacy = config({ editable: false });
    const { start } = createWindow(buildLegacyGlobalsScript(legacy));
    const runtime = start();

    expect(runtime.config).toMatchObject({
      protocol: 1,
      editable: false,
      whitelist: ['bold', 'undoRedo'],
      initialContent: '<p>Hi</p>',
    });
    expect(runtime.config?.bridgeConfigs.history).toEqual({
      optionsConfig: { depth: 5 },
    });
  });

  it('waits for a late config, then reports it', async () => {
    const { win, start } = createWindow();
    const runtime = start();
    const configured = vi.fn();
    runtime.whenConfigured(configured);
    expect(runtime.config).toBeNull();

    win.eval(buildBootScript(config()));

    await vi.waitFor(() => expect(configured).toHaveBeenCalledTimes(1));
    expect(configured.mock.calls[0]?.[0]).toMatchObject({
      editorId: EDITOR_ID,
    });
  });

  it('posts boot-error when no config arrives, and keeps waiting', () => {
    vi.useFakeTimers();
    const { win, posted, start } = createWindow();
    const runtime = start();

    vi.advanceTimersByTime(BOOT_ERROR_TIMEOUT_MS);
    expect(posted).toEqual([
      {
        type: 'boot-error',
        payload: {
          reason: 'config-missing',
          elapsedMs: expect.any(Number),
          legacyGlobals: false,
        },
      },
    ]);

    win.eval(buildBootScript(config()));
    vi.advanceTimersByTime(100);
    expect(runtime.config?.editorId).toBe(EDITOR_ID);
  });

  it('builds a default config on demand when nothing was injected', () => {
    const { start } = createWindow();
    const runtime = start();

    expect(runtime.requireConfig()).toMatchObject({
      bridgeConfigs: {},
      whitelist: [],
      editable: true,
    });
  });
});

describe('native → web messages', () => {
  const setup = () => {
    const { win, start, posted } = createWindow(buildBootScript(config()));
    const runtime = start();
    const received: BridgeMessage[] = [];
    const send = (data: string, target: Window | Document = win) =>
      dispatch(target, win as Window & typeof globalThis, data);
    return { win, runtime, received, send, posted };
  };

  it('hands messages sent before any editor to the first subscriber, in order', () => {
    const { runtime, received, send } = setup();
    send(envelope({ type: 'set-content', payload: { content: 'a' } }));
    send(envelope({ type: 'toggle-bold' }));

    runtime.subscribe((message) => received.push(message));
    const late: BridgeMessage[] = [];
    runtime.subscribe((message) => late.push(message));

    expect(received.map(({ type }) => type)).toEqual([
      'set-content',
      'toggle-bold',
    ]);
    expect(late).toEqual([]);
  });

  it('delivers to every subscriber once one exists', () => {
    const { runtime, send } = setup();
    const first = vi.fn();
    const second = vi.fn();
    runtime.subscribe(first);
    runtime.subscribe(second);

    send(envelope({ type: 'blur' }));

    expect(first).toHaveBeenCalledWith({ type: 'blur' });
    expect(second).toHaveBeenCalledWith({ type: 'blur' });
  });

  it('listens on both window and document', () => {
    const { win, runtime, received, send } = setup();
    runtime.subscribe((message) => received.push(message));

    send(envelope({ type: 'focus', payload: 'end' }), win.document);
    send(envelope({ type: 'blur' }), win);

    expect(received.map(({ type }) => type)).toEqual(['focus', 'blur']);
  });

  it('drops repeated envelope ids and records lastMessageID', () => {
    const { win, runtime, received, send } = setup();
    runtime.subscribe((message) => received.push(message));

    send(envelope({ type: 'toggle-bold' }, { id: `${EDITOR_ID}.1` }));
    send(envelope({ type: 'toggle-bold' }, { id: `${EDITOR_ID}.1` }));
    send(envelope({ type: 'toggle-bold' }, { id: `${EDITOR_ID}.2` }));

    expect(received).toHaveLength(2);
    expect((win as TestWindow).lastMessageID).toBe(`${EDITOR_ID}.2`);
  });

  it('ignores messages for another editor and accepts untagged ones (#318)', () => {
    const { runtime, received, send } = setup();
    runtime.subscribe((message) => received.push(message));

    send(envelope({ type: 'mine' }, { editorId: EDITOR_ID }));
    send(envelope({ type: 'theirs' }, { editorId: 'tt-other' }));
    send(envelope({ type: 'legacy' }));

    expect(received.map(({ type }) => type)).toEqual(['mine', 'legacy']);
  });

  it('ignores anything that is not an action envelope', () => {
    const { runtime, received, send } = setup();
    runtime.subscribe((message) => received.push(message));

    send('not json');
    send(JSON.stringify({ type: 'stateUpdate', payload: {} }));
    send(JSON.stringify({ type: 'action', payload: 'nope' }));

    expect(received).toEqual([]);
  });

  it('stops delivering after unsubscribe and dispose', () => {
    const { win, runtime, received, send } = setup();
    const unsubscribe = runtime.subscribe((message) => received.push(message));
    unsubscribe();
    send(envelope({ type: 'blur' }));
    runtime.subscribe((message) => received.push(message));
    received.length = 0;

    runtime.dispose();
    send(envelope({ type: 'focus' }));

    expect(received).toEqual([]);
    expect(win.__tentap).toBeUndefined();
    expect(getWebRuntime(win)).toBeUndefined();
  });
});

describe('web → native messages', () => {
  it('tags posted messages with the editor id and protocol version', () => {
    const { posted, start } = createWindow(buildBootScript(config()));
    const runtime = start();

    runtime.post({ type: 'content-update' });
    runtime.announceReady();

    expect(posted).toEqual([
      { type: 'content-update', editorId: EDITOR_ID, v: PROTOCOL_VERSION },
      {
        type: 'editor-ready',
        payload: {
          protocol: PROTOCOL_VERSION,
          capabilities: [...WEB_RUNTIME_CAPABILITIES],
          editorId: EDITOR_ID,
        },
        editorId: EDITOR_ID,
        v: PROTOCOL_VERSION,
      },
    ]);
  });

  it('sendMessage posts untagged JSON when no runtime is running', () => {
    const postMessage = vi.fn();
    window.ReactNativeWebView = { postMessage };

    sendMessage({ type: 'custom', payload: 1 });

    expect(postMessage).toHaveBeenCalledWith('{"type":"custom","payload":1}');
  });

  it('reports exceptions as boot-error', () => {
    const { posted, start } = createWindow(buildBootScript(config()));

    start().reportBootError(new Error('render failed'));

    expect(posted[0]).toMatchObject({
      type: 'boot-error',
      payload: { reason: 'exception', message: 'render failed' },
    });
  });
});

describe('window.__tentap', () => {
  it('sets and removes inputmode on every editor, including later ones', () => {
    const { win, start } = createWindow(buildBootScript(config()));
    const runtime = start();
    const existing = win.document.createElement('div');
    existing.className = 'ProseMirror';
    win.document.body.appendChild(existing);

    win.__tentap?.setInputMode('none');
    const later = win.document.createElement('div');
    runtime.applyInputMode(later);

    expect(existing.getAttribute('inputmode')).toBe('none');
    expect(later.getAttribute('inputmode')).toBe('none');

    win.__tentap?.setInputMode(null);
    expect(existing.hasAttribute('inputmode')).toBe(false);
  });

  it('upserts a tagged stylesheet', () => {
    const { win, start } = createWindow(buildBootScript(config()));
    start();

    win.__tentap?.applyStyleSheet('theme', 'p { color: red; }');
    win.__tentap?.applyStyleSheet('theme', 'p { color: blue; }');

    const styles = win.document.querySelectorAll('style[data-tag="theme"]');
    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).toBe('p { color: blue; }');
  });

  it('is not installed before a config exists', () => {
    const { win, start } = createWindow();
    start();

    expect(win.__tentap).toBeUndefined();
    expect(BOOT_CONFIG_GLOBAL in win).toBe(false);
  });
});
