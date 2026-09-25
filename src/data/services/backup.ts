import {
  BACKUP_APP_ID,
  CURRENT_BACKUP_SCHEMA,
  type BackupData,
  type BackupFile,
} from '@/domain/backup/backup';
import { canonKey } from '@/domain/bible/books';

import type { DataContext } from '../context';
import type { SqlExecutor } from '../db/types';
import { emit } from '../events';
import { buildSearchText, writeTags } from '../repositories/verses';
import {
  VERSE_SELECT,
  toCard,
  toFamilyCheck,
  toFamilyWeekly,
  toInstalledPack,
  toProfile,
  toReviewLog,
  toVerse,
  type CardRow,
  type ProfileRow,
  type ReviewLogRow,
  type VerseRow,
} from '../rows';
import { isSettingKey, isValidSetting, writeSetting } from '../settings';

/** Device-specific settings that are never exported (permissions differ per device). */
const DEVICE_ONLY = new Set([
  'notify.enabled',
  'notify.time',
  'notify.scheduledId',
  'backup.lastExportAt',
  'onboarding.done',
]);

export async function exportBackup(
  { db, clock }: DataContext,
  appVersion: string,
): Promise<BackupFile> {
  const settingsRows = await db.all<{ key: string; value: string }>(
    'SELECT key, value FROM settings',
  );
  const settings: Record<string, unknown> = {};
  for (const { key, value } of settingsRows)
    if (!DEVICE_ONLY.has(key)) settings[key] = JSON.parse(value);
  const data: BackupData = {
    profiles: (await db.all<ProfileRow>('SELECT * FROM profiles ORDER BY sort_order')).map(
      toProfile,
    ),
    verses: (
      await db.all<VerseRow>(`SELECT ${VERSE_SELECT} FROM verses v ORDER BY v.canon_key`)
    ).map(toVerse),
    cards: (await db.all<CardRow>('SELECT * FROM cards')).map(toCard),
    reviewLogs: (await db.all<ReviewLogRow>('SELECT * FROM review_logs ORDER BY id')).map(
      toReviewLog,
    ),
    familyWeekly: (
      await db.all<{ week_start: string; verse_id: string; assigned_at: number }>(
        'SELECT * FROM family_weekly',
      )
    ).map(toFamilyWeekly),
    familyChecks: (
      await db.all<{ week_start: string; profile_id: string; checked_at: number }>(
        'SELECT * FROM family_checks',
      )
    ).map(toFamilyCheck),
    settings,
    installedPacks: (
      await db.all<{ pack_id: string; version: number; installed_at: number }>(
        'SELECT * FROM installed_packs',
      )
    ).map(toInstalledPack),
  };
  return {
    app: BACKUP_APP_ID,
    schemaVersion: CURRENT_BACKUP_SCHEMA,
    appVersion,
    exportedAt: new Date(clock.now()).toISOString(),
    data,
  };
}

export const CLEAR_ALL_SQL = `
  DELETE FROM family_checks; DELETE FROM family_weekly; DELETE FROM review_logs; DELETE FROM cards;
  DELETE FROM verse_tags; DELETE FROM tags; DELETE FROM verses; DELETE FROM installed_packs; DELETE FROM profiles;`;

async function restore(tx: SqlExecutor, d: BackupData): Promise<void> {
  await tx.execAsync(CLEAR_ALL_SQL);
  await tx.execAsync(`DELETE FROM settings WHERE key NOT IN ('notify.time')`);
  for (const p of d.installedPacks) {
    await tx.runAsync(
      'INSERT INTO installed_packs (pack_id, version, installed_at) VALUES (?, ?, ?)',
      [p.packId, p.version, p.installedAt],
    );
  }
  for (const p of d.profiles) {
    await tx.runAsync(
      'INSERT INTO profiles (id, name, color, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
      [p.id, p.name, p.color, p.sortOrder, p.createdAt],
    );
  }
  const packIds = new Set(d.installedPacks.map((p) => p.packId));
  for (const v of d.verses) {
    await tx.runAsync(
      `INSERT INTO verses (id, book, chapter, verse_start, verse_end, canon_key, text_ko, text_en, label_ko, label_en, source, pack_id, search_text, created_at, updated_at)
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
        v.packId && packIds.has(v.packId) ? v.packId : null,
        buildSearchText(v),
        v.createdAt,
        v.updatedAt,
      ],
    );
    await writeTags(tx, v.id, v.tags);
  }
  for (const c of d.cards) {
    await tx.runAsync(
      `INSERT INTO cards (id, profile_id, verse_id, lang, ef_milli, reps, interval_days, due_date, lapses, last_reviewed_on, cloze_level, suspended, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id,
        c.profileId,
        c.verseId,
        c.lang,
        c.efMilli,
        c.reps,
        c.intervalDays,
        c.dueDate,
        c.lapses,
        c.lastReviewedOn,
        c.clozeLevel,
        c.suspended ? 1 : 0,
        c.createdAt,
      ],
    );
  }
  for (const l of d.reviewLogs) {
    await tx.runAsync(
      `INSERT INTO review_logs (card_id, profile_id, grade, mode, kind, reviewed_at, local_date, prev_interval, new_interval, prev_ef_milli, new_ef_milli)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        l.cardId,
        l.profileId,
        l.grade,
        l.mode,
        l.kind,
        l.reviewedAt,
        l.localDate,
        l.prevInterval,
        l.newInterval,
        l.prevEfMilli,
        l.newEfMilli,
      ],
    );
  }
  for (const w of d.familyWeekly) {
    await tx.runAsync(
      'INSERT INTO family_weekly (week_start, verse_id, assigned_at) VALUES (?, ?, ?)',
      [w.weekStart, w.verseId, w.assignedAt],
    );
  }
  for (const c of d.familyChecks) {
    await tx.runAsync(
      'INSERT INTO family_checks (week_start, profile_id, checked_at) VALUES (?, ?, ?)',
      [c.weekStart, c.profileId, c.checkedAt],
    );
  }
  for (const [key, value] of Object.entries(d.settings)) {
    if (isSettingKey(key) && !DEVICE_ONLY.has(key) && isValidSetting(key, value))
      await writeSetting(tx, key, value);
  }
  const active = d.settings['profile.activeId'];
  const activeId =
    typeof active === 'string' && d.profiles.some((p) => p.id === active)
      ? active
      : d.profiles[0]!.id;
  await writeSetting(tx, 'profile.activeId', activeId);
  await writeSetting(tx, 'notify.enabled', false);
  await writeSetting(tx, 'onboarding.done', true);
}

/** Replaces all data with a validated backup in one transaction (rolls back on any error). */
export async function importBackup(
  ctx: DataContext,
  file: BackupFile,
): Promise<{ verses: number; profiles: number }> {
  await ctx.db.tx((tx) => restore(tx, file.data));
  emit('all');
  return { verses: file.data.verses.length, profiles: file.data.profiles.length };
}
