import { afterEach, describe, expect, it } from 'vitest';
import { at, findLast, findLastIndex, installPolyfills } from '../polyfills';

describe('polyfills', () => {
  const native = Array.prototype.findLast;

  afterEach(() => {
    Object.defineProperty(Array.prototype, 'findLast', {
      value: native,
      writable: true,
      configurable: true,
    });
  });

  it('finds from the end', () => {
    const list = [1, 2, 3, 4];
    const odd = (n: unknown) => Number(n) % 2 === 1;
    const large = (n: unknown) => Number(n) > 9;
    expect(findLast.call(list, odd)).toBe(3);
    expect(findLastIndex.call(list, odd)).toBe(2);
    expect(findLast.call(list, large)).toBeUndefined();
    expect(findLastIndex.call(list, large)).toBe(-1);
  });

  it('reads relative indexes', () => {
    const list = ['a', 'b', 'c'];
    expect(at.call(list, -1)).toBe('c');
    expect(at.call(list, 0)).toBe('a');
    expect(at.call(list, 1.7)).toBe('b');
    expect(at.call(list, 3)).toBeUndefined();
  });

  it('adds only missing methods, without making them enumerable', () => {
    // @ts-expect-error: simulating a WebView older than Chrome 97.
    delete Array.prototype.findLast;
    installPolyfills();
    expect([1, 2, 3].findLast((n) => n < 3)).toBe(2);
    expect(Object.keys(Array.prototype)).not.toContain('findLast');

    const current = Array.prototype.at;
    installPolyfills();
    expect(Array.prototype.at).toBe(current);
  });
});
