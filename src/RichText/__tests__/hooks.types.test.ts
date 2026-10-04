import path from 'path';
import ts from 'typescript';

const fixture = path.resolve(
  __dirname,
  '../../../test/fixtures/node10-deep-import/tsconfig.json'
);

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (fileName) => fileName,
  getCurrentDirectory: () => path.dirname(fixture),
  getNewLine: () => '\n',
};

describe('deep imports of src/ (#290)', () => {
  it('type-check under node10 resolution without importing the bridges', () => {
    const { config } = ts.readConfigFile(fixture, ts.sys.readFile);
    const { options, fileNames, errors } = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      path.dirname(fixture)
    );
    const program = ts.createProgram(fileNames, options);
    const diagnostics = [...errors, ...ts.getPreEmitDiagnostics(program)];

    expect(
      diagnostics.map((d) => ts.formatDiagnostic(d, formatHost).trim())
    ).toEqual([]);
  }, 120_000);
});
