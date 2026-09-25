import {
  BACKUP_APP_ID,
  CURRENT_BACKUP_SCHEMA,
  MAX_BACKUP_BYTES,
  migrateBackup,
  parseBackup,
  type BackupData,
} from './backup';

const data = (): BackupData => ({
  profiles: [{ id: 'p1', name: 'Me', color: 'blue', sortOrder: 0, createdAt: 1 }],
  verses: [
    {
      id: 'v1',
      book: 'JHN',
      chapter: 3,
      verseStart: 16,
      verseEnd: null,
      textKo: '더미 문장',
      textEn: null,
      labelKo: null,
      labelEn: null,
      source: 'user',
      packId: null,
      tags: ['love'],
      createdAt: 1,
      updatedAt: 1,
    },
  ],
  cards: [
    {
      id: 'c1',
      profileId: 'p1',
      verseId: 'v1',
      lang: 'ko',
      efMilli: 2500,
      reps: 0,
      intervalDays: 0,
      dueDate: '2026-09-25',
      lapses: 0,
      lastReviewedOn: null,
      clozeLevel: 1,
      suspended: false,
      createdAt: 1,
    },
  ],
  reviewLogs: [
    {
      cardId: 'c1',
      profileId: 'p1',
      grade: 'good',
      mode: 'cloze',
      kind: 'review',
      reviewedAt: 2,
      localDate: '2026-09-25',
      prevInterval: 0,
      newInterval: 1,
      prevEfMilli: 2500,
      newEfMilli: 2500,
    },
  ],
  familyWeekly: [{ weekStart: '2026-09-21', verseId: 'v1', assignedAt: 1 }],
  familyChecks: [{ weekStart: '2026-09-21', profileId: 'p1', checkedAt: 1 }],
  settings: { 'ui.theme': 'dark' },
  installedPacks: [],
});

const file = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    app: BACKUP_APP_ID,
    schemaVersion: 1,
    appVersion: '1.0.0',
    exportedAt: '2026-09-25T00:00:00.000Z',
    data: data(),
    ...overrides,
  });

describe('parseBackup', () => {
  it('accepts a valid backup', () => {
    const r = parseBackup(file());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.data.verses[0]!.tags).toEqual(['love']);
  });
  it('rejects oversized files before parsing', () => {
    expect(parseBackup('x'.repeat(MAX_BACKUP_BYTES + 1))).toEqual({
      ok: false,
      error: { code: 'TOO_LARGE' },
    });
  });
  it('rejects invalid JSON', () => {
    expect(parseBackup('{nope')).toEqual({ ok: false, error: { code: 'NOT_JSON' } });
  });
  it('rejects other apps', () => {
    expect(parseBackup(file({ app: 'other' }))).toEqual({
      ok: false,
      error: { code: 'WRONG_APP' },
    });
    expect(parseBackup('[]')).toEqual({ ok: false, error: { code: 'WRONG_APP' } });
  });
  it('rejects newer schema versions', () => {
    expect(parseBackup(file({ schemaVersion: CURRENT_BACKUP_SCHEMA + 1 }))).toEqual({
      ok: false,
      error: { code: 'FUTURE_SCHEMA' },
    });
  });
  it('rejects invalid schema versions', () => {
    const r = parseBackup(file({ schemaVersion: 0 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_FIELD');
  });
  it('reports the path of an invalid field', () => {
    const d = data();
    (d.cards[0] as unknown as Record<string, unknown>).dueDate = '2026-02-30';
    const r = parseBackup(file({ data: d }));
    expect(r).toEqual({
      ok: false,
      error: { code: 'INVALID_FIELD', path: 'data.cards[0].dueDate' },
    });
  });
  it('rejects wrong enum values and missing arrays', () => {
    const d = data();
    (d.reviewLogs[0] as unknown as Record<string, unknown>).grade = 'perfect';
    expect(parseBackup(file({ data: d }))).toEqual({
      ok: false,
      error: { code: 'INVALID_FIELD', path: 'data.reviewLogs[0].grade' },
    });
    const d2 = data() as unknown as Record<string, unknown>;
    delete d2.profiles;
    expect(parseBackup(file({ data: d2 }))).toEqual({
      ok: false,
      error: { code: 'INVALID_FIELD', path: 'data.profiles' },
    });
  });
  it('rejects verses without any text', () => {
    const d = data();
    d.verses[0]!.textKo = null;
    expect(parseBackup(file({ data: d }))).toEqual({
      ok: false,
      error: { code: 'INVALID_FIELD', path: 'data.verses[0].textKo' },
    });
  });
  it('detects broken references', () => {
    const d = data();
    d.cards[0]!.verseId = 'missing';
    expect(parseBackup(file({ data: d }))).toEqual({
      ok: false,
      error: { code: 'BROKEN_REFERENCE', path: 'data.cards[0].verseId' },
    });
    const d2 = data();
    d2.familyChecks[0]!.weekStart = '2026-01-05';
    expect(parseBackup(file({ data: d2 }))).toEqual({
      ok: false,
      error: { code: 'BROKEN_REFERENCE', path: 'data.familyChecks[0].weekStart' },
    });
  });
  it('detects duplicate ids', () => {
    const d = data();
    d.profiles.push({ ...d.profiles[0]! });
    expect(parseBackup(file({ data: d }))).toEqual({
      ok: false,
      error: { code: 'INVALID_FIELD', path: 'data.profiles[1].id' },
    });
  });
  it('requires at least one profile', () => {
    const d = data();
    d.profiles = [];
    d.cards = [];
    d.reviewLogs = [];
    d.familyChecks = [];
    expect(parseBackup(file({ data: d }))).toEqual({
      ok: false,
      error: { code: 'INVALID_FIELD', path: 'data.profiles' },
    });
  });
});

describe('migrateBackup', () => {
  it('is a no-op for the current schema', () => {
    const raw = { a: 1 };
    expect(migrateBackup(raw, CURRENT_BACKUP_SCHEMA)).toBe(raw);
  });
  it('applies steps in order and fails on a gap', () => {
    expect(migrateBackup({ n: 0 }, 0, { 0: (r) => ({ ...r, n: 1 }) })).toEqual({ n: 1 });
    expect(() => migrateBackup({}, 0, {})).toThrow('No backup migration from v0');
  });
});
