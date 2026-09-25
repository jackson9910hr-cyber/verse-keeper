import type { Card, Lang, Verse } from '@/domain/model';
import { EF_INITIAL } from '@/domain/srs/schedule';
import { todayOf } from '@/domain/time/clock';
import type { LocalDate } from '@/domain/time/localDate';

import type { DataContext } from '../context';
import type { SqlExecutor } from '../db/types';
import { emit } from '../events';
import { VERSE_SELECT, toCard, toVerse, type CardRow, type VerseRow } from '../rows';

export interface CardWithVerse {
  card: Card;
  verse: Verse;
}

export const availableLangs = (v: Pick<Verse, 'textKo' | 'textEn'>): Lang[] =>
  [v.textKo ? 'ko' : null, v.textEn ? 'en' : null].filter((l): l is Lang => l !== null);

/** Creates missing cards (due today) for the given languages; existing cards are untouched. Returns created count. */
export async function ensureCardsTx(
  tx: SqlExecutor,
  ctx: Pick<DataContext, 'newId'>,
  profileId: string,
  verseId: string,
  langs: readonly Lang[],
  today: LocalDate,
  now: number,
): Promise<number> {
  let created = 0;
  for (const lang of langs) {
    const r = await tx.runAsync(
      `INSERT OR IGNORE INTO cards (id, profile_id, verse_id, lang, ef_milli, reps, interval_days, due_date, lapses, cloze_level, suspended, created_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, ?, 0, 1, 0, ?)`,
      [ctx.newId(), profileId, verseId, lang, EF_INITIAL, today, now],
    );
    created += r.changes;
  }
  return created;
}

export async function startLearning(
  ctx: DataContext,
  profileId: string,
  verse: Verse,
  langs = availableLangs(verse),
): Promise<number> {
  const created = await ctx.db.tx((tx) =>
    ensureCardsTx(tx, ctx, profileId, verse.id, langs, todayOf(ctx.clock), ctx.clock.now()),
  );
  emit('cards');
  return created;
}

export async function cardsForVerse(
  { db }: DataContext,
  profileId: string,
  verseId: string,
): Promise<Card[]> {
  const rows = await db.all<CardRow>(
    'SELECT * FROM cards WHERE profile_id = ? AND verse_id = ? ORDER BY lang',
    [profileId, verseId],
  );
  return rows.map(toCard);
}

export async function getCardWithVerse(
  { db }: DataContext,
  cardId: string,
): Promise<CardWithVerse | null> {
  const card = await db.first<CardRow>('SELECT * FROM cards WHERE id = ?', [cardId]);
  if (!card) return null;
  const verse = await db.first<VerseRow>(`SELECT ${VERSE_SELECT} FROM verses v WHERE v.id = ?`, [
    card.verse_id,
  ]);
  return verse ? { card: toCard(card), verse: toVerse(verse) } : null;
}

export async function dueCount(
  { db }: DataContext,
  profileId: string,
  today: LocalDate,
): Promise<number> {
  const row = await db.first<{ n: number }>(
    'SELECT COUNT(*) AS n FROM cards WHERE profile_id = ? AND suspended = 0 AND due_date <= ?',
    [profileId, today],
  );
  return row?.n ?? 0;
}

export async function learningCount({ db }: DataContext, profileId: string): Promise<number> {
  const row = await db.first<{ n: number }>(
    'SELECT COUNT(*) AS n FROM cards WHERE profile_id = ?',
    [profileId],
  );
  return row?.n ?? 0;
}

/** Review queue in the order of docs/algorithms.md §1.7. */
export async function dueQueue(
  ctx: DataContext,
  profileId: string,
  today: LocalDate,
  limit: number,
): Promise<CardWithVerse[]> {
  const cards = await ctx.db.all<CardRow>(
    `SELECT * FROM cards WHERE profile_id = ? AND suspended = 0 AND due_date <= ?
     ORDER BY due_date, lapses DESC, verse_id, lang LIMIT ?`,
    [profileId, today, limit],
  );
  if (cards.length === 0) return [];
  const ids = [...new Set(cards.map((c) => c.verse_id))];
  const verses = await ctx.db.all<VerseRow>(
    `SELECT ${VERSE_SELECT} FROM verses v WHERE v.id IN (${ids.map(() => '?').join(',')})`,
    ids,
  );
  const byId = new Map(verses.map((v) => [v.id, toVerse(v)]));
  return cards.map((c) => ({ card: toCard(c), verse: byId.get(c.verse_id)! }));
}

export async function setClozeLevel(
  { db }: DataContext,
  cardId: string,
  level: number,
): Promise<void> {
  await db.run('UPDATE cards SET cloze_level = ? WHERE id = ?', [
    Math.min(5, Math.max(1, Math.round(level))),
    cardId,
  ]);
  emit('cards');
}

export async function setSuspended(
  { db }: DataContext,
  cardId: string,
  suspended: boolean,
): Promise<void> {
  await db.run('UPDATE cards SET suspended = ? WHERE id = ?', [suspended ? 1 : 0, cardId]);
  emit('cards');
}

/** Removes a card and its history (stop learning this language). */
export async function deleteCard({ db }: DataContext, cardId: string): Promise<void> {
  await db.run('DELETE FROM cards WHERE id = ?', [cardId]);
  emit('cards');
}
