import {
  BOOT_CONFIG_GLOBAL,
  BOOT_MARKER,
  bootConfigFromLegacyGlobals,
  buildBootConfig,
  buildBootScript,
  buildBridgeConfigs,
  buildLegacyGlobalsScript,
  injectBootIntoHtml,
  legacyGlobalsFromBootConfig,
  readBootConfig,
  resolveBridgeConfig,
  type BootBridge,
  type BootConfig,
} from '../bootConfig';
import { PROTOCOL_VERSION } from '../protocol';

const bridges: BootBridge[] = [
  { name: 'bold' },
  { name: 'undoRedo', config: { depth: 10 } },
  { name: 'link', config: { openOnClick: false, autolink: true } },
  {
    name: 'placeholder',
    config: { placeholder: "Don't `stop` ${now} </script>" },
  },
];

const config = buildBootConfig({
  editorId: 'tt1',
  bridges,
  platform: 'ios',
  initialContent: '<p>it\'s "quoted"</p>',
});

/** Runs a boot script against a plain object standing in for `window`. */
const runScript = (script: string, win: Record<string, unknown> = {}) => {
  new Function('window', script)(win);
  return win;
};

describe('buildBootConfig', () => {
  it('collects the bridge configs, whitelist and defaults', () => {
    expect(config).toEqual({
      protocol: PROTOCOL_VERSION,
      editorId: 'tt1',
      bridgeConfigs: {
        bold: {},
        undoRedo: { optionsConfig: { depth: 10 } },
        history: { optionsConfig: { depth: 10 } },
        link: { optionsConfig: { openOnClick: false, autolink: true } },
        placeholder: {
          optionsConfig: { placeholder: "Don't `stop` ${now} </script>" },
        },
      },
      whitelist: ['bold', 'undoRedo', 'link', 'placeholder'],
      initialContent: '<p>it\'s "quoted"</p>',
      editable: true,
      disableColorHighlight: false,
      dynamicHeight: false,
      platform: 'ios',
    });
  });

  it('keeps explicit options and omits empty content', () => {
    const custom = buildBootConfig({
      editorId: 'tt2',
      bridges: [],
      platform: 'android',
      initialContent: '',
      editable: false,
      disableColorHighlight: true,
      dynamicHeight: true,
      parseOptions: { preserveWhitespace: 'full' },
    });
    expect(custom).toMatchObject({
      editable: false,
      disableColorHighlight: true,
      dynamicHeight: true,
      parseOptions: { preserveWhitespace: 'full' },
    });
    expect('initialContent' in custom).toBe(false);
  });

  it('accepts object content', () => {
    const doc = { type: 'doc', content: [] };
    expect(
      buildBootConfig({
        editorId: 'x',
        bridges,
        platform: 'web',
        initialContent: doc,
      }).initialContent
    ).toBe(doc);
  });
});

describe('history alias', () => {
  it('publishes the undoRedo config under history for 0.7.x bundles', () => {
    const configs = buildBridgeConfigs([
      { name: 'undoRedo', config: { depth: 5 } },
    ]);
    expect(configs.history).toEqual({ optionsConfig: { depth: 5 } });
  });

  it('never overrides a bridge that is really named history', () => {
    const configs = buildBridgeConfigs([
      { name: 'undoRedo', config: { depth: 5 } },
      { name: 'history', config: { mine: true } },
    ]);
    expect(configs.history).toEqual({ optionsConfig: { mine: true } });
    expect(
      buildBridgeConfigs([
        { name: 'history', config: { mine: true } },
        { name: 'undoRedo', config: { depth: 5 } },
      ]).history
    ).toEqual({ optionsConfig: { mine: true } });
  });

  it('adds nothing without a HistoryBridge', () => {
    expect(Object.keys(buildBridgeConfigs([{ name: 'bold' }]))).toEqual([
      'bold',
    ]);
  });

  it('is not added to the whitelist', () => {
    expect(config.whitelist).not.toContain('history');
  });

  it('resolves either name on the web side', () => {
    const legacyOnly = { history: { optionsConfig: { depth: 1 } } };
    const modernOnly = { undoRedo: { optionsConfig: { depth: 2 } } };
    expect(resolveBridgeConfig(legacyOnly, 'undoRedo')).toEqual({
      optionsConfig: { depth: 1 },
    });
    expect(resolveBridgeConfig(modernOnly, 'history')).toEqual({
      optionsConfig: { depth: 2 },
    });
    expect(resolveBridgeConfig(modernOnly, 'undoRedo')).toEqual({
      optionsConfig: { depth: 2 },
    });
    expect(resolveBridgeConfig(modernOnly, 'bold')).toBeUndefined();
    expect(resolveBridgeConfig(modernOnly, 'toString')).toBeUndefined();
  });
});

describe('legacy globals', () => {
  it('sets exactly the 1.0 globals in the 1.0 order', () => {
    const win = runScript(buildLegacyGlobalsScript(config));
    expect(Object.keys(win)).toEqual([
      'bridgeExtensionConfigMap',
      'whiteListBridgeExtensions',
      'initialContent',
      'editable',
      'disableColorHighlight',
      'dynamicHeight',
      'contentInjected',
      'platform',
    ]);
    expect(win).toEqual(legacyGlobalsFromBootConfig(config));
    expect(JSON.parse(win.bridgeExtensionConfigMap as string)).toEqual(
      config.bridgeConfigs
    );
  });

  it('skips initialContent when there is none, as 1.0 did', () => {
    const { initialContent: _omit, ...withoutContent } = config;
    const win = runScript(buildLegacyGlobalsScript(withoutContent));
    expect('initialContent' in win).toBe(false);
  });

  it('round-trips through bootConfigFromLegacyGlobals', () => {
    const globals = legacyGlobalsFromBootConfig(config);
    expect(bootConfigFromLegacyGlobals(globals, 'tt1')).toEqual({
      ...config,
      protocol: 1,
    });
  });

  it('reads the globals a 1.0.1 native side wrote', () => {
    expect(
      bootConfigFromLegacyGlobals(
        {
          bridgeExtensionConfigMap: '{"bold":{}}',
          whiteListBridgeExtensions: ['bold'],
          editable: 'false',
          dynamicHeight: undefined,
          contentInjected: true,
          platform: 'android',
        },
        'own'
      )
    ).toEqual({
      protocol: 1,
      editorId: 'own',
      bridgeConfigs: { bold: {} },
      whitelist: ['bold'],
      editable: false,
      disableColorHighlight: false,
      dynamicHeight: false,
      platform: 'android',
    });
  });

  it('survives the broken config string 1.0.1 produced for apostrophes', () => {
    const parsed = bootConfigFromLegacyGlobals(
      {
        bridgeExtensionConfigMap: '{"placeholder":{"optionsConfig":{"x":"don',
        editable: true,
      },
      'own'
    );
    expect(parsed.bridgeConfigs).toEqual({});
    expect(parsed.editable).toBe(true);
    expect(parsed.platform).toBe('web');
  });
});

describe('buildBootScript', () => {
  it('sets __TENTAP__ and the legacy globals', () => {
    const win = runScript(buildBootScript(config));
    expect(win[BOOT_CONFIG_GLOBAL]).toEqual(config);
    expect(win).toMatchObject(legacyGlobalsFromBootConfig(config));
  });

  it('runs once even when injected again', () => {
    const win = runScript(buildBootScript(config));
    const other = buildBootConfig({
      editorId: 'tt9',
      bridges: [],
      platform: 'web',
    });
    runScript(buildBootScript(other), win);
    expect((win[BOOT_CONFIG_GLOBAL] as BootConfig).editorId).toBe('tt1');
    expect(win.platform).toBe('ios');
  });

  it('is strict-mode clean and creates no implicit globals', () => {
    const before = new Set(Object.keys(globalThis));
    runScript(`"use strict";${buildBootScript(config)}`);
    expect(Object.keys(globalThis).filter((key) => !before.has(key))).toEqual(
      []
    );
  });

  it('ends with true for WebView injection', () => {
    expect(buildBootScript(config).endsWith('true;')).toBe(true);
  });

  it('never contains a closing script tag or raw line separators', () => {
    const nasty = buildBootConfig({
      editorId: 'x',
      bridges: [{ name: 'p', config: { text: '</script>\u2028\u2029<!--' } }],
      platform: 'web',
      initialContent: '</SCRIPT><script>alert(1)</script>',
    });
    expect(buildBootScript(nasty)).not.toMatch(
      /<\/script|<!--|[\u2028\u2029]/i
    );
  });
});

describe('injectBootIntoHtml', () => {
  const tag = `<script>${buildBootScript(config)}</script>`;

  it('replaces the boot marker', () => {
    const html = `<html><head><title>x</title>${BOOT_MARKER}<script src="a.js"></script></head></html>`;
    expect(injectBootIntoHtml(html, config)).toBe(
      `<html><head><title>x</title>${tag}<script src="a.js"></script></head></html>`
    );
  });

  it('replaces only the first marker', () => {
    const html = `${BOOT_MARKER}<p>${BOOT_MARKER}</p>`;
    expect(injectBootIntoHtml(html, config)).toBe(
      `${tag}<p>${BOOT_MARKER}</p>`
    );
  });

  it('goes right after <head>', () => {
    expect(
      injectBootIntoHtml('<html><head><script></script></head></html>', config)
    ).toBe(`<html><head>${tag}<script></script></head></html>`);
  });

  it('matches <HEAD> with attributes, case-insensitively', () => {
    expect(
      injectBootIntoHtml('<HTML><HEAD lang="en"><SCRIPT></SCRIPT>', config)
    ).toBe(`<HTML><HEAD lang="en">${tag}<SCRIPT></SCRIPT>`);
  });

  it('does not mistake <header> for <head>', () => {
    const html =
      '<html><body><header>x</header><script></script></body></html>';
    expect(injectBootIntoHtml(html, config)).toBe(
      `<html>${tag}<body><header>x</header><script></script></body></html>`
    );
    const both = '<html><head></head><body><header></header></body></html>';
    expect(injectBootIntoHtml(both, config)).toBe(
      `<html><head>${tag}</head><body><header></header></body></html>`
    );
  });

  it('falls back to after the doctype, then to prepending', () => {
    expect(
      injectBootIntoHtml('<!DOCTYPE html><div id="root"></div>', config)
    ).toBe(`<!DOCTYPE html>${tag}<div id="root"></div>`);
    expect(injectBootIntoHtml('<div id="root"></div>', config)).toBe(
      `${tag}<div id="root"></div>`
    );
  });

  it('puts the boot script before the first bundle script', () => {
    const html =
      '<!doctype html><html lang="en"><head><meta charset="UTF-8" /><script type="module">boot()</script></head></html>';
    const result = injectBootIntoHtml(html, config);
    expect(result.indexOf(tag)).toBeLessThan(
      result.indexOf('<script type="module">')
    );
  });

  it('is not confused by replacement patterns in the content', () => {
    const tricky = buildBootConfig({
      editorId: 'x',
      bridges: [],
      platform: 'web',
      initialContent: "$& $' $` $$ $1",
    });
    const result = injectBootIntoHtml('<head></head>', tricky);
    const win = runScript(
      result.slice('<head><script>'.length, -'</script></head>'.length)
    );
    expect(win.initialContent).toBe("$& $' $` $$ $1");
  });
});

describe('readBootConfig', () => {
  it('accepts a boot config', () => {
    expect(readBootConfig(JSON.parse(JSON.stringify(config)))).toEqual(config);
  });

  it.each([
    ['undefined', undefined],
    ['a string', 'config'],
    ['a missing editor id', { ...config, editorId: undefined }],
    ['an unknown platform', { ...config, platform: 'symbian' }],
    ['a non-boolean editable', { ...config, editable: 'true' }],
    ['a missing whitelist', { ...config, whitelist: undefined }],
  ])('rejects %s', (_name, value) => {
    expect(readBootConfig(value)).toBeNull();
  });
});
