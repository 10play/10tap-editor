import ts from 'typescript';

/** What an exported name provides to importers. */
export type ExportKind = 'value' | 'type' | 'value+type' | 'unresolved';

export type TypeExportsSnapshot = Record<string, ExportKind>;

const kindOf = (checker: ts.TypeChecker, symbol: ts.Symbol): ExportKind => {
  const target =
    symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  if (!target.declarations?.length) return 'unresolved';
  const value = (target.flags & ts.SymbolFlags.Value) !== 0;
  const type = (target.flags & ts.SymbolFlags.Type) !== 0;
  if (value && type) return 'value+type';
  if (value) return 'value';
  if (type) return 'type';
  return 'unresolved';
};

/**
 * Lists the names a module exports and whether each is a value, a type or
 * both, as seen by TypeScript. Diagnostics are ignored: only the export table
 * of `entryFile` matters.
 */
export const listTypeExports = (
  entryFile: string,
  compilerOptions: ts.CompilerOptions
): TypeExportsSnapshot => {
  const program = ts.createProgram([entryFile], {
    ...compilerOptions,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entryFile);
  const moduleSymbol = source && checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error(`${entryFile} is not a module`);

  const snapshot: TypeExportsSnapshot = {};
  for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
    snapshot[symbol.name] = kindOf(checker, symbol);
  }
  return Object.fromEntries(
    Object.entries(snapshot).sort(([a], [b]) => a.localeCompare(b))
  );
};

/** Compiler options of a tsconfig file, resolved relative to its directory. */
export const readCompilerOptions = (
  tsconfigPath: string
): ts.CompilerOptions => {
  const { config, error } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (error) {
    throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  }
  const directory = tsconfigPath.replace(/[/\\][^/\\]+$/, '');
  return ts.parseJsonConfigFileContent(config, ts.sys, directory).options;
};

const provides = (kind: ExportKind, needed: 'value' | 'type') =>
  kind === 'value+type' || kind === needed;

/**
 * Names whose value or type side disappeared between `baseline` and
 * `current`. An unresolved current export (e.g. the generated editorHtml
 * before `yarn editor:build`) only has to exist.
 */
export const findTypeExportIncompatibilities = (
  baseline: TypeExportsSnapshot,
  current: TypeExportsSnapshot
): string[] =>
  Object.entries(baseline).flatMap(([name, kind]) => {
    const now = current[name];
    if (!now) return [`${name}: missing`];
    if (now === 'unresolved' || kind === 'unresolved') return [];
    const lost = (['value', 'type'] as const).filter(
      (side) => provides(kind, side) && !provides(now, side)
    );
    return lost.map((side) => `${name}: no longer exported as a ${side}`);
  });
