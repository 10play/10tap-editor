import { createEmitter, createStore, shallowEqual } from '../stores';

describe('createEmitter', () => {
  it('lets listeners unsubscribe while being notified', () => {
    const emitter = createEmitter<number>();
    const calls: string[] = [];
    const unsubscribeA = emitter.subscribe(() => {
      calls.push('a');
      unsubscribeA();
    });
    emitter.subscribe(() => calls.push('b'));

    emitter.emit(1);
    emitter.emit(2);

    expect(calls).toEqual(['a', 'b', 'b']);
  });
});

describe('createStore', () => {
  it('notifies only on change', () => {
    const store = createStore(1);
    const listener = jest.fn();
    store.subscribe(listener);

    expect(store.set(1)).toBe(false);
    expect(store.set(2)).toBe(true);

    expect(store.get()).toBe(2);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(2);
  });

  it('keeps the previous snapshot when an equal value is set', () => {
    const first = { a: 1 };
    const store = createStore(first, shallowEqual);
    store.set({ a: 1 });
    expect(store.get()).toBe(first);
  });
});

describe('shallowEqual', () => {
  it('compares own keys with Object.is', () => {
    const nested = { x: 1 };
    expect(shallowEqual({ a: 1, b: nested }, { b: nested, a: 1 })).toBe(true);
    expect(shallowEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(shallowEqual({ a: { x: 1 } }, { a: { x: 1 } })).toBe(false);
    expect(shallowEqual({ a: NaN }, { a: NaN })).toBe(true);
  });
});
