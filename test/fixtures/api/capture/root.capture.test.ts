import path from 'path';
import {
  ROOT_DESCRIBE_OPTIONS,
  describeExports,
} from '../../../../src/__tests__/compat/describeExports';
import {
  listTypeExports,
  readCompilerOptions,
} from '../../../../src/__tests__/compat/typeExports';
import { captureRoot, writeSnapshot } from './env';

it('captures the root entry', () => {
  const root = captureRoot();
  const entry = path.join(root, 'src/index.tsx');
  const snapshot = {
    runtime: describeExports(require(entry), ROOT_DESCRIBE_OPTIONS),
    types: listTypeExports(
      entry,
      readCompilerOptions(path.join(root, 'tsconfig.json'))
    ),
  };
  expect(Object.keys(snapshot.runtime)).not.toHaveLength(0);
  writeSnapshot(snapshot);
});
