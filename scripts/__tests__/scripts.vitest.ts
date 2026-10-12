// @vitest-environment node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');

const runScript = (script: string, args: string[]) =>
  spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], {
    cwd: root,
    encoding: 'utf8',
  });

describe('check-codegen', () => {
  it('accepts the TenTapKeyboard spec', () => {
    const result = runScript('check-codegen.js', []);
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('rejects a spec that drifts from the native contract', () => {
    const result = runScript('check-codegen.js', [
      '--spec',
      'test/fixtures/brokenSpec.ts',
    ]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('showSystemKeyboard: expected');
    expect(result.stderr).toContain('missing method setWindowOverlayMode');
    expect(result.stderr).toContain('unexpected method extraMethod');
  });
});

describe('buildEditor', () => {
  it('wraps the html in a module with a declaration file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tentap-build-editor-'));
    const htmlPath = path.join(dir, 'index.html');
    fs.writeFileSync(htmlPath, '<html>"quoted"</html>');

    const result = runScript('buildEditor.js', [htmlPath]);

    expect(result.status).toBe(0);
    expect(fs.readFileSync(path.join(dir, 'editorHtml.js'), 'utf8')).toContain(
      'export const editorHtml = "<html>\\"quoted\\"</html>";'
    );
    expect(fs.readFileSync(path.join(dir, 'editorHtml.d.ts'), 'utf8')).toBe(
      'export declare const editorHtml: string;\n'
    );
    fs.rmSync(dir, { recursive: true });
  });

  it('exits with an error for a missing html file', () => {
    const result = runScript('buildEditor.js', ['does/not/exist.html']);
    expect(result.status).toBe(1);
  });
});

describe('generate-llms', () => {
  const llms = require('../generate-llms.js');

  it('links every sidebar page with a description', () => {
    const index: string = llms.generate()['llms.txt'];
    const links = index.match(/^- \[.+\]\(https:\/\/\S+\/docs\/\S+\): .+$/gm);
    expect(index.startsWith('# 10tap-editor\n\n> ')).toBe(true);
    expect(links).toContain(
      '- [FAQ](https://10play.github.io/10tap-editor/docs/faq): ' +
        'Answers to common questions about content, formatting commands, ' +
        'ScrollViews, fonts, the toolbar, the caret, Expo Go and read-only mode.'
    );
  });

  it('turns MDX into plain markdown with absolute links', () => {
    const site = 'https://example.com/base/';
    const doc = {
      file: path.join(root, 'website/docs/api/Page.md'),
      url: `${site}docs/api/Page`,
      body: [
        "import Tabs from '@theme/Tabs';",
        '',
        '# Page',
        '',
        ':::tip Heads up',
        'See [the FAQ](../faq.md#top) and [below](#more).',
        ':::',
        '',
        '<div style={{display: "flex"}}>',
        '  <img src="/base/img/demo.gif"/>',
        '</div>',
        '<TabItem value="metro" label="Metro">',
        '`boolean`<br />Is it on <br /> added by <u>Core</u> `<RichText />`',
        '<a href="https://x.dev/plans">See plans</a>',
        '```tsx',
        'import { RichText } from "@10play/tentap-editor";',
        '<RichText editor={editor} />',
        '```',
      ].join('\n'),
    };

    expect(llms.cleanBody(doc, new Map(), site)).toBe(
      [
        '# Page',
        '',
        '> **Tip: Heads up**',
        `> See [the FAQ](${site}docs/faq#top) and [below](${site}docs/api/Page#more).`,
        '',
        '**Metro**',
        '',
        '`boolean`',
        'Is it on',
        'added by Core `<RichText />`',
        '[See plans](https://x.dev/plans)',
        '```tsx',
        'import { RichText } from "@10play/tentap-editor";',
        '<RichText editor={editor} />',
        '```',
      ].join('\n')
    );
  });
});
