import { parseBackup } from '@/domain/backup/backup';
import type { VersePack } from '@/domain/pack/pack';
import { validateVerseInput } from '@/domain/verse/verseInput';

import { cardsForVerse, dueCount, startLearning } from '../repositories/cards';
import { assignWeeklyVerse, toggleCheck } from '../repositories/family';
import { createProfile, listProfiles } from '../repositories/profiles';
import { createVerse, getVerse, listVerses, updateVerse } from '../repositories/verses';
import { loadSettings, saveSetting } from '../settings';
import { DAY, makeTestContext } from '../testing/context';
import { completeOnboarding, resetAllData, resolveActiveProfile } from './app';
import { exportBackup, importBackup } from './backup';
import { installPack } from './packs';
import { CardNotFoundError, gradeCard, streakFor } from './review';

const verseInput = (textKo = '') => {
  const r = validateVerseInput({
    book: 'JHN',
    chapter: 11,
    verseStart: 35,
    verseEnd: null,
    textKo,
    textEn: 'Jesus wept.',
    tags: ['t'],
  });
  if (!r.ok) throw new Error('invalid');
  return r.value;
};

const pack = (version = 1, textEn = 'Jesus wept.'): VersePack => ({
  packId: 'web-test',
  version,
  translation: {
    code: 'WEB',
    name: 'World English Bible',
    license: 'Public Domain',
    licenseNote: 'n',
    source: 'https://ebible.org/web/',
    retrievedAt: '2026-09-25',
    sourceSha256: 'a'.repeat(64),
  },
  verses: [
    {
      id: 'web-test:JHN.11.35',
      book: 'JHN',
      chapter: 11,
      verseStart: 35,
      verseEnd: null,
      textEn,
      tags: ['comfort'],
    },
  ],
});

const noEffects = { cancelReminders: async () => undefined };

async function learner() {
  const ctx = await makeTestContext();
  const profileId = await completeOnboarding(ctx, 'Me');
  const verse = await createVerse(ctx, verseInput());
  await startLearning(ctx, profileId, verse);
  const [card] = await cardsForVerse(ctx, profileId, verse.id);
  return { ctx, profileId, verse, card: card! };
}

describe('gradeCard', () => {
  it('schedules a due card and logs a review', async () => {
    const { ctx, profileId, card } = await learner();
    const r = await gradeCard(ctx, { cardId: card.id, grade: 'good', mode: 'cloze' });
    expect(r.kind).toBe('review');
    expect(r.card).toMatchObject({
      reps: 1,
      intervalDays: 1,
      dueDate: '2026-09-26',
      lastReviewedOn: '2026-09-25',
    });
    expect(await dueCount(ctx, profileId, '2026-09-25')).toBe(0);
    const logs = await ctx.db.all<{ kind: string; local_date: string; new_interval: number }>(
      'SELECT kind, local_date, new_interval FROM review_logs',
    );
    expect(logs).toEqual([{ kind: 'review', local_date: '2026-09-25', new_interval: 1 }]);
  });

  it('logs practice without rescheduling a card that is not due', async () => {
    const { ctx, card } = await learner();
    await gradeCard(ctx, { cardId: card.id, grade: 'good', mode: 'cloze' });
    const r = await gradeCard(ctx, { cardId: card.id, grade: 'easy', mode: 'listen' });
    expect(r.kind).toBe('practice');
    expect(r.card.dueDate).toBe('2026-09-26');
  });

  it('reschedules on an in-session relearn after "again"', async () => {
    const { ctx, card } = await learner();
    await gradeCard(ctx, { cardId: card.id, grade: 'again', mode: 'cloze' });
    const r = await gradeCard(ctx, {
      cardId: card.id,
      grade: 'good',
      mode: 'cloze',
      relearn: true,
    });
    expect(r).toMatchObject({
      kind: 'review',
      card: { reps: 1, lapses: 1, dueDate: '2026-09-26' },
    });
  });

  it('uses the local date across midnight (KST)', async () => {
    const { ctx, card } = await learner();
    ctx.clock.set(Date.UTC(2026, 8, 25, 14, 59, 59)); // 23:59:59 KST
    expect(
      (await gradeCard(ctx, { cardId: card.id, grade: 'good', mode: 'cloze' })).card.dueDate,
    ).toBe('2026-09-26');
    ctx.clock.set(Date.UTC(2026, 8, 25, 15, 0, 0)); // 00:00 KST next day → card is due again
    expect(
      (await gradeCard(ctx, { cardId: card.id, grade: 'good', mode: 'cloze' })).card.dueDate,
    ).toBe('2026-10-02');
  });

  it('throws for a missing card and leaves no log', async () => {
    const { ctx } = await learner();
    await expect(
      gradeCard(ctx, { cardId: 'nope', grade: 'good', mode: 'cloze' }),
    ).rejects.toBeInstanceOf(CardNotFoundError);
    expect(await ctx.db.all('SELECT * FROM review_logs')).toEqual([]);
  });
});

describe('streakFor', () => {
  it('counts consecutive study days per profile', async () => {
    const { ctx, profileId, card } = await learner();
    expect(await streakFor(ctx, profileId)).toEqual({
      current: 0,
      longest: 0,
      studiedToday: false,
    });
    await gradeCard(ctx, { cardId: card.id, grade: 'good', mode: 'cloze' });
    ctx.clock.advance(DAY);
    await gradeCard(ctx, { cardId: card.id, grade: 'good', mode: 'cloze' });
    expect(await streakFor(ctx, profileId)).toEqual({ current: 2, longest: 2, studiedToday: true });
    ctx.clock.advance(DAY);
    expect((await streakFor(ctx, profileId)).current).toBe(2);
    ctx.clock.advance(DAY);
    expect((await streakFor(ctx, profileId)).current).toBe(0);
    expect((await streakFor(ctx, 'someone-else')).current).toBe(0);
  });
});

describe('installPack', () => {
  it('installs idempotently', async () => {
    const ctx = await makeTestContext();
    expect(await installPack(ctx, pack())).toBe(true);
    expect(await installPack(ctx, pack())).toBe(false);
    const verses = await listVerses(ctx, { filter: 'pack' });
    expect(verses).toHaveLength(1);
    expect(verses[0]).toMatchObject({
      source: 'pack',
      labelEn: 'WEB',
      tags: ['comfort'],
      textKo: null,
    });
  });

  it('upgrades WEB text but keeps user Korean text and tags', async () => {
    const ctx = await makeTestContext();
    await installPack(ctx, pack());
    const id = 'web-test:JHN.11.35';
    const r = validateVerseInput({
      book: 'JHN',
      chapter: 11,
      verseStart: 35,
      verseEnd: null,
      textKo: '사용자 입력 더미',
      textEn: 'x',
      tags: ['mine'],
    });
    if (!r.ok) throw new Error('invalid');
    await updateVerse(ctx, id, r.value);
    expect(await installPack(ctx, pack(2, 'Jesus wept'))).toBe(true);
    expect(await getVerse(ctx, id)).toMatchObject({
      textEn: 'Jesus wept',
      textKo: '사용자 입력 더미',
      tags: ['mine'],
    });
    expect((await listVerses(ctx, { search: '사용자' })).length).toBe(1);
  });
});

describe('backup round trip', () => {
  it('exports, validates and restores everything except device-only settings', async () => {
    const { ctx, profileId, verse, card } = await learner();
    await installPack(ctx, pack());
    await createProfile(ctx, 'Kid');
    await gradeCard(ctx, { cardId: card.id, grade: 'good', mode: 'first_letter' });
    const week = await assignWeeklyVerse(ctx, verse.id, 1);
    await toggleCheck(ctx, week, profileId);
    await saveSetting(ctx.db, 'ui.theme', 'dark');
    await saveSetting(ctx.db, 'notify.enabled', true);

    const file = await exportBackup(ctx, '1.0.0');
    expect(file.data.settings['notify.enabled']).toBeUndefined();
    const parsed = parseBackup(JSON.stringify(file));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const target = await makeTestContext();
    await completeOnboarding(target, 'Other');
    await createVerse(target, verseInput('지워질 데이터'));
    expect(await importBackup(target, parsed.value, noEffects)).toEqual({ verses: 2, profiles: 2 });

    const again = await exportBackup(target, '1.0.0');
    expect(again.data).toEqual({ ...file.data, settings: { ...file.data.settings } });
    const s = await loadSettings(target.db);
    expect(s).toMatchObject({
      'ui.theme': 'dark',
      'notify.enabled': false,
      'onboarding.done': true,
      'profile.activeId': profileId,
    });
  });

  it('rolls back completely when restore fails', async () => {
    const { ctx } = await learner();
    const file = await exportBackup(ctx, '1.0.0');
    file.data.cards.push({ ...file.data.cards[0]! }); // duplicate primary key → SQLite error mid-restore
    const target = await makeTestContext();
    await completeOnboarding(target, 'Keep me');
    await expect(importBackup(target, file, noEffects)).rejects.toThrow();
    expect((await listProfiles(target)).map((p) => p.name)).toEqual(['Keep me']);
  });
});

describe('onboarding / reset', () => {
  it('completes onboarding once and resolves the active profile', async () => {
    const ctx = await makeTestContext();
    expect(await resolveActiveProfile(ctx)).toBeNull();
    const id = await completeOnboarding(ctx, 'Me');
    expect(await completeOnboarding(ctx, 'Again')).toBe(id);
    expect(await listProfiles(ctx)).toHaveLength(1);
    await ctx.db.run("UPDATE settings SET value = '\"ghost\"' WHERE key = 'profile.activeId'");
    expect(await resolveActiveProfile(ctx)).toBe(id);
    expect(await resolveActiveProfile(ctx)).toBe(id);
  });

  it('resetAllData wipes everything', async () => {
    const { ctx } = await learner();
    await resetAllData(ctx, noEffects);
    expect(await listProfiles(ctx)).toEqual([]);
    expect(await listVerses(ctx)).toEqual([]);
    expect((await loadSettings(ctx.db))['onboarding.done']).toBe(false);
  });
});

describe('device side effects on reset / import (reminders)', () => {
  it('resetAllData cancels scheduled reminders before wiping data', async () => {
    const { ctx } = await learner();
    const cancelReminders = jest.fn().mockResolvedValue(undefined);
    await resetAllData(ctx, { cancelReminders });
    expect(cancelReminders).toHaveBeenCalledTimes(1);
  });

  it('importBackup cancels scheduled reminders (notify.enabled is reset to false)', async () => {
    const { ctx } = await learner();
    const file = await exportBackup(ctx, '1.0.0');
    const cancelReminders = jest.fn().mockResolvedValue(undefined);
    await importBackup(ctx, file, { cancelReminders });
    expect(cancelReminders).toHaveBeenCalledTimes(1);
  });
});
