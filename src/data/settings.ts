import type { KoHintRule } from '@/domain/hint/firstLetter';

import type { Database } from './db/database';
import type { SqlExecutor } from './db/types';
import { emit } from './events';

export type LanguagePref = 'system' | 'ko' | 'en';
export type ThemePref = 'system' | 'light' | 'dark';

export interface Settings {
  'onboarding.done': boolean;
  'profile.activeId': string | null;
  'ui.language': LanguagePref;
  'ui.theme': ThemePref;
  'ui.haptics': boolean;
  'review.sessionSize': number;
  'cloze.contentFirst': boolean;
  'cloze.showLength': boolean;
  'hint.koRule': KoHintRule;
  'listen.rate': number;
  'listen.repeat': number;
  'family.weekStartsOn': number;
  'notify.enabled': boolean;
  'notify.time': string;
  'notify.scheduledId': string | null;
  'backup.lastExportAt': number | null;
}
export type SettingKey = keyof Settings;

export const DEFAULT_SETTINGS: Settings = {
  'onboarding.done': false,
  'profile.activeId': null,
  'ui.language': 'system',
  'ui.theme': 'system',
  'ui.haptics': true,
  'review.sessionSize': 20,
  'cloze.contentFirst': true,
  'cloze.showLength': true,
  'hint.koRule': 'syllable',
  'listen.rate': 1,
  'listen.repeat': 1,
  'family.weekStartsOn': 1,
  'notify.enabled': false,
  'notify.time': '20:00',
  'notify.scheduledId': null,
  'backup.lastExportAt': null,
};

const oneOf =
  <T extends string>(...values: T[]) =>
  (v: unknown): v is T =>
    typeof v === 'string' && (values as string[]).includes(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const intIn =
  (min: number, max: number) =>
  (v: unknown): v is number =>
    Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const numIn =
  (min: number, max: number) =>
  (v: unknown): v is number =>
    typeof v === 'number' && v >= min && v <= max;
const strOrNull = (v: unknown): v is string | null => v === null || typeof v === 'string';
const numOrNull = (v: unknown): v is number | null => v === null || typeof v === 'number';

const VALIDATORS: { [K in SettingKey]: (v: unknown) => v is Settings[K] } = {
  'onboarding.done': isBool,
  'profile.activeId': strOrNull,
  'ui.language': oneOf('system', 'ko', 'en'),
  'ui.theme': oneOf('system', 'light', 'dark'),
  'ui.haptics': isBool,
  'review.sessionSize': intIn(5, 100),
  'cloze.contentFirst': isBool,
  'cloze.showLength': isBool,
  'hint.koRule': oneOf('syllable', 'choseong'),
  'listen.rate': numIn(0.5, 1.5),
  'listen.repeat': intIn(1, 5),
  'family.weekStartsOn': intIn(0, 6),
  'notify.enabled': isBool,
  'notify.time': (v): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v),
  'notify.scheduledId': strOrNull,
  'backup.lastExportAt': numOrNull,
};

export function isValidSetting<K extends SettingKey>(key: K, value: unknown): value is Settings[K] {
  return VALIDATORS[key](value);
}

export function isSettingKey(key: string): key is SettingKey {
  return key in VALIDATORS;
}

/** Stored values that fail validation (corrupt or from a newer app) fall back to defaults. */
export async function loadSettings(db: Database): Promise<Settings> {
  const rows = await db.all<{ key: string; value: string }>('SELECT key, value FROM settings');
  const settings: Settings = { ...DEFAULT_SETTINGS };
  for (const { key, value } of rows) {
    if (!isSettingKey(key)) continue;
    try {
      const parsed: unknown = JSON.parse(value);
      if (isValidSetting(key, parsed)) (settings as Record<SettingKey, unknown>)[key] = parsed;
    } catch {
      // corrupt JSON → keep default
    }
  }
  return settings;
}

export async function writeSetting<K extends SettingKey>(
  tx: SqlExecutor,
  key: K,
  value: Settings[K],
): Promise<void> {
  if (!isValidSetting(key, value)) throw new Error(`Invalid value for setting ${key}`);
  await tx.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, JSON.stringify(value)],
  );
}

export async function saveSetting<K extends SettingKey>(
  db: Database,
  key: K,
  value: Settings[K],
): Promise<void> {
  await db.tx((tx) => writeSetting(tx, key, value));
  emit('settings');
}
