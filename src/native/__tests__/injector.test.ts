import { JSDOM } from 'jsdom';
import { Injector, buildStyleSheetScript } from '../injector';

const HOSTILE_CSS = [
  "p::before { content: 'it\\'s'; }",
  'p::after { content: "`${x}`"; }',
  '/* </style></script><script>alert(1)</script> */',
  'a { background: url("a\\\\b"); }',
  'b { content: "  "; }',
  '',
].join('\n');

const createPage = () => {
  const { window } = new JSDOM('<!doctype html><html><head></head></html>', {
    runScripts: 'outside-only',
  });
  const globalsBefore = new Set(Object.getOwnPropertyNames(window));
  /** Runs `script` as strict-mode code, so implicit globals throw. */
  const run = (script: string) => window.eval(`"use strict";${script}`);
  const newGlobals = () =>
    Object.getOwnPropertyNames(window).filter(
      (name) => !globalsBefore.has(name)
    );
  const styles = () =>
    Array.from(window.document.querySelectorAll('style'), (style) => ({
      tag: style.getAttribute('data-tag'),
      css: style.textContent,
    }));
  return { window, run, newGlobals, styles };
};

describe('buildStyleSheetScript', () => {
  it('upserts a style element in strict mode without creating globals', () => {
    const page = createPage();

    expect(page.run(buildStyleSheetScript(HOSTILE_CSS, 'custom-css'))).toBe(
      true
    );
    page.run(buildStyleSheetScript('p{}', 'other'));
    page.run(buildStyleSheetScript('a{}', 'custom-css'));

    expect(page.styles()).toEqual([
      { tag: 'custom-css', css: 'a{}' },
      { tag: 'other', css: 'p{}' },
    ]);
    expect(page.newGlobals()).toEqual([]);
  });

  it('keeps any character of the CSS and the tag intact', () => {
    const page = createPage();
    const tag = 'we"ird\'] tag';

    page.run(buildStyleSheetScript(HOSTILE_CSS, tag));
    page.run(buildStyleSheetScript(HOSTILE_CSS, tag));

    expect(page.styles()).toEqual([{ tag, css: HOSTILE_CSS }]);
    expect(page.window.document.querySelectorAll('script')).toHaveLength(0);
  });

  it('delegates to the web runtime when it has applyStyleSheet', () => {
    const page = createPage();
    const applyStyleSheet = jest.fn();
    Object.assign(page.window, { __tentap: { applyStyleSheet } });

    page.run(buildStyleSheetScript('p{}', 'theme'));

    expect(applyStyleSheet).toHaveBeenCalledWith('theme', 'p{}');
    expect(page.styles()).toEqual([]);
  });

  it('works on pages without a head element', () => {
    const { window } = new JSDOM('', { runScripts: 'outside-only' });
    window.document.head.remove();

    window.eval(`"use strict";${buildStyleSheetScript('p{}', 't')}`);

    expect(
      window.document.documentElement.querySelector('style')?.textContent
    ).toBe('p{}');
  });
});

describe('Injector', () => {
  it('re-applies stylesheets, then persistent scripts, in first-registration order', () => {
    const injector = new Injector();
    injector.setScript('a', 'a();');
    injector.setStyleSheet('one', '1{}');
    injector.setStyleSheet('two', '2{}');
    injector.setScript('b', 'b();');
    injector.setStyleSheet('one', '3{}');
    injector.setScript('a', 'a2();');

    expect(injector.scriptsForReady()).toEqual([
      buildStyleSheetScript('3{}', 'one'),
      buildStyleSheetScript('2{}', 'two'),
      'a2();',
      'b();',
    ]);

    injector.setScript('a', null);
    expect(injector.scriptsForReady()).toHaveLength(3);
  });

  it('returns the script that applies a new stylesheet', () => {
    expect(new Injector().setStyleSheet('t', 'p{}')).toBe(
      buildStyleSheetScript('p{}', 't')
    );
  });
});
