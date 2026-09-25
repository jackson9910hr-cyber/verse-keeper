/** snake_case SQLite rows ↔ camelCase domain entities. */
import type {
  Card,
  FamilyCheck,
  FamilyWeekly,
  InstalledPack,
  Profile,
  ProfileColor,
  ReviewLog,
  Verse,
} from '@/domain/model';

export interface ProfileRow {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: number;
}
export const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  name: r.name,
  color: r.color as ProfileColor,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
});

export interface VerseRow {
  id: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  text_ko: string | null;
  text_en: string | null;
  label_ko: string | null;
  label_en: string | null;
  source: 'user' | 'pack';
  pack_id: string | null;
  created_at: number;
  updated_at: number;
  /** group_concat of tag names separated by U+001F */
  tags: string | null;
}
export const TAG_SEPARATOR = '\u001f';
export const toVerse = (r: VerseRow): Verse => ({
  id: r.id,
  book: r.book,
  chapter: r.chapter,
  verseStart: r.verse_start,
  verseEnd: r.verse_end,
  textKo: r.text_ko,
  textEn: r.text_en,
  labelKo: r.label_ko,
  labelEn: r.label_en,
  source: r.source,
  packId: r.pack_id,
  tags: r.tags ? r.tags.split(TAG_SEPARATOR) : [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
/** SELECT list for verses with their tags (alphabetical). */
export const VERSE_SELECT = `
  v.*, (SELECT group_concat(name, char(31)) FROM (
    SELECT t.name FROM verse_tags vt JOIN tags t ON t.id = vt.tag_id WHERE vt.verse_id = v.id ORDER BY t.name COLLATE NOCASE
  )) AS tags`;

export interface CardRow {
  id: string;
  profile_id: string;
  verse_id: string;
  lang: 'ko' | 'en';
  ef_milli: number;
  reps: number;
  interval_days: number;
  due_date: string;
  lapses: number;
  last_reviewed_on: string | null;
  cloze_level: number;
  suspended: number;
  created_at: number;
}
export const toCard = (r: CardRow): Card => ({
  id: r.id,
  profileId: r.profile_id,
  verseId: r.verse_id,
  lang: r.lang,
  efMilli: r.ef_milli,
  reps: r.reps,
  intervalDays: r.interval_days,
  dueDate: r.due_date,
  lapses: r.lapses,
  lastReviewedOn: r.last_reviewed_on,
  clozeLevel: r.cloze_level,
  suspended: r.suspended === 1,
  createdAt: r.created_at,
});

export interface ReviewLogRow {
  card_id: string;
  profile_id: string;
  grade: ReviewLog['grade'];
  mode: ReviewLog['mode'];
  kind: ReviewLog['kind'];
  reviewed_at: number;
  local_date: string;
  prev_interval: number;
  new_interval: number;
  prev_ef_milli: number;
  new_ef_milli: number;
}
export const toReviewLog = (r: ReviewLogRow): ReviewLog => ({
  cardId: r.card_id,
  profileId: r.profile_id,
  grade: r.grade,
  mode: r.mode,
  kind: r.kind,
  reviewedAt: r.reviewed_at,
  localDate: r.local_date,
  prevInterval: r.prev_interval,
  newInterval: r.new_interval,
  prevEfMilli: r.prev_ef_milli,
  newEfMilli: r.new_ef_milli,
});

export const toFamilyWeekly = (r: {
  week_start: string;
  verse_id: string;
  assigned_at: number;
}): FamilyWeekly => ({
  weekStart: r.week_start,
  verseId: r.verse_id,
  assignedAt: r.assigned_at,
});
export const toFamilyCheck = (r: {
  week_start: string;
  profile_id: string;
  checked_at: number;
}): FamilyCheck => ({
  weekStart: r.week_start,
  profileId: r.profile_id,
  checkedAt: r.checked_at,
});
export const toInstalledPack = (r: {
  pack_id: string;
  version: number;
  installed_at: number;
}): InstalledPack => ({
  packId: r.pack_id,
  version: r.version,
  installedAt: r.installed_at,
});
