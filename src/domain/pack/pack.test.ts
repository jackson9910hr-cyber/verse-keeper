import { validatePack } from './pack';

const pack = () => ({
  packId: 'test-pack',
  version: 1,
  translation: {
    code: 'WEB',
    name: 'World English Bible',
    license: 'Public Domain',
    licenseNote: 'note',
    source: 'https://ebible.org/web/',
    retrievedAt: '2026-09-25',
    sourceSha256: 'a'.repeat(64),
  },
  verses: [
    {
      id: 'test-pack:JHN.11.35',
      book: 'JHN',
      chapter: 11,
      verseStart: 35,
      verseEnd: null,
      textEn: 'Jesus wept.',
      tags: ['comfort'],
    },
  ],
});

describe('validatePack', () => {
  it('accepts a valid WEB pack', () => {
    expect(validatePack(pack()).ok).toBe(true);
  });
  it('rejects non-public-domain translations and licenses', () => {
    expect(
      validatePack({ ...pack(), translation: { ...pack().translation, code: 'NIV' } }),
    ).toEqual({ ok: false, path: 'pack.translation.code' });
    expect(
      validatePack({ ...pack(), translation: { ...pack().translation, license: 'CC-BY' } }),
    ).toEqual({
      ok: false,
      path: 'pack.translation.license',
    });
  });
  it('rejects duplicate or foreign ids and bad references', () => {
    const p = pack();
    p.verses.push({ ...p.verses[0]! });
    expect(validatePack(p)).toEqual({ ok: false, path: 'pack.verses[1].id' });
    const q = pack();
    q.verses[0]!.id = 'other:JHN.11.35';
    expect(validatePack(q)).toEqual({ ok: false, path: 'pack.verses[0].id' });
    const r = pack();
    r.verses[0]!.chapter = 99;
    expect(validatePack(r)).toEqual({ ok: false, path: 'pack.verses[0].chapter' });
  });
  it('rejects non-objects', () => {
    expect(validatePack(null)).toEqual({ ok: false, path: 'pack' });
  });
});
