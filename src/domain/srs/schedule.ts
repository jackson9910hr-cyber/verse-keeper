/**
 * SM-2 variant — see docs/algorithms.md §1. Pure: no clock access, integer EF (× 1000).
 */
import { addDays, compareLocalDate, type LocalDate } from '../time/localDate';

export type Grade = 'again' | 'hard' | 'good' | 'easy';
export const GRADES: readonly Grade[] = ['again', 'hard', 'good', 'easy'];

export interface ReviewState {
  efMilli: number;
  reps: number;
  intervalDays: number;
  dueDate: LocalDate;
  lapses: number;
  lastReviewedOn: LocalDate | null;
}

export const EF_INITIAL = 2500;
export const EF_FLOOR = 1300;
export const MAX_INTERVAL = 365;

/** SM-2 quality score for each button. */
export const GRADE_Q: Record<Grade, number> = { again: 2, hard: 3, good: 4, easy: 5 };

/** ΔEF × 1000 = 100 − (5−q)(80 + (5−q)·20) */
export function efDeltaMilli(q: number): number {
  const d = 5 - q;
  return 100 - d * (80 + d * 20);
}

export function initialState(today: LocalDate): ReviewState {
  return {
    efMilli: EF_INITIAL,
    reps: 0,
    intervalDays: 0,
    dueDate: today,
    lapses: 0,
    lastReviewedOn: null,
  };
}

const clampInterval = (n: number) => Math.min(MAX_INTERVAL, Math.max(1, n));

interface Computed {
  efMilli: number;
  reps: number;
  intervalDays: number;
  lapses: number;
}

function compute(state: ReviewState, grade: Grade): Computed {
  const efMilli = Math.max(EF_FLOOR, state.efMilli + efDeltaMilli(GRADE_Q[grade]));
  if (grade === 'again') {
    return { efMilli, reps: 0, intervalDays: 1, lapses: state.lapses + 1 };
  }
  const reps = state.reps + 1;
  const i = state.intervalDays;
  let hard: number;
  let good: number;
  let easy: number;
  if (reps === 1) {
    [hard, good, easy] = [1, 1, 3];
  } else if (reps === 2) {
    [hard, good, easy] = [3, 6, 8];
  } else {
    hard = Math.max(i + 1, Math.round((i * 12) / 10));
    good = Math.round((i * efMilli) / 1000);
    easy = Math.round((i * efMilli * 13) / 10_000);
  }
  good = Math.max(good, hard);
  easy = Math.max(easy, good + 1);
  const chosen = grade === 'hard' ? hard : grade === 'good' ? good : easy;
  return { efMilli, reps, intervalDays: clampInterval(chosen), lapses: state.lapses };
}

export function schedule(state: ReviewState, grade: Grade, today: LocalDate): ReviewState {
  const next = compute(state, grade);
  return { ...next, dueDate: addDays(today, next.intervalDays), lastReviewedOn: today };
}

/** Next interval for each button — shown under the grade bar. */
export function previewIntervals(state: ReviewState): Record<Grade, number> {
  return {
    again: compute(state, 'again').intervalDays,
    hard: compute(state, 'hard').intervalDays,
    good: compute(state, 'good').intervalDays,
    easy: compute(state, 'easy').intervalDays,
  };
}

export function isDue(card: { dueDate: LocalDate; suspended: boolean }, today: LocalDate): boolean {
  return !card.suspended && compareLocalDate(card.dueDate, today) <= 0;
}

export interface DueSortable {
  dueDate: LocalDate;
  lapses: number;
  verseId: string;
  lang: 'ko' | 'en';
}

/** Review-queue order: oldest due first, then most lapses, then verse id, then language. */
export function compareDue(a: DueSortable, b: DueSortable): number {
  return (
    compareLocalDate(a.dueDate, b.dueDate) ||
    b.lapses - a.lapses ||
    (a.verseId < b.verseId ? -1 : a.verseId > b.verseId ? 1 : 0) ||
    (a.lang < b.lang ? -1 : a.lang > b.lang ? 1 : 0)
  );
}
