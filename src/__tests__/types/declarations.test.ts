import path from 'path';
import ts from 'typescript';

/**
 * Emits the package's declarations in memory (as bob does with
 * tsconfig.build.json) and checks what the root entry's typings import.
 */

const root = path.resolve(__dirname, '../../..');

const emitDeclarations = (): Map<string, string> => {
  const configPath = path.join(root, 'tsconfig.build.json');
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, root);
  const program = ts.createProgram([path.join(root, 'src/index.tsx')], {
    ...options,
    noEmit: false,
    declaration: true,
    emitDeclarationOnly: true,
    outDir: path.join(root, 'decl'),
  });
  const files = new Map<string, string>();
  program.emit(undefined, (fileName, text) => files.set(fileName, text));
  return files;
};

const specifiersOf = (text: string): string[] =>
  ts
    .preProcessFile(text, true, true)
    .importedFiles.map(({ fileName }) => fileName);

/** Bare module specifiers reachable from the entry declaration file. */
const externalImports = (files: Map<string, string>, entry: string) => {
  const external = new Map<string, string>();
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const text = files.get(file);
    if (text === undefined) continue;
    for (const specifier of specifiersOf(text)) {
      if (!specifier.startsWith('.')) {
        external.set(specifier, path.relative(root, file));
        continue;
      }
      const base = path.resolve(path.dirname(file), specifier);
      queue.push(
        files.has(`${base}.d.ts`) ? `${base}.d.ts` : `${base}/index.d.ts`
      );
    }
  }
  return external;
};

describe('root declarations', () => {
  it('do not import React Native deep paths hidden by the strict API', () => {
    const files = emitDeclarations();
    const entry = path.join(root, 'decl/src/index.d.ts');
    expect(files.has(entry)).toBe(true);

    const deep = [...externalImports(files, entry)].filter(([specifier]) =>
      specifier.startsWith('react-native/')
    );
    expect(deep).toEqual([]);
  }, 120_000);
});
