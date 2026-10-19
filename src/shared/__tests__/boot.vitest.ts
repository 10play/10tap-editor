import { afterEach, describe, expect, it } from 'vitest';
import {
  BOOT_MARKER,
  buildBootConfig,
  buildLegacyGlobalsScript,
  injectBootIntoHtml,
  type BootBridge,
  type BootConfigInput,
} from '../bootConfig';

/** `getInjectedJSBeforeContentLoad` as shipped in 1.0.1 (src/RichText/utils.ts). */
const v1InjectedJS = (input: BootConfigInput) =>
  `
      window.bridgeExtensionConfigMap = '${JSON.stringify(
        input.bridges.reduce(
          (acc, bridge) => ({
            ...acc,
            [bridge.name]: {
              optionsConfig: bridge.config,
              extendConfig: bridge.extendConfig,
            },
          }),
          {}
        )
      )}';

      window.whiteListBridgeExtensions = [${input.bridges
        .map((bridge) => `'${bridge.name}'`)
        .join(',')}];
  ${
    input.initialContent
      ? `window.initialContent = ${JSON.stringify(input.initialContent)};`
      : ''
  }
    window.editable = ${input.editable};
    window.disableColorHighlight = ${!!input.disableColorHighlight};
    window.dynamicHeight = ${input.dynamicHeight};
    window.contentInjected = true;
    window.platform = "${input.platform}";
  `
    .replace(/\n/g, '')
    .trim();

type ScriptWindow = typeof globalThis & Record<string, unknown>;

/** A separate browsing context, so each run starts from a clean window. */
const freshWindow = (): ScriptWindow => {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  return iframe.contentWindow as unknown as ScriptWindow;
};

afterEach(() => {
  document.body.innerHTML = '';
});

/** Evaluates `script` in a fresh window and returns the globals it added. */
const globalsAfter = (script: string) => {
  const window = freshWindow();
  const before = new Set(Object.keys(window));
  window.eval(script);
  return Object.fromEntries(
    Object.keys(window)
      .filter((key) => !before.has(key))
      .map((key) => [key, window[key]])
  );
};

const plainBridges: BootBridge[] = [
  { name: 'bold' },
  { name: 'link', config: { openOnClick: false, autolink: true } },
  { name: 'coreBridge' },
];

const input: BootConfigInput = {
  editorId: 'tt1',
  bridges: plainBridges,
  platform: 'android',
  initialContent: '<p>Hello</p>',
  editable: false,
  disableColorHighlight: true,
  dynamicHeight: true,
};

describe('buildLegacyGlobalsScript in a browser window', () => {
  it('yields exactly the globals 1.0.1 injected', () => {
    const legacy = globalsAfter(v1InjectedJS(input));
    const current = globalsAfter(
      buildLegacyGlobalsScript(buildBootConfig(input))
    );
    expect(Object.keys(legacy).sort()).toEqual([
      'bridgeExtensionConfigMap',
      'contentInjected',
      'disableColorHighlight',
      'dynamicHeight',
      'editable',
      'initialContent',
      'platform',
      'whiteListBridgeExtensions',
    ]);
    expect(Object.keys(current).sort()).toEqual(Object.keys(legacy).sort());
    expect(JSON.parse(JSON.stringify(current))).toEqual(
      JSON.parse(JSON.stringify(legacy))
    );
  });

  it('matches 1.0.1 without initial content', () => {
    const empty = { ...input, initialContent: undefined };
    const legacy = globalsAfter(v1InjectedJS(empty));
    const current = globalsAfter(
      buildLegacyGlobalsScript(buildBootConfig(empty))
    );
    expect(Object.keys(current).sort()).toEqual(Object.keys(legacy).sort());
  });

  it('keeps a config with an apostrophe parseable (1.0.1 broke on it)', () => {
    const quoted: BootConfigInput = {
      ...input,
      bridges: [{ name: 'placeholder', config: { placeholder: "Don't stop" } }],
    };
    expect(() => globalsAfter(v1InjectedJS(quoted))).toThrow();
    const globals = globalsAfter(
      buildLegacyGlobalsScript(buildBootConfig(quoted))
    );
    expect(JSON.parse(globals.bridgeExtensionConfigMap as string)).toEqual({
      placeholder: { optionsConfig: { placeholder: "Don't stop" } },
    });
  });
});

describe('injectBootIntoHtml in a browser', () => {
  const page = (head: string) =>
    `<!doctype html><html><head>${head}<script>window.seenConfig = window.__TENTAP__ && window.__TENTAP__.editorId; window.seenInjected = window.contentInjected;</script></head><body><div id="root"></div></body></html>`;

  /** Parses `html` like a browser and runs its inline scripts in order. */
  const load = (html: string) => {
    const window = freshWindow();
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    for (const script of Array.from(parsed.scripts)) {
      window.eval(script.textContent ?? '');
    }
    return window;
  };

  it('runs before the bundle script', () => {
    const config = buildBootConfig(input);
    for (const html of [page(''), page(BOOT_MARKER)]) {
      const window = load(injectBootIntoHtml(html, config));
      expect(window.seenConfig).toBe('tt1');
      expect(window.seenInjected).toBe(true);
    }
  });

  it('delivers hostile content intact without executing it', () => {
    const content =
      "<p>it's `${x}` \\ </script><script>window.pwned = true</script>\u2028\u2029</p>";
    const config = buildBootConfig({
      ...input,
      initialContent: content,
      bridges: [
        { name: 'placeholder', config: { placeholder: '</SCRIPT><!--' } },
      ],
    });
    const window = load(injectBootIntoHtml(page(''), config));
    expect(window.pwned).toBeUndefined();
    expect(window.initialContent).toBe(content);
    expect(
      (window.__TENTAP__ as { initialContent: string }).initialContent
    ).toBe(content);
    expect(
      JSON.parse(window.bridgeExtensionConfigMap as string).placeholder
    ).toEqual({ optionsConfig: { placeholder: '</SCRIPT><!--' } });
  });
});
