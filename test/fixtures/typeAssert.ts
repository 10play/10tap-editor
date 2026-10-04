/**
 * tsd-style assertions for the type fixtures in this directory, checked by
 * `tsc -p <fixture>` (see src/__tests__/types/typeFixtures.test.ts). The
 * fixtures are compiled, never run.
 */

/** True when A and B are the same type (no `any` widening either way). */
export type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

/** `expectType<string>()(value)` fails to compile unless `value` is exactly a string. */
export const expectType =
  <Expected>() =>
  <Actual>(
    _value: Actual,
    ..._exact: Equals<Actual, Expected> extends true ? [] : [mismatch: never]
  ): void => {};

/** Fails to compile unless `value` is assignable to T. */
export const expectAssignable = <T>(value: T): T => value;
