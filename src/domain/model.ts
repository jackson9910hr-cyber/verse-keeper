/** Shared entity shapes (camelCase). The data layer maps SQLite rows to/from these. */
import type { Grade } from './srs/schedule';
import type { LocalDate } from './time/localDate';

export type Lang = 'ko' | 'en';
export type PracticeMode = 'cloze' | 'first_letter' | 'listen';
export type LogKind = 'review' | 'practice';

export const PROFILE_COLORS = [
  'blue',
  'green',
  'orange',
  'purple',
  'pink',
  'teal',
  'red',
  'brown',
] as const;
export type ProfileColor = (typeof PROFILE_COLORS)[number];
export const MAX_PROFILES = 8;
export const MAX_PROFILE_NAME = 20;

export interface Profile {
  id: string;
  name: string;
  color: ProfileColor;
  sortOrder: number;
  createdAt: number;
}

export interface Verse {
  id: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  textKo: string | null;
  textEn: string | null;
  labelKo: string | null;
  labelEn: string | null;
  source: 'user' | 'pack';
  packId: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Card {
  id: string;
  profileId: string;
  verseId: string;
  lang: Lang;
  efMilli: number;
  reps: number;
  intervalDays: number;
  dueDate: LocalDate;
  lapses: number;
  lastReviewedOn: LocalDate | null;
  clozeLevel: number;
  suspended: boolean;
  createdAt: number;
}

export interface ReviewLog {
  cardId: string;
  profileId: string;
  grade: Grade;
  mode: PracticeMode;
  kind: LogKind;
  reviewedAt: number;
  localDate: LocalDate;
  prevInterval: number;
  newInterval: number;
  prevEfMilli: number;
  newEfMilli: number;
}

export interface FamilyWeekly {
  weekStart: LocalDate;
  verseId: string;
  assignedAt: number;
}

export interface FamilyCheck {
  weekStart: LocalDate;
  profileId: string;
  checkedAt: number;
}

export interface InstalledPack {
  packId: string;
  version: number;
  installedAt: number;
}
