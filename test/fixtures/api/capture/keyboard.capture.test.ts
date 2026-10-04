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

// The keyboard era used tiptap v2, so the package root cannot be loaded with
// today's dependencies. Its export table comes from TypeScript; the runtime
// shape is captured for the keyboard modules and the themes, which load
// without tiptap.
it('captures the keyboard-era surface', () => {
  const root = captureRoot();
  const load = (file: string) => require(path.join(root, 'src', file));
  const snapshot = {
    runtime: describeExports(
      {
        ...load('RichText/Keyboard/CustomKeyboardBase'),
        ...load('RichText/Keyboard/ColorKeyboard'),
        ...load('RichText/Keyboard/CustomKeyboardExtension'),
        TenTapView: load('TenTapViewNativeComponent').default,
        ...load('RichText/theme'),
      },
      ROOT_DESCRIBE_OPTIONS
    ),
    types: listTypeExports(
      path.join(root, 'src/index.tsx'),
      readCompilerOptions(path.join(root, 'tsconfig.json'))
    ),
  };
  expect(Object.keys(snapshot.runtime)).not.toHaveLength(0);
  writeSnapshot(snapshot);
});
