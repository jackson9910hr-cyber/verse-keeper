/** Tiny runtime validators (no schema library → smaller bundle). A validator throws GuardError with the failing path. */
import { isValidLocalDate } from '../time/localDate';

export class GuardError extends Error {
  constructor(readonly path: string) {
    super(`Invalid field at ${path}`);
  }
}

export type Guard<T> = (value: unknown, path: string) => T;

const fail = (path: string): never => {
  throw new GuardError(path);
};

export const str =
  (maxLength = 10_000, minLength = 0): Guard<string> =>
  (v, p) =>
    typeof v === 'string' && v.length >= minLength && v.length <= maxLength ? v : fail(p);

export const int =
  (min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): Guard<number> =>
  (v, p) =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : fail(p);

export const bool: Guard<boolean> = (v, p) => (typeof v === 'boolean' ? v : fail(p));

export const localDate: Guard<string> = (v, p) =>
  typeof v === 'string' && isValidLocalDate(v) ? v : fail(p);

export const oneOf =
  <T extends string>(values: readonly T[]): Guard<T> =>
  (v, p) =>
    typeof v === 'string' && (values as readonly string[]).includes(v) ? (v as T) : fail(p);

export const nullable =
  <T>(guard: Guard<T>): Guard<T | null> =>
  (v, p) =>
    v === null ? null : guard(v, p);

export const arrayOf =
  <T>(guard: Guard<T>, maxLength = 100_000): Guard<T[]> =>
  (v, p) =>
    Array.isArray(v) && v.length <= maxLength
      ? v.map((item, i) => guard(item, `${p}[${i}]`))
      : fail(p);

export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const object =
  <T>(shape: { [K in keyof T]: Guard<T[K]> }): Guard<T> =>
  (v, p) => {
    if (!isObject(v)) return fail(p);
    const out = {} as T;
    for (const key of Object.keys(shape) as (keyof T & string)[]) {
      out[key] = shape[key](v[key], `${p}.${key}`);
    }
    return out;
  };
