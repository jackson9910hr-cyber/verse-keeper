/** Backup file format and validation — docs/algorithms.md §8, docs/data-model.md §5. */
import { isBookCode } from '../bible/books';
import {
  PROFILE_COLORS,
  type Card,
  type FamilyCheck,
  type FamilyWeekly,
  type InstalledPack,
  type Profile,
  type ReviewLog,
  type Verse,
} from '../model';
import { GRADES } from '../srs/schedule';
import { MAX_TAG_LENGTH, MAX_TAGS, MAX_TEXT_LENGTH } from '../verse/verseInput';
import {
  GuardError,
  arrayOf,
  bool,
  int,
  isObject,
  localDate,
  nullable,
  object,
  oneOf,
  str,
  type Guard,
} from './guards';

export const BACKUP_APP_ID = 'verse-keeper';
export const CURRENT_BACKUP_SCHEMA = 1;
/** Size limit in UTF-16 code units (~5 MB of ASCII JSON). */
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export interface BackupData {
  profiles: Profile[];
  verses: Verse[];
  cards: Card[];
  reviewLogs: ReviewLog[];
  familyWeekly: FamilyWeekly[];
  familyChecks: FamilyCheck[];
  settings: Record<string, unknown>;
  installedPacks: InstalledPack[];
}

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  data: BackupData;
}

export type BackupErrorCode =
  'TOO_LARGE' | 'NOT_JSON' | 'WRONG_APP' | 'FUTURE_SCHEMA' | 'INVALID_FIELD' | 'BROKEN_REFERENCE';
export type BackupError = { code: BackupErrorCode; path?: string };
export type BackupResult = { ok: true; value: BackupFile } | { ok: false; error: BackupError };

const id = str(64, 1);
const epoch = int(0);

const profileGuard: Guard<Profile> = object<Profile>({
  id,
  name: str(20, 1),
  color: oneOf(PROFILE_COLORS),
  sortOrder: int(0, 1000),
  createdAt: epoch,
});

const bookGuard: Guard<string> = (v, p) => {
  const code = str(3, 3)(v, p);
  if (!isBookCode(code)) throw new GuardError(p);
  return code;
};

const verseGuard: Guard<Verse> = (v, p) => {
  const verse = object<Verse>({
    id,
    book: bookGuard,
    chapter: int(1, 150),
    verseStart: int(1, 999),
    verseEnd: nullable(int(1, 999)),
    textKo: nullable(str(MAX_TEXT_LENGTH, 1)),
    textEn: nullable(str(MAX_TEXT_LENGTH, 1)),
    labelKo: nullable(str(40)),
    labelEn: nullable(str(40)),
    source: oneOf(['user', 'pack'] as const),
    packId: nullable(str(64, 1)),
    tags: arrayOf(str(MAX_TAG_LENGTH, 1), MAX_TAGS),
    createdAt: epoch,
    updatedAt: epoch,
  })(v, p);
  if (verse.textKo === null && verse.textEn === null) throw new GuardError(`${p}.textKo`);
  if (verse.verseEnd !== null && verse.verseEnd < verse.verseStart)
    throw new GuardError(`${p}.verseEnd`);
  return verse;
};

const cardGuard: Guard<Card> = object<Card>({
  id,
  profileId: id,
  verseId: id,
  lang: oneOf(['ko', 'en'] as const),
  efMilli: int(1300, 10_000),
  reps: int(0),
  intervalDays: int(0, 365),
  dueDate: localDate,
  lapses: int(0),
  lastReviewedOn: nullable(localDate),
  clozeLevel: int(1, 5),
  suspended: bool,
  createdAt: epoch,
});

const logGuard: Guard<ReviewLog> = object<ReviewLog>({
  cardId: id,
  profileId: id,
  grade: oneOf(GRADES),
  mode: oneOf(['cloze', 'first_letter', 'listen'] as const),
  kind: oneOf(['review', 'practice'] as const),
  reviewedAt: epoch,
  localDate,
  prevInterval: int(0, 365),
  newInterval: int(0, 365),
  prevEfMilli: int(1300, 10_000),
  newEfMilli: int(1300, 10_000),
});

const settingsGuard: Guard<Record<string, unknown>> = (v, p) => {
  if (!isObject(v) || Object.keys(v).length > 200) throw new GuardError(p);
  return { ...v };
};

const dataGuard = object<BackupData>({
  profiles: arrayOf(profileGuard, 8),
  verses: arrayOf(verseGuard),
  cards: arrayOf(cardGuard),
  reviewLogs: arrayOf(logGuard, 500_000),
  familyWeekly: arrayOf(
    object<FamilyWeekly>({ weekStart: localDate, verseId: id, assignedAt: epoch }),
  ),
  familyChecks: arrayOf(
    object<FamilyCheck>({ weekStart: localDate, profileId: id, checkedAt: epoch }),
  ),
  settings: settingsGuard,
  installedPacks: arrayOf(
    object<InstalledPack>({ packId: id, version: int(1), installedAt: epoch }),
  ),
});

type Check = (d: BackupData) => BackupError | null;

function uniqueIds<T>(
  key: keyof BackupData,
  rows: T[],
  keyOf: (row: T) => string,
  field: string,
): BackupError | null {
  const seen = new Set<string>();
  for (let i = 0; i < rows.length; i++) {
    const k = keyOf(rows[i]!);
    if (seen.has(k)) return { code: 'INVALID_FIELD', path: `data.${key}[${i}].${field}` };
    seen.add(k);
  }
  return null;
}

function refs<T>(
  key: keyof BackupData,
  rows: T[],
  field: keyof T & string,
  valid: Set<string>,
): BackupError | null {
  for (let i = 0; i < rows.length; i++) {
    if (!valid.has(String(rows[i]![field])))
      return { code: 'BROKEN_REFERENCE', path: `data.${key}[${i}].${field}` };
  }
  return null;
}

const INTEGRITY: Check[] = [
  (d) => (d.profiles.length === 0 ? { code: 'INVALID_FIELD', path: 'data.profiles' } : null),
  (d) => uniqueIds('profiles', d.profiles, (r) => r.id, 'id'),
  (d) => uniqueIds('verses', d.verses, (r) => r.id, 'id'),
  (d) => uniqueIds('cards', d.cards, (r) => r.id, 'id'),
  (d) => uniqueIds('cards', d.cards, (r) => `${r.profileId}|${r.verseId}|${r.lang}`, 'lang'),
  (d) => uniqueIds('familyWeekly', d.familyWeekly, (r) => r.weekStart, 'weekStart'),
  (d) =>
    uniqueIds('familyChecks', d.familyChecks, (r) => `${r.weekStart}|${r.profileId}`, 'profileId'),
  (d) => uniqueIds('installedPacks', d.installedPacks, (r) => r.packId, 'packId'),
  (d) => refs('cards', d.cards, 'profileId', new Set(d.profiles.map((p) => p.id))),
  (d) => refs('cards', d.cards, 'verseId', new Set(d.verses.map((v) => v.id))),
  (d) => refs('reviewLogs', d.reviewLogs, 'cardId', new Set(d.cards.map((c) => c.id))),
  (d) => refs('reviewLogs', d.reviewLogs, 'profileId', new Set(d.profiles.map((p) => p.id))),
  (d) => refs('familyWeekly', d.familyWeekly, 'verseId', new Set(d.verses.map((v) => v.id))),
  (d) =>
    refs(
      'familyChecks',
      d.familyChecks,
      'weekStart',
      new Set(d.familyWeekly.map((w) => w.weekStart)),
    ),
  (d) => refs('familyChecks', d.familyChecks, 'profileId', new Set(d.profiles.map((p) => p.id))),
];

type BackupStep = (raw: Record<string, unknown>) => Record<string, unknown>;
/** BACKUP_STEPS[v] upgrades a v payload to v+1. v1 is the first schema, so there are none yet. */
const BACKUP_STEPS: Partial<Record<number, BackupStep>> = {};

/** Upgrades older backup payloads to CURRENT_BACKUP_SCHEMA. */
export function migrateBackup(
  raw: Record<string, unknown>,
  fromVersion: number,
  steps = BACKUP_STEPS,
): Record<string, unknown> {
  let migrated = raw;
  for (let v = fromVersion; v < CURRENT_BACKUP_SCHEMA; v++) {
    const step = steps[v];
    if (!step) throw new Error(`No backup migration from v${v}`);
    migrated = step(migrated);
  }
  return migrated;
}

export function parseBackup(json: string): BackupResult {
  if (json.length > MAX_BACKUP_BYTES) return { ok: false, error: { code: 'TOO_LARGE' } };
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: { code: 'NOT_JSON' } };
  }
  if (!isObject(raw) || raw.app !== BACKUP_APP_ID)
    return { ok: false, error: { code: 'WRONG_APP' } };
  try {
    const schemaVersion = int(1)(raw.schemaVersion, 'schemaVersion');
    if (schemaVersion > CURRENT_BACKUP_SCHEMA)
      return { ok: false, error: { code: 'FUTURE_SCHEMA' } };
    const upgraded = migrateBackup(raw, schemaVersion);
    const file: BackupFile = {
      app: BACKUP_APP_ID,
      schemaVersion: CURRENT_BACKUP_SCHEMA,
      appVersion: str(32)(upgraded.appVersion, 'appVersion'),
      exportedAt: str(40)(upgraded.exportedAt, 'exportedAt'),
      data: dataGuard(upgraded.data, 'data'),
    };
    for (const check of INTEGRITY) {
      const error = check(file.data);
      if (error) return { ok: false, error };
    }
    return { ok: true, value: file };
  } catch (e) {
    if (e instanceof GuardError)
      return { ok: false, error: { code: 'INVALID_FIELD', path: e.path } };
    throw e;
  }
}
