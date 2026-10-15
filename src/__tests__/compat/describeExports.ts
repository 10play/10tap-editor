/**
 * Serialisable description of a module's runtime exports, used to compare the
 * current public surface against snapshots taken from released versions
 * (test/fixtures/api/*.json). Dependency-free, so the same code describes
 * old checkouts (test/fixtures/api/generate.js) and the current tree under
 * both jest and vitest.
 */

export type Json =
  string | number | boolean | null | Json[] | { [key: string]: Json };

export type Shape =
  | { type: 'function' }
  | { type: 'undefined' }
  | { type: 'null' }
  | { type: 'string'; value?: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'symbol' | 'bigint' }
  | { type: 'array'; items: Shape[] }
  | { type: 'object'; members?: Record<string, Shape> }
  | TiptapExtensionShape
  | BridgeShape;

export interface TiptapExtensionShape {
  type: 'tiptapExtension';
  name: string;
  kind: string;
  options: Json;
}

export interface BridgeShape {
  type: 'bridge';
  name: string;
  tiptapExtension: TiptapExtensionShape[];
  tiptapExtensionDeps: TiptapExtensionShape[];
  hasCSS: boolean;
  config?: Json;
  extendConfig?: Json;
}

export type ExportsSnapshot = Record<string, Shape>;

export interface DescribeOptions {
  /** Exports recorded by type only (e.g. generated or mocked values). */
  opaque?: string[];
  /** Exports whose members are recorded by type only (e.g. asset maps). */
  shallow?: string[];
}

/** How the root entry ('.') is described: the HTML is generated, the PNGs are mocked. */
export const ROOT_DESCRIBE_OPTIONS: DescribeOptions = {
  opaque: ['editorHtml'],
  shallow: ['Images'],
};

const MAX_DEPTH = 4;
const MAX_STRING_VALUE = 200;
const FUNCTION_PLACEHOLDER = '[function]';

type Bridge = {
  name: string;
  tiptapExtension?: unknown;
  tiptapExtensionDeps?: unknown[];
  extendCSS?: unknown;
  config?: unknown;
  extendConfig?: unknown;
  configureTiptapExtensionsOnRunTime: unknown;
};

const isBridge = (value: object): value is Bridge =>
  typeof (value as Partial<Bridge>).configureTiptapExtensionsOnRunTime ===
    'function' && typeof (value as Partial<Bridge>).name === 'string';

type TiptapExtension = {
  name: string;
  type: string;
  options: unknown;
  configure: unknown;
};

const isTiptapExtension = (value: object): value is TiptapExtension => {
  const candidate = value as Partial<TiptapExtension>;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.configure === 'function' &&
    ['extension', 'node', 'mark'].includes(candidate.type ?? '')
  );
};

const describeTiptapExtension = (
  extension: TiptapExtension
): TiptapExtensionShape => ({
  type: 'tiptapExtension',
  name: extension.name,
  kind: extension.type,
  options: toJson(extension.options) ?? null,
});

const describeExtensions = (extension: unknown): TiptapExtensionShape[] => {
  if (extension == null || typeof extension !== 'object') return [];
  if (Array.isArray(extension)) return extension.flatMap(describeExtensions);
  return isTiptapExtension(extension)
    ? [describeTiptapExtension(extension)]
    : [];
};

/** Own and inherited (non-Object.prototype) keys, so class instances expose their methods. */
const memberKeys = (value: object): string[] => {
  const keys = new Set<string>();
  let current: object | null = value;
  while (current && current !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(current)) {
      if (key !== 'constructor' && !key.startsWith('__')) keys.add(key);
    }
    current = Object.getPrototypeOf(current);
  }
  return [...keys].sort();
};

const toJson = (value: unknown, depth = 0): Json | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'function') return FUNCTION_PLACEHOLDER;
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (typeof value !== 'object' || depth >= MAX_DEPTH) return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => toJson(item, depth + 1) ?? null);
  }
  const result: Record<string, Json> = {};
  for (const key of Object.keys(value).sort()) {
    const json = toJson((value as Record<string, unknown>)[key], depth + 1);
    if (json !== undefined) result[key] = json;
  }
  return result;
};

const describeBridge = (bridge: Bridge): BridgeShape => {
  const shape: BridgeShape = {
    type: 'bridge',
    name: bridge.name,
    tiptapExtension: describeExtensions(bridge.tiptapExtension),
    tiptapExtensionDeps: describeExtensions(bridge.tiptapExtensionDeps),
    hasCSS: typeof bridge.extendCSS === 'string' && bridge.extendCSS !== '',
  };
  const config = toJson(bridge.config);
  const extendConfig = toJson(bridge.extendConfig);
  if (config !== undefined) shape.config = config;
  if (extendConfig !== undefined) shape.extendConfig = extendConfig;
  return shape;
};

export const describeValue = (
  value: unknown,
  depth = 0,
  shallow = false
): Shape => {
  if (value === null) return { type: 'null' };
  switch (typeof value) {
    case 'undefined':
    case 'function':
    case 'symbol':
    case 'bigint':
      return { type: typeof value } as Shape;
    case 'string':
      return !shallow && value.length <= MAX_STRING_VALUE
        ? { type: 'string', value }
        : { type: 'string' };
    case 'number':
      return { type: 'number', value };
    case 'boolean':
      return { type: 'boolean', value };
  }
  const object = value as object;
  // forwardRef/memo components are objects; they are interchangeable with
  // function components for anyone rendering them.
  if (typeof (object as { $$typeof?: unknown }).$$typeof === 'symbol') {
    return { type: 'function' };
  }
  if (isBridge(object)) return describeBridge(object);
  if (isTiptapExtension(object)) return describeTiptapExtension(object);
  if (Array.isArray(object)) {
    return {
      type: 'array',
      items: object.map((item) => describeValue(item, depth + 1, shallow)),
    };
  }
  if (depth >= MAX_DEPTH) return { type: 'object' };
  const members: Record<string, Shape> = {};
  for (const key of memberKeys(object)) {
    const member = (object as Record<string, unknown>)[key];
    members[key] = shallow
      ? ({ type: member === null ? 'null' : typeof member } as Shape)
      : describeValue(member, depth + 1);
  }
  return { type: 'object', members };
};

export const describeExports = (
  moduleExports: Record<string, unknown>,
  { opaque = [], shallow = [] }: DescribeOptions = {}
): ExportsSnapshot => {
  const snapshot: ExportsSnapshot = {};
  for (const name of Object.keys(moduleExports).sort()) {
    if (name === '__esModule') continue;
    const value = moduleExports[name];
    snapshot[name] = opaque.includes(name)
      ? ({ type: value === null ? 'null' : typeof value } as Shape)
      : describeValue(value, 0, shallow.includes(name));
  }
  return snapshot;
};

const isJsonSubset = (expected: Json, actual: Json | undefined): boolean => {
  if (expected === null || typeof expected !== 'object') {
    return expected === actual;
  }
  if (actual === null || typeof actual !== 'object') return false;
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      expected.length === actual.length &&
      expected.every((item, index) => isJsonSubset(item, actual[index]))
    );
  }
  if (Array.isArray(actual)) return false;
  return Object.entries(expected).every(([key, item]) =>
    isJsonSubset(item, actual[key])
  );
};

/**
 * Lists every way `current` fails to be a backwards-compatible superset of
 * `baseline`: missing members, changed kinds, changed constant values,
 * reordered arrays and changed bridge identity/configuration. Extra members
 * and extra bridge config keys are allowed.
 */
export const findIncompatibilities = (
  baseline: Shape,
  current: Shape | undefined,
  path: string
): string[] => {
  if (!current) return [`${path}: missing`];
  if (baseline.type !== current.type) {
    return [`${path}: was ${baseline.type}, now ${current.type}`];
  }
  switch (baseline.type) {
    case 'string':
    case 'number':
    case 'boolean': {
      const { value } = current as typeof baseline;
      return baseline.value === undefined || baseline.value === value
        ? []
        : [
            `${path}: value was ${JSON.stringify(baseline.value)}, now ${JSON.stringify(value)}`,
          ];
    }
    case 'array': {
      const { items } = current as typeof baseline;
      if (items.length !== baseline.items.length) {
        return [
          `${path}: length was ${baseline.items.length}, now ${items.length}`,
        ];
      }
      return baseline.items.flatMap((item, index) =>
        findIncompatibilities(item, items[index], `${path}[${index}]`)
      );
    }
    case 'object': {
      const { members = {} } = current as typeof baseline;
      return Object.entries(baseline.members ?? {}).flatMap(([key, member]) =>
        findIncompatibilities(member, members[key], `${path}.${key}`)
      );
    }
    case 'tiptapExtension': {
      const extension = current as TiptapExtensionShape;
      const problems: string[] = [];
      if (
        extension.name !== baseline.name ||
        extension.kind !== baseline.kind
      ) {
        problems.push(
          `${path}: was ${baseline.kind} ${baseline.name}, now ${extension.kind} ${extension.name}`
        );
      }
      if (!isJsonSubset(baseline.options, extension.options)) {
        problems.push(`${path}: options dropped or changed baseline values`);
      }
      return problems;
    }
    case 'bridge': {
      const bridge = current as BridgeShape;
      const problems: string[] = [];
      if (bridge.name !== baseline.name) {
        problems.push(`${path}: name was ${baseline.name}, now ${bridge.name}`);
      }
      if (baseline.hasCSS !== bridge.hasCSS) {
        problems.push(`${path}: extendCSS presence changed`);
      }
      for (const key of ['config', 'extendConfig'] as const) {
        const expected = baseline[key];
        if (expected !== undefined && !isJsonSubset(expected, bridge[key])) {
          problems.push(`${path}: ${key} dropped or changed baseline values`);
        }
      }
      for (const key of ['tiptapExtension', 'tiptapExtensionDeps'] as const) {
        problems.push(
          ...findIncompatibilities(
            { type: 'array', items: baseline[key] },
            { type: 'array', items: bridge[key] },
            `${path}.${key}`
          )
        );
      }
      return problems;
    }
    default:
      return [];
  }
};

export const findSnapshotIncompatibilities = (
  baseline: ExportsSnapshot,
  current: ExportsSnapshot
): string[] =>
  Object.entries(baseline).flatMap(([name, shape]) =>
    findIncompatibilities(shape, current[name], name)
  );
