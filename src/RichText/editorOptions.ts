import { useSyncExternalStore } from 'react';
import type { Unsubscribe } from '../shared/contracts';

/**
 * Versions the options of the latest `useEditorBridge` render. The editor
 * keeps its identity across renders, so components that render from its
 * option fields (`theme`, `dynamicHeight`, …) subscribe to stay current
 * under a `React.memo` parent.
 */
export interface EditorOptionsStore {
  getVersion(): number;
  subscribe(listener: () => void): Unsubscribe;
}

const OPTIONS_STORE: unique symbol = Symbol.for(
  '@10play/tentap-editor/options'
);

const NO_STORE: EditorOptionsStore = {
  getVersion: () => 0,
  subscribe: () => () => {},
};

/** Enumerable, so a spread copy of the editor keeps it. */
export function attachEditorOptionsStore(
  editor: object,
  store: EditorOptionsStore
): void {
  Object.defineProperty(editor, OPTIONS_STORE, {
    value: store,
    configurable: true,
    enumerable: true,
    writable: false,
  });
}

/** Re-renders when the editor's options change. */
export function useEditorOptions(editor: object): void {
  const store =
    (editor as { [OPTIONS_STORE]?: EditorOptionsStore })[OPTIONS_STORE] ??
    NO_STORE;
  useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);
}

/** Callbacks are read when called, so only other values affect rendering. */
export function sameRenderedOptions(a: object, b: object): boolean {
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    const x = left[key];
    const y = right[key];
    if (x === y) continue;
    if (typeof x === 'function' && typeof y === 'function') continue;
    return false;
  }
  return true;
}
