export type Subscription<T> = (cb: (val: T) => void) => () => void;
