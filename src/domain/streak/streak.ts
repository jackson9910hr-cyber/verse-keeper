/** Streak rules — docs/algorithms.md §6. */
import { addDays, diffDays, type LocalDate } from '../time/localDate';

export interface Streak {
  current: number;
  longest: number;
  studiedToday: boolean;
}

export function computeStreak(studyDays: readonly LocalDate[], today: LocalDate): Streak {
  const days = [...new Set(studyDays)].filter((d) => d <= today).sort();
  const set = new Set(days);

  let longest = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && diffDays(days[i]!, days[i - 1]!) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const studiedToday = set.has(today);
  const yesterday = addDays(today, -1);
  let anchor: LocalDate | null = studiedToday ? today : set.has(yesterday) ? yesterday : null;
  let current = 0;
  while (anchor !== null && set.has(anchor)) {
    current++;
    anchor = addDays(anchor, -1);
  }
  return { current, longest, studiedToday };
}
