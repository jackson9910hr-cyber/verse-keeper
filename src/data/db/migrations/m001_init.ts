import type { SqlExecutor } from '../types';

/** Schema v1 — docs/data-model.md §2. Never edit after release; add a new migration instead. */
export async function m001Init(tx: SqlExecutor): Promise<void> {
  await tx.execAsync(`
CREATE TABLE profiles (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 20),
  color       TEXT NOT NULL DEFAULT 'blue',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);

CREATE TABLE installed_packs (
  pack_id       TEXT PRIMARY KEY,
  version       INTEGER NOT NULL,
  installed_at  INTEGER NOT NULL
);

CREATE TABLE verses (
  id           TEXT PRIMARY KEY,
  book         TEXT NOT NULL,
  chapter      INTEGER NOT NULL CHECK (chapter >= 1),
  verse_start  INTEGER NOT NULL CHECK (verse_start >= 1),
  verse_end    INTEGER CHECK (verse_end IS NULL OR verse_end >= verse_start),
  canon_key    INTEGER NOT NULL,
  text_ko      TEXT CHECK (text_ko IS NULL OR length(text_ko) <= 2000),
  text_en      TEXT CHECK (text_en IS NULL OR length(text_en) <= 2000),
  label_ko     TEXT,
  label_en     TEXT,
  source       TEXT NOT NULL CHECK (source IN ('user','pack')),
  pack_id      TEXT REFERENCES installed_packs(pack_id) ON DELETE SET NULL,
  search_text  TEXT NOT NULL DEFAULT '',
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  CHECK (text_ko IS NOT NULL OR text_en IS NOT NULL)
);

CREATE TABLE tags (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (length(name) BETWEEN 1 AND 20)
);

CREATE TABLE verse_tags (
  verse_id  TEXT    NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  tag_id    INTEGER NOT NULL REFERENCES tags(id)   ON DELETE CASCADE,
  PRIMARY KEY (verse_id, tag_id)
) WITHOUT ROWID;

CREATE TABLE cards (
  id                TEXT PRIMARY KEY,
  profile_id        TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verse_id          TEXT NOT NULL REFERENCES verses(id)   ON DELETE CASCADE,
  lang              TEXT NOT NULL CHECK (lang IN ('ko','en')),
  ef_milli          INTEGER NOT NULL DEFAULT 2500 CHECK (ef_milli >= 1300),
  reps              INTEGER NOT NULL DEFAULT 0 CHECK (reps >= 0),
  interval_days     INTEGER NOT NULL DEFAULT 0 CHECK (interval_days BETWEEN 0 AND 365),
  due_date          TEXT NOT NULL,
  lapses            INTEGER NOT NULL DEFAULT 0,
  last_reviewed_on  TEXT,
  cloze_level       INTEGER NOT NULL DEFAULT 1 CHECK (cloze_level BETWEEN 1 AND 5),
  suspended         INTEGER NOT NULL DEFAULT 0 CHECK (suspended IN (0,1)),
  created_at        INTEGER NOT NULL,
  UNIQUE (profile_id, verse_id, lang)
);

CREATE TABLE review_logs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id        TEXT NOT NULL REFERENCES cards(id)    ON DELETE CASCADE,
  profile_id     TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grade          TEXT NOT NULL CHECK (grade IN ('again','hard','good','easy')),
  mode           TEXT NOT NULL CHECK (mode IN ('cloze','first_letter','listen')),
  kind           TEXT NOT NULL CHECK (kind IN ('review','practice')),
  reviewed_at    INTEGER NOT NULL,
  local_date     TEXT NOT NULL,
  prev_interval  INTEGER NOT NULL,
  new_interval   INTEGER NOT NULL,
  prev_ef_milli  INTEGER NOT NULL,
  new_ef_milli   INTEGER NOT NULL
);

CREATE TABLE family_weekly (
  week_start   TEXT PRIMARY KEY,
  verse_id     TEXT NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  assigned_at  INTEGER NOT NULL
);

CREATE TABLE family_checks (
  week_start  TEXT NOT NULL REFERENCES family_weekly(week_start) ON DELETE CASCADE,
  profile_id  TEXT NOT NULL REFERENCES profiles(id)             ON DELETE CASCADE,
  checked_at  INTEGER NOT NULL,
  PRIMARY KEY (week_start, profile_id)
) WITHOUT ROWID;

CREATE TABLE settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
) WITHOUT ROWID;

CREATE INDEX idx_cards_due        ON cards (profile_id, suspended, due_date);
CREATE INDEX idx_cards_verse      ON cards (verse_id);
CREATE INDEX idx_logs_profile_day ON review_logs (profile_id, local_date);
CREATE INDEX idx_logs_card        ON review_logs (card_id);
CREATE INDEX idx_verses_canon     ON verses (canon_key);
CREATE INDEX idx_verses_created   ON verses (created_at DESC);
CREATE INDEX idx_verse_tags_tag   ON verse_tags (tag_id);
CREATE INDEX idx_family_verse     ON family_weekly (verse_id);
`);
}
