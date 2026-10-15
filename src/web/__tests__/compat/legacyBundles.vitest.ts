import { afterEach, describe, expect, it } from 'vitest';
import { TenTapStartKit } from '../../../bridges/StarterKit';
import {
  buildBootConfig,
  buildLegacyGlobalsScript,
  injectBootIntoHtml,
  type BootConfigInput,
} from '../../../shared/bootConfig';
import {
  createActionEnvelope,
  encodeMessage,
  type BridgeMessage,
} from '../../../shared/protocol';
import {
  LEGACY_VERSIONS,
  loadEditorPage,
  readLegacyHtml,
  type EditorPage,
  type LegacyVersion,
  type WebMessage,
} from '../../../__tests__/compat/legacyBundle';

/**
 * The default web bundles shipped in 1.0.1 and 0.7.x (also the template every
 * custom bundle was built from) must keep working with what 1.1 native sends:
 * the boot globals, the action envelope and the RPC replies.
 */

const bootInput = (overrides: Partial<BootConfigInput> = {}) =>
  buildBootConfig({
    editorId: 'legacy-compat',
    bridges: TenTapStartKit,
    platform: 'ios',
    initialContent: '<p>Hello TenTap</p>',
    ...overrides,
  });

let pages: EditorPage[] = [];

const open = (
  version: LegacyVersion,
  boot: 'globals' | 'inline' = 'globals',
  overrides?: Partial<BootConfigInput>
) => {
  const config = bootInput(overrides);
  const page =
    boot === 'globals'
      ? loadEditorPage(readLegacyHtml(version), {
          injectedJavaScriptBeforeContentLoaded:
            buildLegacyGlobalsScript(config),
        })
      : loadEditorPage(injectBootIntoHtml(readLegacyHtml(version), config));
  pages.push(page);
  return page;
};

let sequence = 0;
const send = (page: EditorPage, message: BridgeMessage, id?: string) =>
  page.postMessage(
    encodeMessage(
      createActionEnvelope(message, {
        id: id ?? `legacy-compat.${++sequence}`,
        editorId: 'legacy-compat',
      })
    )
  );

const isType = (type: string) => (message: WebMessage) => message.type === type;

const getHTML = async (page: EditorPage) => {
  const messageId = `html-${++sequence}`;
  send(page, { type: 'get-html', payload: { messageId } });
  const reply = await page.waitForMessage(
    (message) =>
      message.type === 'send-html-back' &&
      (message.payload as { messageId?: string }).messageId === messageId
  );
  return (reply.payload as { content: string }).content;
};

afterEach(() => {
  pages.forEach((page) => page.close());
  pages = [];
});

describe.each(LEGACY_VERSIONS)('legacy %s bundle', (version) => {
  it('boots from the legacy globals and reports editor-ready', async () => {
    const page = open(version);

    await page.waitForMessage(isType('editor-ready'));
    expect(page.errors).toEqual([]);
  });

  it('boots from the inline boot script', async () => {
    const page = open(version, 'inline');

    await page.waitForMessage(isType('editor-ready'));
    expect(await getHTML(page)).toBe('<p>Hello TenTap</p>');
  });

  it('answers content RPCs with the initial content', async () => {
    const page = open(version);
    await page.waitForMessage(isType('editor-ready'));

    expect(await getHTML(page)).toBe('<p>Hello TenTap</p>');
  });

  it('applies bridge commands sent in the 1.1 envelope', async () => {
    const page = open(version);
    await page.waitForMessage(isType('editor-ready'));

    send(page, { type: 'set-content', payload: { content: '<p>Bold me</p>' } });
    send(page, { type: 'focus', payload: 'all' });
    send(page, { type: 'toggle-bold' });

    expect(await getHTML(page)).toBe('<p><strong>Bold me</strong></p>');
  });

  it('drops a repeated envelope id (react-native-webview#3305 workaround)', async () => {
    const page = open(version);
    await page.waitForMessage(isType('editor-ready'));
    send(page, { type: 'focus', payload: 'all' });

    send(page, { type: 'toggle-bold' }, 'legacy-compat.repeated');
    send(page, { type: 'toggle-bold' }, 'legacy-compat.repeated');

    expect(await getHTML(page)).toBe('<p><strong>Hello TenTap</strong></p>');
  });

  it('finds the history bridge config under its legacy or current name', async () => {
    const page = open(version);
    await page.waitForMessage(isType('editor-ready'));

    send(page, {
      type: 'set-content',
      payload: { content: '<p>Edited</p>' },
    });
    const update = await page.waitForMessage(
      (message) =>
        message.type === 'stateUpdate' &&
        'canUndo' in (message.payload as object)
    );
    expect(update.payload).toMatchObject({ canUndo: expect.any(Boolean) });
  });

  // The 1.0.1 bundle measures `.ProseMirror` before it is mounted and throws
  // in dynamic height mode (#342); native cannot repair that bundle.
  it.runIf(version !== '1.0.1')(
    'reports the document height in dynamic height mode',
    async () => {
      const page = open(version, 'globals', { dynamicHeight: true });

      const height = await page.waitForMessage(isType('document-height'));
      expect(typeof height.payload).toBe('number');
    }
  );

  it('starts read-only when booted with editable false', async () => {
    const page = open(version, 'globals', { editable: false });
    await page.waitForMessage(isType('editor-ready'));

    const editor = page.window.document.querySelector('.ProseMirror');
    expect(editor?.getAttribute('contenteditable')).toBe('false');
  });
});
