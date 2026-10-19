import path from 'path';
import ts from 'typescript';

/**
 * Compiles the type-level compat fixtures in test/fixtures (the equivalent of
 * `tsc -p test/fixtures/<name>`). Each fixture is code written against an
 * older release that must keep compiling unchanged.
 */

const fixturesDir = path.resolve(__dirname, '../../../test/fixtures');

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (fileName) => fileName,
  getCurrentDirectory: () => fixturesDir,
  getNewLine: () => '\n',
};

const compileFixture = (name: string): string[] => {
  const configPath = path.join(fixturesDir, name, 'tsconfig.json');
  const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
  if (error) throw new Error(ts.formatDiagnostic(error, formatHost));
  const { options, fileNames, errors } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.dirname(configPath)
  );
  const program = ts.createProgram(fileNames, options);
  return [...errors, ...ts.getPreEmitDiagnostics(program)].map((diagnostic) =>
    ts.formatDiagnostic(diagnostic, formatHost).trim()
  );
};

const TIMEOUT = 120_000;

describe('type compat fixtures', () => {
  it(
    'types-1.0.1: 1.0.1 hooks, EditorBridge, bridges, themes and toolbar',
    () => {
      expect(compileFixture('types-1.0.1')).toEqual([]);
    },
    TIMEOUT
  );

  it(
    'advanced-template: the documented custom web bundle against ./web',
    () => {
      expect(compileFixture('advanced-template')).toEqual([]);
    },
    TIMEOUT
  );

  it(
    'keyboard-07x-compat: the 0.7.x WithKeyboard / custom keyboard call sites',
    () => {
      expect(compileFixture('keyboard-07x-compat')).toEqual([]);
    },
    TIMEOUT
  );

  it(
    'node10-deep-import: deep imports of src/ under node10 resolution (#290)',
    () => {
      expect(compileFixture('node10-deep-import')).toEqual([]);
    },
    TIMEOUT
  );
});
