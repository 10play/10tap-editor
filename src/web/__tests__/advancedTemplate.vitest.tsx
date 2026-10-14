import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TenTapStartKit } from '../../bridges/StarterKit';
import {
  buildBootConfig,
  buildBootScript,
  buildLegacyGlobalsScript,
} from '../../shared/bootConfig';
import {
  createActionEnvelope,
  encodeMessage,
  type WebMessage,
} from '../../shared/protocol';
import { getWebRuntime } from '../runtime';

/**
 * The custom web bundle template from docs/setup/advancedSetup.md
 * (test/fixtures/advanced-template, whose `@10play/tentap-editor` import the
 * vitest config aliases as the docs' Vite config does): it polls
 * `window.contentInjected`, mounts its own React root and renders
 * `useTenTap` with the starter kit plus a custom bridge.
 */

const EDITOR_ID = 'tt-advanced';
// Not literal imports, so tsc does not type the fixtures against the native
// entry; test/fixtures/advanced-template has its own tsconfig for that.
const FIXTURES = '../../../test/fixtures/advanced-template';
const TEMPLATE = `${FIXTURES}/index`;

let posted: WebMessage[] = [];

const bootConfig = async () => {
  const { CounterBridge } = await import(`${FIXTURES}/CounterBridge`);
  return buildBootConfig({
    editorId: EDITOR_ID,
    bridges: [...TenTapStartKit, CounterBridge],
    platform: 'android',
    initialContent: '<p>one two three</p>',
  });
};

const waitFor = (predicate: (message: WebMessage) => boolean) =>
  vi.waitFor(
    () => {
      const found = posted.find(predicate);
      if (!found) throw new Error('not posted yet');
      return found;
    },
    { timeout: 3000 }
  );

beforeEach(() => {
  vi.resetModules();
  posted = [];
  window.ReactNativeWebView = {
    postMessage: (data: string) => posted.push(JSON.parse(data)),
  };
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
});

afterEach(() => {
  getWebRuntime()?.dispose();
  document.body.innerHTML = '';
});

describe('advancedSetup template', () => {
  it('boots from the 1.1 boot script and runs the custom bridge', async () => {
    window.eval(buildBootScript(await bootConfig()));
    await import(TEMPLATE);

    const ready = await waitFor(({ type }) => type === 'editor-ready');
    expect(ready.editorId).toBe(EDITOR_ID);
    const state = await waitFor(({ type }) => type === 'stateUpdate');
    expect(state.payload).toMatchObject({
      isReady: true,
      wordCount: 3,
      characterCount: 13,
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: encodeMessage(
          createActionEnvelope(
            { type: 'get-html', payload: { messageId: `${EDITOR_ID}.1` } },
            { id: `${EDITOR_ID}.1`, editorId: EDITOR_ID }
          )
        ),
      })
    );
    const html = await waitFor(({ type }) => type === 'send-html-back');
    expect(html.payload).toMatchObject({ content: '<p>one two three</p>' });
  });

  it('boots from the globals a 1.0.1 native side injects', async () => {
    window.eval(buildLegacyGlobalsScript(await bootConfig()));
    await import(TEMPLATE);

    await waitFor(({ type }) => type === 'editor-ready');
    const state = await waitFor(({ type }) => type === 'stateUpdate');
    expect(state.payload).toMatchObject({ isReady: true });
  });
});
