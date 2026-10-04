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
