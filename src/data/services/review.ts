import type { Card, LogKind, PracticeMode } from '@/domain/model';
import { isDue, schedule, type Grade } from '@/domain/srs/schedule';
import { computeStreak, type Streak } from '@/domain/streak/streak';
import { todayOf } from '@/domain/time/clock';
import { addDays } from '@/domain/time/localDate';

import type { DataContext } from '../context';
import { emit } from '../events';
import { toCard, type CardRow } from '../rows';

export class CardNotFoundError extends Error {}

export interface GradeInput {
  cardId: string;
  grade: Grade;
  mode: PracticeMode;
  /** Second pass of a card graded "again" earlier in the same session — reschedules even though it is no longer due. */
  relearn?: boolean;
}

export interface GradeResult {
  card: Card;
  kind: LogKind;
}

/**
 * Records one grade atomically: updates the schedule when the card is due (or relearning),
 * otherwise logs extra practice without touching the schedule (docs/algorithms.md §1.4).
 */
export async function gradeCard(ctx: DataContext, input: GradeInput): Promise<GradeResult> {
  const now = ctx.clock.now();
  const today = todayOf(ctx.clock);
  const result = await ctx.db.tx(async (tx) => {
    const row = await tx.getFirstAsync<CardRow>('SELECT * FROM cards WHERE id = ?', [input.cardId]);
    if (!row) throw new CardNotFoundError(input.cardId);
    const card = toCard(row);
    const scheduled = input.relearn === true || isDue(card, today);
    const next: Card = scheduled ? { ...card, ...schedule(card, input.grade, today) } : card;
    if (scheduled) {
      await tx.runAsync(
        'UPDATE cards SET ef_milli = ?, reps = ?, interval_days = ?, due_date = ?, lapses = ?, last_reviewed_on = ? WHERE id = ?',
        [
          next.efMilli,
          next.reps,
          next.intervalDays,
          next.dueDate,
          next.lapses,
          next.lastReviewedOn,
          card.id,
        ],
      );
    }
    const kind: LogKind = scheduled ? 'review' : 'practice';
    await tx.runAsync(
      `INSERT INTO review_logs (card_id, profile_id, grade, mode, kind, reviewed_at, local_date, prev_interval, new_interval, prev_ef_milli, new_ef_milli)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card.id,
        card.profileId,
        input.grade,
        input.mode,
        kind,
        now,
        today,
        card.intervalDays,
        next.intervalDays,
        card.efMilli,
        next.efMilli,
      ],
    );
    return { card: next, kind };
  });
  emit('reviews');
  return result;
}

/** Streak for a profile; looks back 400 days (enough for the displayed "longest" in practice). */
export async function streakFor(ctx: DataContext, profileId: string): Promise<Streak> {
  const today = todayOf(ctx.clock);
  const rows = await ctx.db.all<{ local_date: string }>(
    'SELECT DISTINCT local_date FROM review_logs WHERE profile_id = ? AND local_date >= ? ORDER BY local_date DESC',
    [profileId, addDays(today, -400)],
  );
  return computeStreak(
    rows.map((r) => r.local_date),
    today,
  );
}
