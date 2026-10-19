import path from 'path';
import { describe, expect, it } from 'vitest';
import * as web from '../../../webEditorUtils';
import {
  describeExports,
  findSnapshotIncompatibilities,
  type ExportsSnapshot,
} from '../../../__tests__/compat/describeExports';
import {
  findTypeExportIncompatibilities,
  listTypeExports,
  readCompilerOptions,
  type TypeExportsSnapshot,
} from '../../../__tests__/compat/typeExports';
import v101Web from '../../../../test/fixtures/api/v1.0.1-web.json';

/** `@10play/tentap-editor/web` must stay a superset of what 1.0.1 exported. */

const webDir = path.resolve(__dirname, '../../../webEditorUtils');

describe('./web entry compatibility with 1.0.1', () => {
  it('keeps every runtime export, bridge and constant', () => {
    const current = describeExports(web);

    expect(
      findSnapshotIncompatibilities(v101Web.runtime as ExportsSnapshot, current)
    ).toEqual([]);
  });

  it('keeps every type export', () => {
    const current = listTypeExports(
      path.join(webDir, 'index.ts'),
      readCompilerOptions(path.join(webDir, 'tsconfig.json'))
    );

    expect(
      findTypeExportIncompatibilities(
        v101Web.types as TypeExportsSnapshot,
        current
      )
    ).toEqual([]);
  }, 60_000);
});
