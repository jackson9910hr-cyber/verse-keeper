import { canonKey } from '@/domain/bible/books';
import type { Verse } from '@/domain/model';
import type { ValidVerse } from '@/domain/verse/verseInput';
import { formatReference } from '@/i18n/books';

import type { DataContext } from '../context';
import type { SqlExecutor } from '../db/types';
import { emit } from '../events';
import { VERSE_SELECT, toVerse, type VerseRow } from '../rows';

export type VerseFilter = 'all' | 'user' | 'pack';
export type VerseSort = 'canon' | 'recent';

export interface VerseQuery {
  filter?: VerseFilter;
  sort?: VerseSort;
  search?: string;
  tag?: string;
}

export function buildSearchText(
  v: Pick<Verse, 'book' | 'chapter' | 'verseStart' | 'verseEnd' | 'textKo' | 'textEn' | 'tags'>,
): string {
  return [
    formatReference(v, 'ko'),
    formatReference(v, 'en'),
    v.book,
    v.textKo ?? '',
    v.textEn ?? '',
    ...v.tags,
  ]
    .join('\n')
    .normalize('NFC')
    .toLowerCase();
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function listVerses({ db }: DataContext, q: VerseQuery = {}): Promise<Verse[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (q.filter && q.filter !== 'all') {
    where.push('v.source = ?');
    params.push(q.filter);
  }
  const search = q.search?.normalize('NFC').trim().toLowerCase();
  if (search) {
    where.push("v.search_text LIKE ? ESCAPE '\\'");
    params.push(`%${escapeLike(search)}%`);
  }
  if (q.tag) {
    where.push(
      'EXISTS (SELECT 1 FROM verse_tags vt JOIN tags t ON t.id = vt.tag_id WHERE vt.verse_id = v.id AND t.name = ?)',
    );
    params.push(q.tag);
  }
  const order =
    q.sort === 'recent'
      ? 'v.created_at DESC, v.canon_key'
      : 'v.canon_key, v.verse_end, v.created_at';
  const sql = `SELECT ${VERSE_SELECT} FROM verses v ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order}`;
  return (await db.all<VerseRow>(sql, params)).map(toVerse);
}

export async function getVerse({ db }: DataContext, id: string): Promise<Verse | null> {
  const row = await db.first<VerseRow>(`SELECT ${VERSE_SELECT} FROM verses v WHERE v.id = ?`, [id]);
  return row ? toVerse(row) : null;
}

export async function listTags({ db }: DataContext): Promise<string[]> {
  const rows = await db.all<{ name: string }>('SELECT name FROM tags ORDER BY name COLLATE NOCASE');
  return rows.map((r) => r.name);
}

export async function writeTags(
  tx: SqlExecutor,
  verseId: string,
  tags: readonly string[],
): Promise<void> {
  await tx.runAsync('DELETE FROM verse_tags WHERE verse_id = ?', [verseId]);
  for (const name of tags) {
    await tx.runAsync('INSERT INTO tags (name) VALUES (?) ON CONFLICT(name) DO NOTHING', [name]);
    const tag = await tx.getFirstAsync<{ id: number }>('SELECT id FROM tags WHERE name = ?', [
      name,
    ]);
    await tx.runAsync('INSERT OR IGNORE INTO verse_tags (verse_id, tag_id) VALUES (?, ?)', [
      verseId,
      tag!.id,
    ]);
  }
  await tx.runAsync('DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM verse_tags)', []);
}

export async function insertVerseRow(tx: SqlExecutor, v: Verse): Promise<void> {
  await tx.runAsync(
    `INSERT INTO verses (id, book, chapter, verse_start, verse_end, canon_key, text_ko, text_en, label_ko, label_en,
       source, pack_id, search_text, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      v.id,
      v.book,
      v.chapter,
      v.verseStart,
      v.verseEnd,
      canonKey(v),
      v.textKo,
      v.textEn,
      v.labelKo,
      v.labelEn,
      v.source,
      v.packId,
      buildSearchText(v),
      v.createdAt,
      v.updatedAt,
    ],
  );
  await writeTags(tx, v.id, v.tags);
}

export async function createVerse(ctx: DataContext, input: ValidVerse): Promise<Verse> {
  const now = ctx.clock.now();
  const verse: Verse = {
    id: ctx.newId(),
    ...input,
    labelKo: null,
    labelEn: null,
    source: 'user',
    packId: null,
    createdAt: now,
    updatedAt: now,
  };
  await ctx.db.tx((tx) => insertVerseRow(tx, verse));
  emit('verses');
  return verse;
}

export class VerseNotFoundError extends Error {}

/**
 * Updates a verse. Review progress is kept. For pack verses the reference and the WEB
 * English text are read-only (unmodified public-domain text, trademark condition).
 */
export async function updateVerse(ctx: DataContext, id: string, input: ValidVerse): Promise<Verse> {
  const existing = await getVerse(ctx, id);
  if (!existing) throw new VerseNotFoundError(id);
  const locked = existing.source === 'pack';
  const next: Verse = {
    ...existing,
    book: locked ? existing.book : input.book,
    chapter: locked ? existing.chapter : input.chapter,
    verseStart: locked ? existing.verseStart : input.verseStart,
    verseEnd: locked ? existing.verseEnd : input.verseEnd,
    textKo: input.textKo,
    textEn: locked ? existing.textEn : input.textEn,
    tags: input.tags,
    updatedAt: ctx.clock.now(),
  };
  if (next.textKo === null && next.textEn === null)
    throw new Error('A verse needs at least one text');
  await ctx.db.tx(async (tx) => {
    await tx.runAsync(
      `UPDATE verses SET book = ?, chapter = ?, verse_start = ?, verse_end = ?, canon_key = ?, text_ko = ?, text_en = ?,
         search_text = ?, updated_at = ? WHERE id = ?`,
      [
        next.book,
        next.chapter,
        next.verseStart,
        next.verseEnd,
        canonKey(next),
        next.textKo,
        next.textEn,
        buildSearchText(next),
        next.updatedAt,
        id,
      ],
    );
    await writeTags(tx, id, next.tags);
    // A card for a language whose text was removed can no longer be practiced.
    if (next.textKo === null)
      await tx.runAsync("DELETE FROM cards WHERE verse_id = ? AND lang = 'ko'", [id]);
    if (next.textEn === null)
      await tx.runAsync("DELETE FROM cards WHERE verse_id = ? AND lang = 'en'", [id]);
  });
  emit('verses');
  return next;
}

/** Cascades to cards, logs, tags links and weekly family assignments. */
export async function deleteVerse(ctx: DataContext, id: string): Promise<void> {
  await ctx.db.tx(async (tx) => {
    await tx.runAsync('DELETE FROM verses WHERE id = ?', [id]);
    await tx.runAsync('DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM verse_tags)', []);
  });
  emit('verses');
}
