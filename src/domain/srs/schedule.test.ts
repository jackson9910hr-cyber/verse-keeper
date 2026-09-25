import {
  EF_FLOOR,
  MAX_INTERVAL,
  compareDue,
  initialState,
  isDue,
  previewIntervals,
  schedule,
  type Grade,
  type ReviewState,
} from './schedule';

const TODAY = '2026-09-25';
const st = (efMilli: number, reps: number, intervalDays: number, lapses = 0): ReviewState => ({
  efMilli,
  reps,
  intervalDays,
  lapses,
  dueDate: TODAY,
  lastReviewedOn: null,
});

// docs/algorithms.md §1.6 — keep in sync.
const VECTORS: [string, ReviewState, Grade, [number, number, number, number]][] = [
  ['T1', st(2500, 0, 0), 'good', [2500, 1, 1, 0]],
  ['T2', st(2500, 1, 1), 'good', [2500, 2, 6, 0]],
  ['T3', st(2500, 2, 6), 'good', [2500, 3, 15, 0]],
  ['T4', st(2500, 3, 15), 'good', [2500, 4, 38, 0]],
  ['T5', st(2500, 0, 0), 'easy', [2600, 1, 3, 0]],
  ['T6', st(2500, 0, 0), 'hard', [2360, 1, 1, 0]],
  ['T7', st(2500, 0, 0), 'again', [2180, 0, 1, 1]],
  ['T8', st(1400, 5, 40), 'again', [1300, 0, 1, 1]],
  ['T9', st(1300, 3, 3), 'hard', [1300, 4, 4, 0]],
  ['T10', st(1300, 3, 3), 'good', [1300, 4, 4, 0]],
  ['T11', st(1300, 3, 3), 'easy', [1400, 4, 5, 0]],
  ['T12', st(2500, 5, 200), 'good', [2500, 6, 365, 0]],
  ['T13', st(2500, 2, 6), 'hard', [2360, 3, 7, 0]],
  ['T14', st(2500, 1, 1), 'easy', [2600, 2, 8, 0]],
  ['T15', st(2500, 1, 1), 'again', [2180, 0, 1, 1]],
];

describe('schedule — spec test vectors', () => {
  it.each(VECTORS)('%s', (_id, before, grade, [ef, reps, interval, lapses]) => {
    const after = schedule(before, grade, TODAY);
    expect(after).toMatchObject({ efMilli: ef, reps, intervalDays: interval, lapses });
  });
});

describe('schedule — rules', () => {
  it('initialState is due today with EF 2.5', () => {
    expect(initialState(TODAY)).toEqual({
      efMilli: 2500,
      reps: 0,
      intervalDays: 0,
      lapses: 0,
      dueDate: TODAY,
      lastReviewedOn: null,
    });
  });

  it('sets dueDate = today + interval and lastReviewedOn = today', () => {
    const after = schedule(st(2500, 2, 6), 'good', TODAY);
    expect(after.dueDate).toBe('2026-10-10');
    expect(after.lastReviewedOn).toBe(TODAY);
  });

  it('does not mutate the input', () => {
    const before = st(2500, 2, 6);
    const copy = { ...before };
    schedule(before, 'easy', TODAY);
    expect(before).toEqual(copy);
  });

  it('five consecutive failures keep EF at the floor and count lapses', () => {
    let s = initialState(TODAY);
    for (let i = 0; i < 5; i++) s = schedule(s, 'again', TODAY);
    expect(s.efMilli).toBe(EF_FLOOR);
    expect(s.lapses).toBe(5);
    expect(s.reps).toBe(0);
    expect(s.intervalDays).toBe(1);
  });

  it('never exceeds MAX_INTERVAL even for easy', () => {
    const after = schedule(st(3000, 10, 300), 'easy', TODAY);
    expect(after.intervalDays).toBe(MAX_INTERVAL);
    expect(after.dueDate).toBe('2027-09-25');
  });

  it('interval ordering: hard <= good < easy for every state', () => {
    for (const ef of [1300, 1700, 2500, 3100]) {
      for (const reps of [0, 1, 2, 3, 6]) {
        for (const interval of [0, 1, 3, 6, 20, 120]) {
          const p = previewIntervals(st(ef, reps, interval));
          expect(p.hard).toBeLessThanOrEqual(p.good);
          if (p.good < MAX_INTERVAL) expect(p.easy).toBeGreaterThan(p.good);
          expect(p.again).toBe(1);
        }
      }
    }
  });

  it('same-day again then good (in-session relearn) schedules for tomorrow', () => {
    const failed = schedule(st(2500, 4, 30), 'again', TODAY);
    const relearned = schedule(failed, 'good', TODAY);
    expect(relearned).toMatchObject({ reps: 1, intervalDays: 1, dueDate: '2026-09-26' });
  });

  it('overdue reviews use the stored interval (no late bonus)', () => {
    const overdue = { ...st(2500, 2, 6), dueDate: '2026-09-01' };
    expect(schedule(overdue, 'good', TODAY).intervalDays).toBe(15);
  });
});

describe('isDue / compareDue', () => {
  it('is due on or before today, not after', () => {
    expect(isDue({ dueDate: '2026-09-25', suspended: false }, TODAY)).toBe(true);
    expect(isDue({ dueDate: '2026-09-01', suspended: false }, TODAY)).toBe(true);
    expect(isDue({ dueDate: '2026-09-26', suspended: false }, TODAY)).toBe(false);
    expect(isDue({ dueDate: '2026-09-01', suspended: true }, TODAY)).toBe(false);
  });

  it('orders by dueDate, then lapses desc, then verseId, then lang', () => {
    const cards = [
      { dueDate: '2026-09-25', lapses: 0, verseId: 'b', lang: 'en' as const },
      { dueDate: '2026-09-20', lapses: 0, verseId: 'z', lang: 'en' as const },
      { dueDate: '2026-09-25', lapses: 3, verseId: 'c', lang: 'en' as const },
      { dueDate: '2026-09-25', lapses: 0, verseId: 'b', lang: 'ko' as const },
      { dueDate: '2026-09-25', lapses: 0, verseId: 'a', lang: 'ko' as const },
    ];
    const sorted = [...cards].sort(compareDue).map((c) => `${c.verseId}${c.lang}`);
    expect(sorted).toEqual(['zen', 'cen', 'ako', 'ben', 'bko']);
  });
});
