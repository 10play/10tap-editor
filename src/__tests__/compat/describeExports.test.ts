import { Extension } from '@tiptap/core';
import BridgeExtension from '../../bridges/base';
import {
  describeExports,
  findSnapshotIncompatibilities,
} from './describeExports';
import { findTypeExportIncompatibilities } from './typeExports';

enum Action {
  Toggle = 'toggle',
}

const Base = Extension.create({
  name: 'sample',
  addOptions: () => ({ enabled: false, level: 1 }),
});

const bridge = (options: Record<string, unknown> = {}, extension = Base) =>
  new BridgeExtension({ tiptapExtension: extension.configure(options) });

const baseline = describeExports({
  Action,
  hook: () => null,
  Kit: [bridge({ enabled: true })],
  theme: { toolbar: { color: 'red' } },
});

const incompatibilities = (current: Record<string, unknown>) =>
  findSnapshotIncompatibilities(baseline, describeExports(current));

describe('describeExports / findSnapshotIncompatibilities', () => {
  const compatible = {
    Action,
    hook: () => null,
    Kit: [bridge({ enabled: true, extra: 1 })],
    theme: { toolbar: { color: 'red', extra: 1 }, extra: {} },
    added: 1,
  };

  it('accepts additions', () => {
    expect(incompatibilities(compatible)).toEqual([]);
  });

  it('reports removed exports and members', () => {
    const { hook: _, ...withoutHook } = compatible;
    expect(incompatibilities({ ...withoutHook, theme: {} })).toEqual([
      'hook: missing',
      'theme.toolbar: missing',
    ]);
  });

  it('reports changed wire strings and constants', () => {
    expect(
      incompatibilities({
        ...compatible,
        Action: { Toggle: 'toggle-v2' },
        theme: { toolbar: { color: 'blue' } },
      })
    ).toEqual([
      'Action.Toggle: value was "toggle", now "toggle-v2"',
      'theme.toolbar.color: value was "red", now "blue"',
    ]);
  });

  it('reports changed kinds and reordered or resized arrays', () => {
    expect(incompatibilities({ ...compatible, hook: {}, Kit: [] })).toEqual([
      'Kit: length was 1, now 0',
      'hook: was function, now object',
    ]);
  });

  it('reports renamed bridges', () => {
    const Renamed = Base.extend({ name: 'renamed' });
    expect(
      incompatibilities({
        ...compatible,
        Kit: [bridge({ enabled: true }, Renamed)],
      })
    ).toEqual([
      'Kit[0]: name was sample, now renamed',
      'Kit[0].tiptapExtension[0]: was extension sample, now extension renamed',
    ]);
  });

  it('reports dropped preconfigured options', () => {
    expect(incompatibilities({ ...compatible, Kit: [bridge()] })).toEqual([
      'Kit[0].tiptapExtension[0]: options dropped or changed baseline values',
    ]);
  });
});

describe('findTypeExportIncompatibilities', () => {
  it('requires each side of a name to survive', () => {
    expect(
      findTypeExportIncompatibilities(
        { A: 'value+type', B: 'type', C: 'value', D: 'type' },
        { A: 'value', B: 'value+type', C: 'unresolved' }
      )
    ).toEqual(['A: no longer exported as a type', 'D: missing']);
  });
});
