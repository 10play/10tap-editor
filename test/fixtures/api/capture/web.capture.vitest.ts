import path from 'path';
import { expect, it } from 'vitest';
import { describeExports } from '../../../../src/__tests__/compat/describeExports';
import {
  listTypeExports,
  readCompilerOptions,
} from '../../../../src/__tests__/compat/typeExports';
import { captureRoot, writeSnapshot } from './env';

it('captures the ./web entry', async () => {
  const root = captureRoot();
  const entry = path.join(root, 'src/webEditorUtils/index.ts');
  const snapshot = {
    runtime: describeExports(await import(entry)),
    types: listTypeExports(
      entry,
      readCompilerOptions(path.join(root, 'src/webEditorUtils/tsconfig.json'))
    ),
  };
  expect(Object.keys(snapshot.runtime)).not.toHaveLength(0);
  writeSnapshot(snapshot);
});
