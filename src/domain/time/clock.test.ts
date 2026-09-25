import { FixedClock, TableClock, todayOf } from './clock';

describe('Clock', () => {
  it('FixedClock returns a fixed instant and offset', () => {
    const clock = new FixedClock(Date.UTC(2026, 8, 25, 14, 59), 540);
    expect(clock.now()).toBe(Date.UTC(2026, 8, 25, 14, 59));
    expect(todayOf(clock)).toBe('2026-09-25');
    clock.set(Date.UTC(2026, 8, 25, 15, 0));
    expect(todayOf(clock)).toBe('2026-09-26');
    clock.advance(24 * 3_600_000);
    expect(todayOf(clock)).toBe('2026-09-27');
  });

  it('FixedClock can simulate a time zone change', () => {
    const clock = new FixedClock(Date.UTC(2026, 8, 25, 3), 540); // 12:00 KST
    expect(todayOf(clock)).toBe('2026-09-25');
    clock.setOffset(-240); // now in New York: 23:00 on the 24th
    expect(todayOf(clock)).toBe('2026-09-24');
  });

  it('TableClock picks the offset in effect at an instant (New York DST)', () => {
    const dstStart = Date.UTC(2026, 2, 8, 7); // 02:00 EST == 07:00 UTC
    const clock = new TableClock(dstStart - 1, [
      { from: Number.NEGATIVE_INFINITY, offsetMinutes: -300 },
      { from: dstStart, offsetMinutes: -240 },
    ]);
    expect(clock.tzOffsetMinutes(dstStart - 1)).toBe(-300);
    expect(clock.tzOffsetMinutes(dstStart)).toBe(-240);
    expect(todayOf(clock)).toBe('2026-03-08');
  });

  it('TableClock requires at least one entry', () => {
    expect(() => new TableClock(0, [])).toThrow();
  });
});
