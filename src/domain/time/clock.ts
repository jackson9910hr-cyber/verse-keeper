import { type LocalDate, toLocalDate } from './localDate';

/** Injected time source. The only real implementation lives in src/platform/clock.ts. */
export interface Clock {
  now(): number;
  /** UTC offset (minutes, east positive) in effect at the given instant. */
  tzOffsetMinutes(at: number): number;
}

export function todayOf(clock: Clock): LocalDate {
  const now = clock.now();
  return toLocalDate(now, clock.tzOffsetMinutes(now));
}

export class FixedClock implements Clock {
  constructor(
    private instant: number,
    private offsetMinutes = 0,
  ) {}
  now(): number {
    return this.instant;
  }
  tzOffsetMinutes(): number {
    return this.offsetMinutes;
  }
  set(instant: number): void {
    this.instant = instant;
  }
  advance(ms: number): void {
    this.instant += ms;
  }
  setOffset(offsetMinutes: number): void {
    this.offsetMinutes = offsetMinutes;
  }
}

export interface OffsetTransition {
  from: number;
  offsetMinutes: number;
}

/** Clock with a table of UTC-offset transitions (e.g. DST), sorted ascending by `from`. */
export class TableClock implements Clock {
  private readonly table: OffsetTransition[];
  constructor(
    private readonly instant: number,
    table: OffsetTransition[],
  ) {
    if (table.length === 0) throw new Error('TableClock needs at least one transition');
    this.table = [...table].sort((a, b) => a.from - b.from);
  }
  now(): number {
    return this.instant;
  }
  tzOffsetMinutes(at: number): number {
    let offset = this.table[0]!.offsetMinutes;
    for (const t of this.table) if (t.from <= at) offset = t.offsetMinutes;
    return offset;
  }
}
