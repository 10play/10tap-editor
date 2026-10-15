import fs from 'fs';
import path from 'path';
import { getWebViewVersion } from '../webViewVersion';
import { getWebViewVersion as getWebViewVersionOnWeb } from '../webViewVersion.web';

const srcDir = path.resolve(__dirname, '../..');

const sourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return ['__tests__', 'build'].includes(entry.name)
        ? []
        : sourceFiles(file);
    }
    return /\.tsx?$/.test(entry.name) ? [file] : [];
  });

describe('getWebViewVersion', () => {
  it('reads the installed react-native-webview version on native', () => {
    expect(getWebViewVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('does not look up a package.json on web', () => {
    expect(getWebViewVersionOnWeb()).toBeUndefined();
  });

  it('keeps the package.json require out of every module a web bundle loads', () => {
    // Web shims aliased to react-native-webview don't export their
    // package.json, so webpack warns about any module that requires it.
    const requiring = sourceFiles(srcDir)
      .filter((file) =>
        fs
          .readFileSync(file, 'utf8')
          .includes("require('react-native-webview/package.json')")
      )
      .map((file) => path.relative(srcDir, file));

    expect(requiring).toEqual([path.join('RichText', 'webViewVersion.ts')]);
  });
});
