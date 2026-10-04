import path from 'path';
import {
  ROOT_DESCRIBE_OPTIONS,
  describeExports,
  findIncompatibilities,
  findSnapshotIncompatibilities,
  type ExportsSnapshot,
  type Shape,
} from './compat/describeExports';
import {
  findTypeExportIncompatibilities,
  listTypeExports,
  readCompilerOptions,
  type TypeExportsSnapshot,
} from './compat/typeExports';
import v101Root from '../../test/fixtures/api/v1.0.1-root.json';
import v074Keyboard from '../../test/fixtures/api/v0.7.4-keyboard.json';
import packageJson from '../../package.json';

// TODO(WP-F): drop once the focus tracker no longer touches the DOM at import time (#339).
jest.mock('../webEditorUtils/focusListener', () => ({
  focusListener: { isFocused: false },
}));

/**
 * The root entry ('.') must stay a superset of 1.0.1 and, once the keyboard
 * is restored, of the 0.7.x keyboard API (test/fixtures/api, generated from
 * the released commits by test/fixtures/api/generate.js).
 */

const repo = path.resolve(__dirname, '../..');

const currentRuntime = (): ExportsSnapshot =>
  describeExports(require('../index'), ROOT_DESCRIBE_OPTIONS);

let typeExports: TypeExportsSnapshot | undefined;
const currentTypes = (): TypeExportsSnapshot => {
  typeExports ??= listTypeExports(
    path.join(repo, 'src/index.tsx'),
    readCompilerOptions(path.join(repo, 'tsconfig.json'))
  );
  return typeExports;
};

const TYPE_TIMEOUT = 60_000;

const keyboardRuntime = v074Keyboard.runtime as ExportsSnapshot;
const KEYBOARD_EXPORTS = [
  'CustomKeyboard',
  'ColorKeyboard',
  'CustomKeyboardExtension',
  'TenTapView',
] as const;

describe('root entry compatibility with 1.0.1', () => {
  it('keeps every runtime export, bridge, enum and constant', () => {
    expect(
      findSnapshotIncompatibilities(
        v101Root.runtime as ExportsSnapshot,
        currentRuntime()
      )
    ).toEqual([]);
  });

  it(
    'keeps every type export (values, interfaces and type aliases)',
    () => {
      expect(
        findTypeExportIncompatibilities(
          v101Root.types as TypeExportsSnapshot,
          currentTypes()
        )
      ).toEqual([]);
    },
    TYPE_TIMEOUT
  );

  it('keeps BridgeState and EditorBridge augmentable interfaces', () => {
    expect(currentTypes()).toMatchObject({
      BridgeState: 'type',
      EditorBridge: 'type',
    });
  });

  it('keeps the package entry points and export conditions', () => {
    const { main, module, types, source, exports } = packageJson;
    const current = {
      main,
      module,
      types,
      'react-native': packageJson['react-native'],
      source,
      exports,
    };

    expect(current).toMatchObject(v101Root.manifest);
  });
});

// Pending: the keyboard API is restored by WP-M/WP-T and exported by WP-Z.
// Enable at the WP-L gate.
describe('root entry compatibility with the 0.7.x keyboard API', () => {
  it.skip('exports the keyboard components again', () => {
    const current = currentRuntime();

    expect(
      KEYBOARD_EXPORTS.flatMap((name) =>
        findIncompatibilities(
          keyboardRuntime[name] as Shape,
          current[name],
          name
        )
      )
    ).toEqual([]);
  });

  it.skip('restores the colorKeyboard theme defaults', () => {
    const current = currentRuntime();
    const themeMember = (snapshot: ExportsSnapshot, theme: string) =>
      (snapshot[theme] as Extract<Shape, { type: 'object' }>).members
        ?.colorKeyboard;

    expect(
      ['defaultEditorTheme', 'darkEditorTheme'].flatMap((theme) =>
        findIncompatibilities(
          themeMember(keyboardRuntime, theme) as Shape,
          themeMember(current, theme),
          `${theme}.colorKeyboard`
        )
      )
    ).toEqual([]);
  });

  it.skip(
    'restores every 0.7.x type export',
    () => {
      expect(
        findTypeExportIncompatibilities(
          v074Keyboard.types as TypeExportsSnapshot,
          currentTypes()
        )
      ).toEqual([]);
    },
    TYPE_TIMEOUT
  );
});
