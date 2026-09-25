import { weekStart, weekStartCarryOver } from '@/domain/family/week';
import type { FamilyCheck, FamilyWeekly, Verse } from '@/domain/model';
import { todayOf } from '@/domain/time/clock';
import type { LocalDate } from '@/domain/time/localDate';

import type { DataContext } from '../context';
import { emit } from '../events';
import { VERSE_SELECT, toFamilyCheck, toFamilyWeekly, toVerse, type VerseRow } from '../rows';
import { writeSetting } from '../settings';
import { ensureCardsTx } from './cards';

export async function listAssignments({ db }: DataContext): Promise<FamilyWeekly[]> {
  const rows = await db.all<{ week_start: string; verse_id: string; assigned_at: number }>(
    'SELECT * FROM family_weekly ORDER BY week_start DESC',
  );
  return rows.map(toFamilyWeekly);
}

/** Sets this week's family verse and makes sure every profile has cards for it (due today). */
export async function assignWeeklyVerse(
  ctx: DataContext,
  verseId: string,
  weekStartsOn: number,
): Promise<LocalDate> {
  const today = todayOf(ctx.clock);
  const now = ctx.clock.now();
  const key = weekStart(today, weekStartsOn);
  await ctx.db.tx(async (tx) => {
    const verse = await tx.getFirstAsync<{ text_ko: string | null; text_en: string | null }>(
      'SELECT text_ko, text_en FROM verses WHERE id = ?',
      [verseId],
    );
    if (!verse) throw new Error(`Verse not found: ${verseId}`);
    const existing = await tx.getFirstAsync<{ verse_id: string }>(
      'SELECT verse_id FROM family_weekly WHERE week_start = ?',
      [key],
    );
    if (existing && existing.verse_id !== verseId) {
      await tx.runAsync('DELETE FROM family_checks WHERE week_start = ?', [key]);
    }
    await tx.runAsync(
      `INSERT INTO family_weekly (week_start, verse_id, assigned_at) VALUES (?, ?, ?)
       ON CONFLICT(week_start) DO UPDATE SET verse_id = excluded.verse_id, assigned_at = excluded.assigned_at`,
      [key, verseId, now],
    );
    const langs = [verse.text_ko ? 'ko' : null, verse.text_en ? 'en' : null].filter(
      (l): l is 'ko' | 'en' => l !== null,
    );
    const profiles = await tx.getAllAsync<{ id: string }>('SELECT id FROM profiles', []);
    for (const p of profiles) await ensureCardsTx(tx, ctx, p.id, verseId, langs, today, now);
  });
  emit('family');
  emit('cards');
  return key;
}

export async function clearWeeklyVerse({ db }: DataContext, week: LocalDate): Promise<void> {
  await db.run('DELETE FROM family_weekly WHERE week_start = ?', [week]);
  emit('family');
}

export async function listChecks({ db }: DataContext, week: LocalDate): Promise<FamilyCheck[]> {
  const rows = await db.all<{ week_start: string; profile_id: string; checked_at: number }>(
    'SELECT * FROM family_checks WHERE week_start = ?',
    [week],
  );
  return rows.map(toFamilyCheck);
}

export async function toggleCheck(
  ctx: DataContext,
  week: LocalDate,
  profileId: string,
): Promise<boolean> {
  const checked = await ctx.db.tx(async (tx) => {
    const r = await tx.runAsync(
      'DELETE FROM family_checks WHERE week_start = ? AND profile_id = ?',
      [week, profileId],
    );
    if (r.changes > 0) return false;
    await tx.runAsync(
      'INSERT INTO family_checks (week_start, profile_id, checked_at) VALUES (?, ?, ?)',
      [week, profileId, ctx.clock.now()],
    );
    return true;
  });
  emit('family');
  return checked;
}

/** Changes the week-start setting, carrying this week's verse over to the new week key (algorithms.md §7). */
export async function changeWeekStart(
  ctx: DataContext,
  oldStart: number,
  newStart: number,
): Promise<void> {
  const assignments = await listAssignments(ctx);
  const carry = weekStartCarryOver(assignments, todayOf(ctx.clock), oldStart, newStart);
  await ctx.db.tx(async (tx) => {
    await writeSetting(tx, 'family.weekStartsOn', newStart);
    if (carry) {
      await tx.runAsync(
        'INSERT OR IGNORE INTO family_weekly (week_start, verse_id, assigned_at) VALUES (?, ?, ?)',
        [carry.weekStart, carry.verseId, ctx.clock.now()],
      );
    }
  });
  emit('settings');
  emit('family');
}

/** Assigned weekly verses (newest first) joined with their verse rows — avoids loading the whole library. */
export async function listAssignedVerses({
  db,
}: DataContext): Promise<{ weekStart: LocalDate; verse: Verse }[]> {
  const rows = await db.all<VerseRow & { week_start: string }>(
    `SELECT f.week_start, ${VERSE_SELECT} FROM family_weekly f JOIN verses v ON v.id = f.verse_id ORDER BY f.week_start DESC`,
  );
  return rows.map((r) => ({ weekStart: r.week_start, verse: toVerse(r) }));
}
