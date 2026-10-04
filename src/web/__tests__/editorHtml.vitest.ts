import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { TenTapStartKit } from '../../bridges/StarterKit';
import {
  BOOT_MARKER,
  buildBootConfig,
  buildBootScript,
  buildLegacyGlobalsScript,
  injectBootIntoHtml,
  type BootConfigInput,
} from '../../shared/bootConfig';
import { createActionEnvelope, encodeMessage } from '../../shared/protocol';
import {
  loadEditorPage,
  type EditorPage,
  type WebMessage,
} from '../../__tests__/compat/legacyBundle';

/**
 * The built default editor (`yarn editor:build`), loaded the way a WebView
 * loads it. Skipped when the bundle has not been built.
 */

const BUILT_HTML = path.resolve(
  __dirname,
  '../../simpleWebEditor/build/index.html'
);
const built = fs.existsSync(BUILT_HTML);
const EDITOR_ID = 'tt-built';

const config = (overrides: Partial<BootConfigInput> = {}) =>
  buildBootConfig({
    editorId: EDITOR_ID,
    bridges: TenTapStartKit,
    platform: 'android',
    initialContent: '<p>Hello TenTap</p>',
    ...overrides,
  });

let pages: EditorPage[] = [];
const track = (page: EditorPage) => {
  pages.push(page);
  return page;
};

const isType = (type: string) => (message: WebMessage) => message.type === type;

afterEach(() => {
  pages.forEach((page) => page.close());
  pages = [];
});

describe.skipIf(!built)('built editorHtml', () => {
  const html = built ? fs.readFileSync(BUILT_HTML, 'utf8') : '';

  it('has the boot marker before the bundle script', () => {
    const marker = html.indexOf(BOOT_MARKER);
    expect(marker).toBeGreaterThan(-1);
    expect(marker).toBeLessThan(html.indexOf('<script'));
  });

  it('boots from the inline config: editor-ready, then the full state', async () => {
    const page = track(loadEditorPage(injectBootIntoHtml(html, config())));

    await page.waitForMessage(isType('stateUpdate'));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(page.errors).toEqual([]);
    expect(page.messages.filter(isType('editor-ready'))).toHaveLength(1);
    expect(page.messages[0]).toMatchObject({
      type: 'editor-ready',
      editorId: EDITOR_ID,
      payload: { protocol: 2, editorId: EDITOR_ID },
    });
    expect(page.messages[1]).toMatchObject({
      type: 'stateUpdate',
      payload: { isReady: true, editable: true },
    });
  });

  it('applies commands and answers RPCs', async () => {
    const page = track(loadEditorPage(injectBootIntoHtml(html, config())));
    await page.waitForMessage(isType('editor-ready'));

    const send = (message: { type: string; payload?: unknown }, n: number) =>
      page.postMessage(
        encodeMessage(
          createActionEnvelope(message, {
            id: `${EDITOR_ID}.${n}`,
            editorId: EDITOR_ID,
          })
        )
      );
    send({ type: 'set-content', payload: { content: '<p>Bold me</p>' } }, 1);
    send({ type: 'focus', payload: 'all' }, 2);
    send({ type: 'toggle-bold' }, 3);
    send({ type: 'get-html', payload: { messageId: `${EDITOR_ID}.4` } }, 4);

    const reply = await page.waitForMessage(isType('send-html-back'));
    expect(reply.payload).toMatchObject({
      content: '<p><strong>Bold me</strong></p>',
    });
  });

  it('boots from the globals of a 1.0.1 native side', async () => {
    const page = track(
      loadEditorPage(html, {
        injectedJavaScriptBeforeContentLoaded: buildLegacyGlobalsScript(
          config({ editable: false })
        ),
      })
    );

    const state = await page.waitForMessage(isType('stateUpdate'));
    expect(state.payload).toMatchObject({ isReady: true, editable: false });
    const editor = page.window.document.querySelector('.ProseMirror');
    expect(editor?.getAttribute('contenteditable')).toBe('false');
  });

  it('waits for a config injected after the bundle ran', async () => {
    const page = track(loadEditorPage(html));
    expect(page.window.document.querySelector('.ProseMirror')).toBeNull();

    page.injectJavaScript(buildBootScript(config()));

    await page.waitForMessage(isType('editor-ready'));
    expect(page.window.document.querySelector('.ProseMirror')).not.toBeNull();
  });

  it('reports the content height in dynamic height mode', async () => {
    const page = track(
      loadEditorPage(injectBootIntoHtml(html, config({ dynamicHeight: true })))
    );

    const height = await page.waitForMessage(isType('document-height'));
    expect(typeof height.payload).toBe('number');
    const wrapper = page.window.document.querySelector('.dynamic-height');
    expect(wrapper?.classList.contains('tentap-root')).toBe(true);
  });
});
