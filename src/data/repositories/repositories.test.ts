import { validateVerseInput, type ValidVerse, type VerseInput } from '@/domain/verse/verseInput';

import { DAY, makeTestContext } from '../testing/context';
import { subscribe, type DataTopic } from '../events';
import { loadSettings, saveSetting, DEFAULT_SETTINGS } from '../settings';
import {
  cardsForVerse,
  dueCount,
  dueQueue,
  getCardWithVerse,
  learningCount,
  setClozeLevel,
  setSuspended,
  startLearning,
  deleteCard,
} from './cards';
import {
  assignWeeklyVerse,
  changeWeekStart,
  clearWeeklyVerse,
  listAssignments,
  listChecks,
  toggleCheck,
} from './family';
import {
  LastProfileError,
  ProfileLimitError,
  InvalidNameError,
  createProfile,
  deleteProfile,
  listProfiles,
  updateProfile,
} from './profiles';
import {
  createVerse,
  deleteVerse,
  getVerse,
  listTags,
  listVerses,
  updateVerse,
  VerseNotFoundError,
} from './verses';

const input = (overrides: Partial<VerseInput> = {}): ValidVerse => {
  const r = validateVerseInput({
    book: 'JHN',
    chapter: 11,
    verseStart: 35,
    verseEnd: null,
    textKo: '',
    textEn: 'Jesus wept.',
    tags: [],
    ...overrides,
  });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.value;
};

describe('settings', () => {
  it('returns defaults and persists valid values', async () => {
    const ctx = await makeTestContext();
    expect(await loadSettings(ctx.db)).toEqual(DEFAULT_SETTINGS);
    await saveSetting(ctx.db, 'ui.theme', 'dark');
    expect((await loadSettings(ctx.db))['ui.theme']).toBe('dark');
  });
  it('rejects invalid writes and ignores corrupt stored values', async () => {
    const ctx = await makeTestContext();
    await expect(saveSetting(ctx.db, 'review.sessionSize', 1000)).rejects.toThrow('Invalid value');
    await ctx.db.run(
      "INSERT INTO settings (key, value) VALUES ('ui.theme', '\"neon\"'), ('listen.rate', '{bad'), ('unknown.key', '1')",
    );
    const s = await loadSettings(ctx.db);
    expect(s['ui.theme']).toBe('system');
    expect(s['listen.rate']).toBe(1);
  });
});

describe('profiles', () => {
  it('creates, lists, renames and recolors', async () => {
    const ctx = await makeTestContext();
    const a = await createProfile(ctx, '  Dad ');
    const b = await createProfile(ctx, 'Kid', 'green');
    expect(a).toMatchObject({ name: 'Dad', color: 'blue', sortOrder: 0 });
    await updateProfile(ctx, b.id, { name: 'Child', color: 'purple' });
    expect((await listProfiles(ctx)).map((p) => [p.name, p.color])).toEqual([
      ['Dad', 'blue'],
      ['Child', 'purple'],
    ]);
  });
  it('validates names and limits the count to 8', async () => {
    const ctx = await makeTestContext();
    await expect(createProfile(ctx, '   ')).rejects.toBeInstanceOf(InvalidNameError);
    for (let i = 0; i < 8; i++) await createProfile(ctx, `P${i}`);
    await expect(createProfile(ctx, 'Nine')).rejects.toBeInstanceOf(ProfileLimitError);
    expect((await createProfile(await makeTestContext(), 'x'.repeat(30))).name).toHaveLength(20);
  });
  it('cannot delete the last profile; deleting the active one switches the active id', async () => {
    const ctx = await makeTestContext();
    const a = await createProfile(ctx, 'A');
    await expect(deleteProfile(ctx, a.id)).rejects.toBeInstanceOf(LastProfileError);
    const b = await createProfile(ctx, 'B');
    await saveSetting(ctx.db, 'profile.activeId', a.id);
    await deleteProfile(ctx, a.id);
    expect((await loadSettings(ctx.db))['profile.activeId']).toBe(b.id);
  });
  it('deleting a profile removes only its cards, keeping verses', async () => {
    const ctx = await makeTestContext();
    const a = await createProfile(ctx, 'A');
    const b = await createProfile(ctx, 'B');
    const v = await createVerse(ctx, input());
    await startLearning(ctx, a.id, v);
    await startLearning(ctx, b.id, v);
    await deleteProfile(ctx, a.id);
    expect(await getVerse(ctx, v.id)).not.toBeNull();
    expect(await learningCount(ctx, b.id)).toBe(1);
    expect(await learningCount(ctx, a.id)).toBe(0);
  });
});

describe('verses', () => {
  it('creates and reads a verse with tags', async () => {
    const ctx = await makeTestContext();
    const v = await createVerse(
      ctx,
      input({ tags: ['Comfort', 'grief'], textKo: '더미 한국어 문장' }),
    );
    const read = await getVerse(ctx, v.id);
    expect(read).toMatchObject({
      book: 'JHN',
      textEn: 'Jesus wept.',
      textKo: '더미 한국어 문장',
      source: 'user',
      tags: ['Comfort', 'grief'],
    });
    expect(await listTags(ctx)).toEqual(['Comfort', 'grief']);
  });

  it('searches reference names, texts and tags case-insensitively', async () => {
    const ctx = await makeTestContext();
    await createVerse(ctx, input({ tags: ['grief'] }));
    await createVerse(
      ctx,
      input({
        book: 'GEN',
        chapter: 1,
        verseStart: 1,
        textEn: 'In the beginning, God created the heavens and the earth.',
      }),
    );
    expect((await listVerses(ctx, { search: 'WEPT' })).map((v) => v.book)).toEqual(['JHN']);
    expect((await listVerses(ctx, { search: '요한복음' })).map((v) => v.book)).toEqual(['JHN']);
    expect((await listVerses(ctx, { search: 'genesis 1:1' })).map((v) => v.book)).toEqual(['GEN']);
    expect((await listVerses(ctx, { search: 'GRIEF' })).map((v) => v.book)).toEqual(['JHN']);
    expect(await listVerses(ctx, { search: '100%' })).toEqual([]);
  });

  it('filters by tag and source and sorts canonically or by recency', async () => {
    const ctx = await makeTestContext();
    await createVerse(ctx, input({ tags: ['a'] }));
    ctx.clock.advance(1000);
    await createVerse(ctx, input({ book: 'GEN', chapter: 1, verseStart: 1 }));
    expect((await listVerses(ctx)).map((v) => v.book)).toEqual(['GEN', 'JHN']);
    expect((await listVerses(ctx, { sort: 'recent' })).map((v) => v.book)).toEqual(['GEN', 'JHN']);
    expect((await listVerses(ctx, { tag: 'a' })).map((v) => v.book)).toEqual(['JHN']);
    expect(await listVerses(ctx, { filter: 'pack' })).toEqual([]);
    expect(await listVerses(ctx, { filter: 'user' })).toHaveLength(2);
  });

  it('updates keep review progress and remove cards for a deleted language', async () => {
    const ctx = await makeTestContext();
    const p = await createProfile(ctx, 'A');
    const v = await createVerse(ctx, input({ textKo: '더미' }));
    await startLearning(ctx, p.id, v);
    await ctx.db.run("UPDATE cards SET reps = 3 WHERE lang = 'en'");
    await updateVerse(ctx, v.id, input({ textKo: '', textEn: 'Jesus wept!', tags: ['x'] }));
    const cards = await cardsForVerse(ctx, p.id, v.id);
    expect(cards.map((c) => [c.lang, c.reps])).toEqual([['en', 3]]);
    expect((await getVerse(ctx, v.id))!.tags).toEqual(['x']);
    await expect(updateVerse(ctx, 'missing', input())).rejects.toBeInstanceOf(VerseNotFoundError);
  });

  it('keeps pack verse reference and English text read-only', async () => {
    const ctx = await makeTestContext();
    await ctx.db.run("INSERT INTO installed_packs VALUES ('p', 1, 0)");
    await ctx.db.run(
      "INSERT INTO verses (id, book, chapter, verse_start, canon_key, text_en, source, pack_id, created_at, updated_at) VALUES ('p:JHN.11.35', 'JHN', 11, 35, 0, 'Jesus wept.', 'pack', 'p', 0, 0)",
    );
    const updated = await updateVerse(
      ctx,
      'p:JHN.11.35',
      input({ book: 'GEN', textEn: 'Changed', textKo: '사용자 입력' }),
    );
    expect(updated).toMatchObject({ book: 'JHN', textEn: 'Jesus wept.', textKo: '사용자 입력' });
  });

  it('delete cascades to cards, logs, tags and family assignments', async () => {
    const ctx = await makeTestContext();
    const p = await createProfile(ctx, 'A');
    const v = await createVerse(ctx, input({ tags: ['solo'] }));
    await startLearning(ctx, p.id, v);
    await assignWeeklyVerse(ctx, v.id, 1);
    await deleteVerse(ctx, v.id);
    expect(await learningCount(ctx, p.id)).toBe(0);
    expect(await listTags(ctx)).toEqual([]);
    expect(await listAssignments(ctx)).toEqual([]);
  });

  it('emits change events', async () => {
    const ctx = await makeTestContext();
    const topics: DataTopic[] = [];
    const off = subscribe((t) => topics.push(t));
    await createVerse(ctx, input());
    off();
    await createVerse(ctx, input());
    expect(topics).toEqual(['verses']);
  });
});

describe('cards', () => {
  it('startLearning creates one card per available language, idempotently, due today', async () => {
    const ctx = await makeTestContext();
    const p = await createProfile(ctx, 'A');
    const v = await createVerse(ctx, input({ textKo: '더미' }));
    expect(await startLearning(ctx, p.id, v)).toBe(2);
    expect(await startLearning(ctx, p.id, v)).toBe(0);
    const cards = await cardsForVerse(ctx, p.id, v.id);
    expect(cards.map((c) => [c.lang, c.dueDate, c.efMilli])).toEqual([
      ['en', '2026-09-25', 2500],
      ['ko', '2026-09-25', 2500],
    ]);
  });

  it('counts and orders due cards, excluding suspended and future cards', async () => {
    const ctx = await makeTestContext();
    const p = await createProfile(ctx, 'A');
    const v1 = await createVerse(ctx, input());
    const v2 = await createVerse(ctx, input({ book: 'GEN', chapter: 1, verseStart: 1 }));
    const v3 = await createVerse(ctx, input({ book: 'PSA', chapter: 23, verseStart: 1 }));
    for (const v of [v1, v2, v3]) await startLearning(ctx, p.id, v);
    await ctx.db.run("UPDATE cards SET due_date = '2026-09-20' WHERE verse_id = ?", [v2.id]);
    await ctx.db.run("UPDATE cards SET due_date = '2026-09-26' WHERE verse_id = ?", [v3.id]);
    expect(await dueCount(ctx, p.id, '2026-09-25')).toBe(2);
    expect((await dueQueue(ctx, p.id, '2026-09-25', 10)).map((q) => q.verse.book)).toEqual([
      'GEN',
      'JHN',
    ]);
    expect(await dueQueue(ctx, p.id, '2026-09-25', 1)).toHaveLength(1);
    const [first] = await cardsForVerse(ctx, p.id, v1.id);
    await setSuspended(ctx, first!.id, true);
    expect(await dueCount(ctx, p.id, '2026-09-25')).toBe(1);
    expect(await dueQueue(ctx, 'nobody', '2026-09-25', 10)).toEqual([]);
  });

  it('stores cloze level within 1..5 and loads card with verse', async () => {
    const ctx = await makeTestContext();
    const p = await createProfile(ctx, 'A');
    const v = await createVerse(ctx, input());
    await startLearning(ctx, p.id, v);
    const [card] = await cardsForVerse(ctx, p.id, v.id);
    await setClozeLevel(ctx, card!.id, 9);
    expect((await getCardWithVerse(ctx, card!.id))!.card.clozeLevel).toBe(5);
    await setClozeLevel(ctx, card!.id, 0);
    expect((await getCardWithVerse(ctx, card!.id))!.card.clozeLevel).toBe(1);
    await deleteCard(ctx, card!.id);
    expect(await getCardWithVerse(ctx, card!.id)).toBeNull();
  });

  it('uses the due-card index for the badge query', async () => {
    const ctx = await makeTestContext();
    const plan = await ctx.db.all<{ detail: string }>(
      'EXPLAIN QUERY PLAN SELECT COUNT(*) FROM cards WHERE profile_id = ? AND suspended = 0 AND due_date <= ?',
      ['p', '2026-09-25'],
    );
    expect(plan.map((r) => r.detail).join(' ')).toContain('idx_cards_due');
  });
});

describe('family', () => {
  it('assigns this week’s verse and creates cards for every profile', async () => {
    const ctx = await makeTestContext();
    const a = await createProfile(ctx, 'A');
    const b = await createProfile(ctx, 'B');
    const v = await createVerse(ctx, input());
    expect(await assignWeeklyVerse(ctx, v.id, 1)).toBe('2026-09-21');
    expect(await learningCount(ctx, a.id)).toBe(1);
    expect(await learningCount(ctx, b.id)).toBe(1);
    await expect(assignWeeklyVerse(ctx, 'missing', 1)).rejects.toThrow('Verse not found');
  });

  it('toggles member checks and clears them when the verse changes', async () => {
    const ctx = await makeTestContext();
    const a = await createProfile(ctx, 'A');
    const v1 = await createVerse(ctx, input());
    const v2 = await createVerse(ctx, input({ book: 'GEN', chapter: 1, verseStart: 1 }));
    const week = await assignWeeklyVerse(ctx, v1.id, 1);
    expect(await toggleCheck(ctx, week, a.id)).toBe(true);
    expect((await listChecks(ctx, week)).map((c) => c.profileId)).toEqual([a.id]);
    expect(await toggleCheck(ctx, week, a.id)).toBe(false);
    await toggleCheck(ctx, week, a.id);
    await assignWeeklyVerse(ctx, v1.id, 1);
    expect(await listChecks(ctx, week)).toHaveLength(1);
    await assignWeeklyVerse(ctx, v2.id, 1);
    expect(await listChecks(ctx, week)).toHaveLength(0);
    await clearWeeklyVerse(ctx, week);
    expect(await listAssignments(ctx)).toEqual([]);
  });

  it('carries the verse over when the week start changes', async () => {
    const ctx = await makeTestContext();
    await createProfile(ctx, 'A');
    const v = await createVerse(ctx, input());
    await assignWeeklyVerse(ctx, v.id, 1);
    await changeWeekStart(ctx, 1, 0);
    expect((await loadSettings(ctx.db))['family.weekStartsOn']).toBe(0);
    expect((await listAssignments(ctx)).map((a) => a.weekStart)).toEqual([
      '2026-09-21',
      '2026-09-20',
    ]);
    ctx.clock.advance(7 * DAY);
    await changeWeekStart(ctx, 0, 1);
    expect(await listAssignments(ctx)).toHaveLength(2);
  });
});
