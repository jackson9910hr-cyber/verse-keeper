import { computeStreak } from './streak';

const T = '2026-09-25';

describe('computeStreak', () => {
  it('is zero with no study days', () => {
    expect(computeStreak([], T)).toEqual({ current: 0, longest: 0, studiedToday: false });
  });
  it('counts today only', () => {
    expect(computeStreak([T], T)).toEqual({ current: 1, longest: 1, studiedToday: true });
  });
  it('keeps the streak alive through yesterday when today is not done yet', () => {
    expect(computeStreak(['2026-09-23', '2026-09-24'], T)).toEqual({
      current: 2,
      longest: 2,
      studiedToday: false,
    });
  });
  it('breaks when the last study day was two days ago', () => {
    expect(computeStreak(['2026-09-22', '2026-09-23'], T).current).toBe(0);
  });
  it('ignores duplicates and ordering', () => {
    expect(computeStreak([T, '2026-09-24', T, '2026-09-23', '2026-09-24'], T).current).toBe(3);
  });
  it('ignores future dates (clock set back)', () => {
    expect(computeStreak(['2026-09-26', '2026-09-27', T], T)).toEqual({
      current: 1,
      longest: 1,
      studiedToday: true,
    });
  });
  it('tracks the longest run separately from the current run', () => {
    const days = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-09-24', T];
    expect(computeStreak(days, T)).toEqual({ current: 2, longest: 4, studiedToday: true });
  });
  it('crosses month, year and leap-day boundaries', () => {
    expect(computeStreak(['2027-12-31', '2028-01-01'], '2028-01-01').current).toBe(2);
    expect(computeStreak(['2028-02-28', '2028-02-29', '2028-03-01'], '2028-03-01').current).toBe(3);
  });
});
