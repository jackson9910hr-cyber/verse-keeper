import { currentFamilyVerse, weekStart, weekStartCarryOver } from './week';

describe('weekStart', () => {
  it('defaults to Monday-start weeks', () => {
    expect(weekStart('2026-09-25', 1)).toBe('2026-09-21'); // Friday -> Monday
    expect(weekStart('2026-09-21', 1)).toBe('2026-09-21'); // Monday itself
    expect(weekStart('2026-09-27', 1)).toBe('2026-09-21'); // Sunday belongs to the previous Monday
  });
  it('supports Sunday-start weeks', () => {
    expect(weekStart('2026-09-27', 0)).toBe('2026-09-27');
    expect(weekStart('2026-09-26', 0)).toBe('2026-09-20');
  });
  it('crosses year boundaries', () => {
    expect(weekStart('2027-01-01', 1)).toBe('2026-12-28');
  });
  it('rejects invalid week-start days', () => {
    expect(() => weekStart('2026-09-25', 7)).toThrow();
  });
});

describe('currentFamilyVerse', () => {
  const assignments = [
    { weekStart: '2026-09-14', verseId: 'old' },
    { weekStart: '2026-09-21', verseId: 'current' },
  ];
  it('finds the verse for the current week', () => {
    expect(currentFamilyVerse(assignments, '2026-09-25', 1)).toBe('current');
  });
  it('returns null when the week has no assignment', () => {
    expect(currentFamilyVerse(assignments, '2026-09-29', 1)).toBeNull();
  });
});

describe('weekStartCarryOver', () => {
  const assignments = [{ weekStart: '2026-09-21', verseId: 'v1' }];
  it('copies this week’s verse to the new key when the setting changes', () => {
    expect(weekStartCarryOver(assignments, '2026-09-25', 1, 0)).toEqual({
      weekStart: '2026-09-20',
      verseId: 'v1',
    });
  });
  it('does nothing if the new key already has an assignment or the old one is empty', () => {
    expect(
      weekStartCarryOver(
        [...assignments, { weekStart: '2026-09-20', verseId: 'v2' }],
        '2026-09-25',
        1,
        0,
      ),
    ).toBeNull();
    expect(weekStartCarryOver([], '2026-09-25', 1, 0)).toBeNull();
    expect(weekStartCarryOver(assignments, '2026-09-25', 1, 1)).toBeNull();
  });
});
