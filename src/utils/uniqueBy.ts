// Unique by, last wins
export function uniqueBy<T, K extends keyof T>(
  items: T[],
  keyOrFn: K | ((item: T) => any)
): T[] {
  const keyFn =
    typeof keyOrFn === 'function' ? keyOrFn : (item: T) => item[keyOrFn];
  const seen = new Map<any, T>();
  items.forEach((item) => {
    const key = keyFn(item);
    seen.set(key, item);
  });
  return Array.from(seen.values());
}
