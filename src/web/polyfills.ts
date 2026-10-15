/**
 * Array methods Tiptap uses that older Android System WebViews lack:
 * `findLast` and `findLastIndex` (Chrome 97) and `at` (Chrome 92). The
 * bundle's syntax targets ES2015, but built-ins are not transpiled, so
 * without them every transaction threw after applying, which dropped Enter
 * and the editor's update events on Android 10 devices whose WebView was
 * never updated. Only missing methods are added.
 */

type Predicate = (value: unknown, index: number, array: unknown[]) => unknown;

export function findLastIndex(
  this: unknown[],
  predicate: Predicate,
  thisArg?: unknown
): number {
  for (let i = this.length - 1; i >= 0; i--) {
    if (predicate.call(thisArg, this[i], i, this)) return i;
  }
  return -1;
}

export function findLast(
  this: unknown[],
  predicate: Predicate,
  thisArg?: unknown
): unknown {
  const index = findLastIndex.call(this, predicate, thisArg);
  return index === -1 ? undefined : this[index];
}

export function at(this: unknown[], index: number): unknown {
  const relative = Math.trunc(index) || 0;
  return this[relative < 0 ? this.length + relative : relative];
}

const define = (name: string, value: unknown) => {
  if (name in Array.prototype) return;
  Object.defineProperty(Array.prototype, name, {
    value,
    writable: true,
    configurable: true,
  });
};

export function installPolyfills(): void {
  define('findLast', findLast);
  define('findLastIndex', findLastIndex);
  define('at', at);
}
