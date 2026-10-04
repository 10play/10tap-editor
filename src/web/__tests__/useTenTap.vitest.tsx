import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BridgeExtension from '../../bridges/base';
import { BoldBridge } from '../../bridges/bold';
import { CoreBridge } from '../../bridges/core';
import { ItalicBridge } from '../../bridges/italic';
import { LinkBridge } from '../../bridges/link';
import { TenTapStartKit } from '../../bridges/StarterKit';
import {
  buildBootConfig,
  legacyGlobalsFromBootConfig,
  type BootConfig,
  type BootConfigInput,
} from '../../shared/bootConfig';
import {
  createActionEnvelope,
  encodeMessage,
  type BridgeMessage,
  type WebMessage,
} from '../../shared/protocol';
import { DynamicHeight } from '../dynamicHeight';
import { boot, getWebRuntime } from '../runtime';
import { DYNAMIC_HEIGHT_STYLE_TAG } from '../styles';
import { useTenTap, type UseTenTapArgs } from '../useTenTap';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

const EDITOR_ID = 'tt-hook';

type GlobalKey = keyof ReturnType<typeof legacyGlobalsFromBootConfig>;
const globalWindow = window as unknown as Record<string, unknown>;

let posted: WebMessage[] = [];
let root: Root | undefined;
let container: HTMLDivElement;

const configure = (input: Partial<BootConfigInput> = {}): BootConfig => {
  const config = buildBootConfig({
    editorId: EDITOR_ID,
    bridges: TenTapStartKit,
    platform: 'ios',
    initialContent: '<p>Hello</p>',
    ...input,
  });
  window.__TENTAP__ = config;
  Object.assign(window, legacyGlobalsFromBootConfig(config));
  return config;
};

const send = (message: BridgeMessage, editorId = EDITOR_ID) =>
  window.dispatchEvent(
    new MessageEvent('message', {
      data: encodeMessage(createActionEnvelope(message, { editorId })),
    })
  );

const types = () => posted.map(({ type }) => type);

const waitForType = (type: string) =>
  vi.waitFor(() => {
    const found = posted.find((message) => message.type === type);
    if (!found) throw new Error(`no ${type} in ${types().join(', ')}`);
    return found;
  });

/** Renders `useTenTap(args)` and resolves with the editor once created. */
const mount = async (
  args: UseTenTapArgs = { bridges: TenTapStartKit },
  { strict = false } = {}
) => {
  let editor: Editor | null = null;
  let rerender: () => void = () => {};
  const Host = () => {
    const [, setTick] = useState(0);
    rerender = () => setTick((tick) => tick + 1);
    editor = useTenTap(args);
    return <EditorContent editor={editor} />;
  };
  root = createRoot(container);
  await act(async () =>
    root?.render(
      strict ? (
        <React.StrictMode>
          <Host />
        </React.StrictMode>
      ) : (
        <Host />
      )
    )
  );
  await waitForType('editor-ready');
  return {
    editor: editor as unknown as Editor,
    rerender: () => act(async () => rerender()),
  };
};

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  posted = [];
  window.ReactNativeWebView = {
    postMessage: (data: string) => posted.push(JSON.parse(data)),
  };
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  getWebRuntime()?.dispose();
  delete window.__TENTAP__;
  const keys: GlobalKey[] = [
    'bridgeExtensionConfigMap',
    'whiteListBridgeExtensions',
    'initialContent',
    'editable',
    'disableColorHighlight',
    'dynamicHeight',
    'contentInjected',
    'platform',
  ];
  keys.forEach((key) => delete globalWindow[key]);
  document.body.innerHTML = '';
  document.head
    .querySelectorAll('style[data-tag]')
    .forEach((style) => style.remove());
});

describe('readiness (#343, #322)', () => {
  it('announces editor-ready with capabilities, then a full stateUpdate', async () => {
    configure();
    await mount();

    expect(types().slice(0, 2)).toEqual(['editor-ready', 'stateUpdate']);
    expect(types().filter((type) => type === 'editor-ready')).toHaveLength(1);
    expect(posted[0]).toMatchObject({
      editorId: EDITOR_ID,
      payload: {
        editorId: EDITOR_ID,
        capabilities: expect.arrayContaining(['styles', 'inputMode']),
      },
    });
    expect(posted[1]?.payload).toMatchObject({
      isReady: true,
      editable: true,
      empty: false,
      isBoldActive: false,
      selection: { from: expect.any(Number), to: expect.any(Number) },
    });
  });

  it('announces only the editor it keeps under StrictMode', async () => {
    configure();
    boot();
    send({ type: 'set-content', payload: { content: '<p>Strict</p>' } });

    const { editor } = await mount(
      { bridges: TenTapStartKit },
      { strict: true }
    );
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(types().filter((type) => type === 'editor-ready')).toHaveLength(1);
    expect(editor.isDestroyed).toBe(false);
    expect(editor.getHTML()).toBe('<p>Strict</p>');
  });

  it('starts read-only and reports it when booted with editable false', async () => {
    configure({ editable: false });
    const { editor } = await mount();

    expect(editor.isEditable).toBe(false);
    expect(posted[1]?.payload).toMatchObject({
      isReady: true,
      editable: false,
    });
  });

  it('applies commands native sent before the editor existed', async () => {
    configure();
    boot();
    send({ type: 'set-content', payload: { content: '<p>Early</p>' } });

    const { editor } = await mount();

    expect(editor.getHTML()).toBe('<p>Early</p>');
  });

  it('ignores commands addressed to another editor (#318)', async () => {
    configure();
    const { editor } = await mount();

    send({ type: 'set-content', payload: { content: '<p>No</p>' } }, 'other');

    expect(editor.getHTML()).toBe('<p>Hello</p>');
  });

  it('answers content RPCs through the tagged channel', async () => {
    configure();
    await mount();

    send({ type: 'get-html', payload: { messageId: `${EDITOR_ID}.7` } });

    expect(await waitForType('send-html-back')).toEqual({
      type: 'send-html-back',
      payload: { content: '<p>Hello</p>', messageId: `${EDITOR_ID}.7` },
      editorId: EDITOR_ID,
      v: 2,
    });
  });

  it('sends debounced state and content updates after edits', async () => {
    configure();
    const { editor } = await mount();
    posted = [];

    act(() => {
      editor.commands.selectAll();
      editor.commands.toggleBold();
    });

    const update = await vi.waitFor(() => {
      const last = posted.filter(({ type }) => type === 'stateUpdate').pop();
      if (!last) throw new Error('no stateUpdate');
      return last;
    });
    expect(update.payload).toMatchObject({ isBoldActive: true });
    expect(types()).toContain('content-update');
  });
});

describe('tiptap options', () => {
  it('runs user lifecycle handlers after the protocol ones', async () => {
    configure();
    const onCreate = vi.fn();
    const onTransaction = vi.fn();
    const onUpdate = vi.fn();
    const { editor } = await mount({
      bridges: TenTapStartKit,
      tiptapOptions: { onCreate, onTransaction, onUpdate },
    });

    expect(onCreate).toHaveBeenCalledTimes(1);
    act(() => {
      editor.commands.insertContent('!');
    });

    expect(onTransaction).toHaveBeenCalled();
    expect(onUpdate).toHaveBeenCalled();
    await waitForType('content-update');
  });

  it('lets content, editable and editorProps override the defaults', async () => {
    configure();
    const handleScrollToSelection = vi.fn(() => true);
    const { editor } = await mount({
      bridges: TenTapStartKit,
      tiptapOptions: {
        content: '<p>Own</p>',
        editable: false,
        editorProps: { handleScrollToSelection },
      },
    });

    expect(editor.getHTML()).toBe('<p>Own</p>');
    expect(editor.isEditable).toBe(false);
    expect(editor.options.editorProps.handleScrollToSelection).toBe(
      handleScrollToSelection
    );
  });

  it('applies parseOptions from the boot config (#327)', async () => {
    configure({
      initialContent: '<p>a   b</p>',
      parseOptions: { preserveWhitespace: 'full' },
    });
    const { editor } = await mount();

    expect(editor.getText()).toBe('a   b');
  });
});

describe('extensions (#309)', () => {
  it('loads only the bridges native configured', async () => {
    configure({ bridges: [CoreBridge, BoldBridge] });
    const { editor } = await mount({
      bridges: [CoreBridge, BoldBridge, ItalicBridge],
    });

    const names = editor.extensionManager.extensions.map(({ name }) => name);
    expect(names).toContain('bold');
    expect(names).not.toContain('italic');
    expect(posted[1]?.payload).not.toHaveProperty('isItalicActive');
  });

  it('configures bridges without mutating them', async () => {
    const link = LinkBridge.configureExtension({ openOnClick: false });
    const original = link.tiptapExtension;
    configure({ bridges: [CoreBridge, link] });

    const { editor } = await mount({ bridges: [CoreBridge, link] });

    expect(link.tiptapExtension).toBe(original);
    const loaded = editor.extensionManager.extensions.find(
      ({ name }) => name === 'link'
    );
    expect(loaded?.options.openOnClick).toBe(false);
  });

  it('loads shared bridge dependencies once', async () => {
    const warn = vi.spyOn(console, 'warn');
    configure();
    await mount();

    const warnings = warn.mock.calls.flat().map(String);
    expect(warnings.filter((text) => text.includes('Duplicate'))).toEqual([]);
  });

  it('accepts CSS-only bridges', async () => {
    const cssOnly = new BridgeExtension({
      forceName: 'cssOnly',
      extendCSS: 'p { color: red; }',
    });
    configure({ bridges: [CoreBridge, cssOnly] });

    const { editor } = await mount({ bridges: [CoreBridge, cssOnly] });

    expect(editor.isDestroyed).toBe(false);
  });

  it('does not reconfigure the editor when it re-renders', async () => {
    configure();
    const { editor, rerender } = await mount();
    const setOptions = vi.spyOn(editor, 'setOptions');

    await rerender();
    await rerender();

    expect(setOptions).not.toHaveBeenCalled();
  });

  it('adds the selection highlight unless disabled', async () => {
    configure();
    const { editor } = await mount();
    expect(
      editor.state.plugins.some((plugin) =>
        (plugin as unknown as { key: string }).key.startsWith('blueBackground')
      )
    ).toBe(true);
  });

  it('omits the selection highlight with disableColorHighlight', async () => {
    configure({ disableColorHighlight: true });
    const { editor } = await mount();
    expect(
      editor.state.plugins.some((plugin) =>
        (plugin as unknown as { key: string }).key.startsWith('blueBackground')
      )
    ).toBe(false);
  });
});

describe('dynamic height', () => {
  it('reports the content height and injects the corrected CSS', async () => {
    configure({ dynamicHeight: true });
    await mount();

    expect(await waitForType('document-height')).toMatchObject({
      payload: expect.any(Number),
      editorId: EDITOR_ID,
    });
    expect(
      document.head.querySelector(
        `style[data-tag="${DYNAMIC_HEIGHT_STYLE_TAG}"]`
      )
    ).not.toBeNull();
  });

  it('routes container-height to the scroll policy', async () => {
    const setContainerHeight = vi.spyOn(
      DynamicHeight.prototype,
      'setContainerHeight'
    );
    configure({ dynamicHeight: true });
    await mount();

    send({ type: 'container-height', payload: 240 });

    expect(setContainerHeight).toHaveBeenCalledWith(240);
  });

  it('does nothing extra without dynamic height', async () => {
    configure();
    await mount();

    expect(types()).not.toContain('document-height');
    expect(document.head.querySelector('style[data-tag]')).toBeNull();
  });
});

describe('input mode', () => {
  it('applies the current input mode to an editor created later', async () => {
    configure();
    boot().setInputMode('none');

    const { editor } = await mount();

    expect(editor.view.dom.getAttribute('inputmode')).toBe('none');
  });
});
