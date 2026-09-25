import type { Verse } from '@/domain/model';
import type { VersePack } from '@/domain/pack/pack';

import type { DataContext } from '../context';
import { emit } from '../events';
import { buildSearchText, deleteOrphanTags, insertVerseRow } from '../repositories/verses';
import { canonKey } from '@/domain/bible/books';

/**
 * Installs or upgrades a bundled pack. Idempotent: does nothing if the installed version is current.
 * On upgrade only the WEB text/reference are refreshed; user-owned fields (Korean text, tags) are kept.
 */
export async function installPack(ctx: DataContext, pack: VersePack): Promise<boolean> {
  const now = ctx.clock.now();
  const changed = await ctx.db.tx(async (tx) => {
    const installed = await tx.getFirstAsync<{ version: number }>(
      'SELECT version FROM installed_packs WHERE pack_id = ?',
      [pack.packId],
    );
    if (installed && installed.version >= pack.version) return false;
    await tx.runAsync(
      `INSERT INTO installed_packs (pack_id, version, installed_at) VALUES (?, ?, ?)
       ON CONFLICT(pack_id) DO UPDATE SET version = excluded.version, installed_at = excluded.installed_at`,
      [pack.packId, pack.version, now],
    );
    for (const pv of pack.verses) {
      const existing = await tx.getFirstAsync<{ text_ko: string | null }>(
        'SELECT text_ko FROM verses WHERE id = ?',
        [pv.id],
      );
      if (!existing) {
        const verse: Verse = {
          id: pv.id,
          book: pv.book,
          chapter: pv.chapter,
          verseStart: pv.verseStart,
          verseEnd: pv.verseEnd,
          textKo: null,
          textEn: pv.textEn,
          labelKo: null,
          labelEn: pack.translation.code,
          source: 'pack',
          packId: pack.packId,
          tags: pv.tags,
          createdAt: now,
          updatedAt: now,
        };
        await insertVerseRow(tx, verse, false);
        continue;
      }
      const tags = (
        await tx.getAllAsync<{ name: string }>(
          'SELECT t.name FROM verse_tags vt JOIN tags t ON t.id = vt.tag_id WHERE vt.verse_id = ?',
          [pv.id],
        )
      ).map((t) => t.name);
      await tx.runAsync(
        `UPDATE verses SET book = ?, chapter = ?, verse_start = ?, verse_end = ?, canon_key = ?, text_en = ?, label_en = ?,
           source = 'pack', pack_id = ?, search_text = ?, updated_at = ? WHERE id = ?`,
        [
          pv.book,
          pv.chapter,
          pv.verseStart,
          pv.verseEnd,
          canonKey(pv),
          pv.textEn,
          pack.translation.code,
          pack.packId,
          buildSearchText({ ...pv, textKo: existing.text_ko, tags }),
          now,
          pv.id,
        ],
      );
    }
    await deleteOrphanTags(tx);
    return true;
  });
  if (changed) emit('verses');
  return changed;
}
