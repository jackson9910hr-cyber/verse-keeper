/** Weekly family verse — docs/algorithms.md §7. */
import { addDays, dayOfWeek, type LocalDate } from '../time/localDate';

export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const DEFAULT_WEEK_START: WeekStartDay = 1;

export interface WeeklyAssignment {
  weekStart: LocalDate;
  verseId: string;
}

export function weekStart(date: LocalDate, weekStartsOn: number): LocalDate {
  if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6) {
    throw new Error(`Invalid week start day: ${weekStartsOn}`);
  }
  return addDays(date, -((dayOfWeek(date) - weekStartsOn + 7) % 7));
}

export function currentFamilyVerse(
  assignments: readonly WeeklyAssignment[],
  today: LocalDate,
  weekStartsOn: number,
): string | null {
  const key = weekStart(today, weekStartsOn);
  return assignments.find((a) => a.weekStart === key)?.verseId ?? null;
}

/**
 * When the week-start setting changes, carry this week's verse over to the new week key
 * (only if the new key is empty). Returns the assignment to insert, or null.
 */
export function weekStartCarryOver(
  assignments: readonly WeeklyAssignment[],
  today: LocalDate,
  oldStart: number,
  newStart: number,
): WeeklyAssignment | null {
  if (oldStart === newStart) return null;
  const verseId = currentFamilyVerse(assignments, today, oldStart);
  if (verseId === null || currentFamilyVerse(assignments, today, newStart) !== null) return null;
  return { weekStart: weekStart(today, newStart), verseId };
}
