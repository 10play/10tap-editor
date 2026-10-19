import type { Listener, Unsubscribe } from '../shared/contracts';

/**
 * Minimal external stores shaped for `useSyncExternalStore`: `get` returns a
 * stable snapshot and listeners fire only when the snapshot changes.
 */

export interface Emitter<T> {
  emit(value: T): void;
  subscribe(listener: Listener<T>): Unsubscribe;
}

export function createEmitter<T = void>(): Emitter<T> {
  const listeners = new Set<Listener<T>>();
  return {
    emit(value) {
      // Snapshot, so listeners may unsubscribe while being notified.
      for (const listener of Array.from(listeners)) listener(value);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export interface Store<T> {
  get(): T;
  /** Returns whether the value changed (and listeners were notified). */
  set(value: T): boolean;
  subscribe(listener: Listener<T>): Unsubscribe;
}

export function createStore<T>(
  initial: T,
  isEqual: (a: T, b: T) => boolean = Object.is
): Store<T> {
  let current = initial;
  const emitter = createEmitter<T>();
  return {
    get: () => current,
    set(value) {
      if (isEqual(current, value)) return false;
      current = value;
      emitter.emit(value);
      return true;
    },
    subscribe: emitter.subscribe,
  };
}

/** Same own enumerable keys with `Object.is`-equal values. */
export function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  const keysA = Object.keys(a) as (keyof T)[];
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) && Object.is(a[key], b[key])
  );
}
