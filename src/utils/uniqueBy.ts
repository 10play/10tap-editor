/** Drops items whose key was already seen; the last one wins, in first-seen position. */
export function uniqueBy<T, K extends keyof T>(
  items: T[],
  keyOrFn: K | ((item: T) => unknown)
): T[] {
  const keyFn =
    typeof keyOrFn === 'function' ? keyOrFn : (item: T) => item[keyOrFn];
  const seen = new Map<unknown, T>();
  items.forEach((item) => {
    seen.set(keyFn(item), item);
  });
  return Array.from(seen.values());
}
