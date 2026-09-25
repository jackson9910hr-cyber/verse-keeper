import {
  addDays,
  compareLocalDate,
  dayOfWeek,
  diffDays,
  isValidLocalDate,
  parseLocalDate,
  toLocalDate,
} from './localDate';

const HOUR = 3_600_000;

describe('toLocalDate', () => {
  it('converts UTC midnight with zero offset', () => {
    expect(toLocalDate(Date.UTC(2026, 8, 25), 0)).toBe('2026-09-25');
  });

  it('KST (+540): 23:59:59.999 local stays on the same day', () => {
    // 2026-09-25 23:59:59.999 KST == 2026-09-25 14:59:59.999 UTC
    expect(toLocalDate(Date.UTC(2026, 8, 25, 14, 59, 59, 999), 540)).toBe('2026-09-25');
  });

  it('KST (+540): 00:00 local moves to the next day', () => {
    expect(toLocalDate(Date.UTC(2026, 8, 25, 15, 0, 0, 0), 540)).toBe('2026-09-26');
  });

  it('negative offsets (New York EDT -240)', () => {
    // 2026-07-01 03:00 UTC == 2026-06-30 23:00 EDT
    expect(toLocalDate(Date.UTC(2026, 6, 1, 3), -240)).toBe('2026-06-30');
  });

  it('handles dates before the epoch', () => {
    expect(toLocalDate(Date.UTC(1969, 11, 31, 23), 0)).toBe('1969-12-31');
    expect(toLocalDate(-1, 0)).toBe('1969-12-31');
  });

  it('half-hour offsets (India +330)', () => {
    expect(toLocalDate(Date.UTC(2026, 0, 1, 18, 29), 330)).toBe('2026-01-01');
    expect(toLocalDate(Date.UTC(2026, 0, 1, 18, 30), 330)).toBe('2026-01-02');
  });

  it('a whole local day maps to one date even across a DST change', () => {
    // New York DST start 2026-03-08: 02:00 EST(-300) -> 03:00 EDT(-240); that day has 23 hours.
    const startOfDayUtc = Date.UTC(2026, 2, 8, 5); // 00:00 EST
    expect(toLocalDate(startOfDayUtc, -300)).toBe('2026-03-08');
    expect(toLocalDate(startOfDayUtc + 22 * HOUR + HOUR - 1, -240)).toBe('2026-03-08'); // 23:59:59 EDT
    expect(toLocalDate(startOfDayUtc + 23 * HOUR, -240)).toBe('2026-03-09');
  });
});

describe('addDays / diffDays', () => {
  it('adds within a month', () => expect(addDays('2026-09-25', 6)).toBe('2026-10-01'));
  it('handles leap day 2028', () => expect(addDays('2028-02-28', 1)).toBe('2028-02-29'));
  it('handles non-leap 2027', () => expect(addDays('2027-02-28', 1)).toBe('2027-03-01'));
  it('handles century non-leap 2100', () => expect(addDays('2100-02-28', 1)).toBe('2100-03-01'));
  it('handles 400-year leap 2000', () => expect(addDays('2000-02-28', 1)).toBe('2000-02-29'));
  it('crosses year end', () => expect(addDays('2026-12-31', 1)).toBe('2027-01-01'));
  it('subtracts', () => expect(addDays('2026-01-01', -1)).toBe('2025-12-31'));
  it('adds 365 days', () => expect(addDays('2026-09-25', 365)).toBe('2027-09-25'));
  it('diffDays is the inverse of addDays', () => {
    expect(diffDays('2028-03-01', '2028-02-28')).toBe(2);
    expect(diffDays('2026-09-25', '2026-09-25')).toBe(0);
    expect(diffDays('2026-09-24', '2026-09-25')).toBe(-1);
  });
});

describe('dayOfWeek', () => {
  it('returns 0 for Sunday and 1 for Monday', () => {
    expect(dayOfWeek('2026-09-27')).toBe(0);
    expect(dayOfWeek('2026-09-28')).toBe(1);
    expect(dayOfWeek('2026-09-25')).toBe(5);
    expect(dayOfWeek('1970-01-01')).toBe(4);
  });
});

describe('parse / validate / compare', () => {
  it('validates real calendar dates only', () => {
    expect(isValidLocalDate('2028-02-29')).toBe(true);
    expect(isValidLocalDate('2027-02-29')).toBe(false);
    expect(isValidLocalDate('2026-13-01')).toBe(false);
    expect(isValidLocalDate('2026-9-1')).toBe(false);
    expect(isValidLocalDate('')).toBe(false);
  });
  it('parse throws on invalid input', () => {
    expect(() => parseLocalDate('nope')).toThrow('Invalid LocalDate');
    expect(parseLocalDate('2026-09-25')).toEqual({ year: 2026, month: 9, day: 25 });
  });
  it('compares lexicographically', () => {
    expect(compareLocalDate('2026-09-25', '2026-10-01')).toBeLessThan(0);
    expect(compareLocalDate('2026-10-01', '2026-09-25')).toBeGreaterThan(0);
    expect(compareLocalDate('2026-10-01', '2026-10-01')).toBe(0);
  });
});
