import {
  INPUT_MODE_RESTORE_SCRIPT,
  INPUT_MODE_SUPPRESS_SCRIPT,
  PRESS_LISTENER_GLOBAL,
  pressListenerScript,
} from '../webSnippets';

type Handler = () => void;

/** Just enough of a WebView page to run the snippets in strict mode. */
const createPage = ({ runtime = false, editorId = 'tt-1' } = {}) => {
  const attributes = new Map<string, string>();
  const handlers = new Map<string, Handler[]>();
  const editorElement = {
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    removeAttribute: (name: string) => attributes.delete(name),
  };
  const document = {
    querySelector: (selector: string) =>
      selector === '.ProseMirror' ? editorElement : null,
    addEventListener: (type: string, handler: Handler, capture: boolean) => {
      expect(capture).toBe(true);
      handlers.set(type, [...(handlers.get(type) ?? []), handler]);
    },
  };
  const postMessage = jest.fn();
  const setInputMode = jest.fn();
  const window: Record<string, unknown> = {
    ReactNativeWebView: { postMessage },
  };
  if (runtime) window.__tentap = { editorId, setInputMode };
  const run = (script: string) =>
    new Function('window', 'document', `"use strict";${script}`)(
      window,
      document
    );
  const fire = (type: string) => handlers.get(type)?.forEach((h) => h());
  const tap = (moved = false) => {
    fire('touchstart');
    if (moved) fire('touchmove');
    fire('touchend');
  };
  return {
    run,
    tap,
    window,
    attributes,
    handlers,
    postMessage,
    setInputMode,
  };
};

describe('inputmode scripts', () => {
  it('toggle the attribute on legacy bundles', () => {
    const page = createPage();
    page.run(INPUT_MODE_SUPPRESS_SCRIPT);
    expect(page.attributes.get('inputmode')).toBe('none');
    page.run(INPUT_MODE_RESTORE_SCRIPT);
    expect(page.attributes.has('inputmode')).toBe(false);
  });

  it('use the 1.1 web runtime when present', () => {
    const page = createPage({ runtime: true });
    page.run(INPUT_MODE_SUPPRESS_SCRIPT);
    page.run(INPUT_MODE_RESTORE_SCRIPT);
    expect(page.setInputMode.mock.calls).toEqual([['none'], [null]]);
    expect(page.attributes.size).toBe(0);
  });

  it('match the Android InputModeScript strings', () => {
    expect(INPUT_MODE_SUPPRESS_SCRIPT).toBe(
      "(function(){var t=window.__tentap;if(t&&t.setInputMode){t.setInputMode('none');return}" +
        "var e=document.querySelector('.ProseMirror');if(e){e.setAttribute('inputmode','none')}})();true;"
    );
    expect(INPUT_MODE_RESTORE_SCRIPT).toBe(
      '(function(){var t=window.__tentap;if(t&&t.setInputMode){t.setInputMode(null);return}' +
        "var e=document.querySelector('.ProseMirror');if(e){e.removeAttribute('inputmode')}})();true;"
    );
  });
});

describe('press listener script', () => {
  it('posts a press for a tap without movement', () => {
    const page = createPage();
    page.run(pressListenerScript(true));
    page.tap();
    expect(page.postMessage).toHaveBeenCalledWith(
      JSON.stringify({ type: 'tentap-editor-press' })
    );
    page.tap(true);
    expect(page.postMessage).toHaveBeenCalledTimes(1);
  });

  it('tags the press with the editor id of the web runtime', () => {
    const page = createPage({ runtime: true, editorId: 'tt-42' });
    page.run(pressListenerScript(true));
    page.tap();
    expect(JSON.parse(page.postMessage.mock.calls[0][0])).toEqual({
      type: 'tentap-editor-press',
      editorId: 'tt-42',
      v: 2,
    });
  });

  it('installs once and can be switched off', () => {
    const page = createPage();
    page.run(pressListenerScript(true));
    page.run(pressListenerScript(true));
    expect(page.handlers.get('touchend')).toHaveLength(1);
    page.run(pressListenerScript(false));
    page.tap();
    expect(page.postMessage).not.toHaveBeenCalled();
    expect(page.window[PRESS_LISTENER_GLOBAL]).toEqual({
      on: false,
      moved: false,
    });
  });
});
