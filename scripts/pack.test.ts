import { validatePack } from '@/domain/pack/pack';

import pack from '../assets/packs/web-core-50.json';
import { CORE_50, PACK_ID, extractVerse, parseRef } from './build-pack';

describe('bundled pack web-core-50', () => {
  it('is a valid public-domain WEB pack with exactly the 50 spec verses', () => {
    const r = validatePack(pack);
    expect(r.ok).toBe(true);
    expect(pack.packId).toBe(PACK_ID);
    expect(pack.translation).toMatchObject({ code: 'WEB', license: 'Public Domain' });
    expect(
      pack.verses.map(
        (v) => `${v.book} ${v.chapter}:${v.verseStart}${v.verseEnd ? `-${v.verseEnd}` : ''}`,
      ),
    ).toEqual(CORE_50.map(([ref]) => ref));
  });

  it('has normalized whitespace and non-empty tags', () => {
    for (const v of pack.verses) {
      expect(v.textEn).toBe(v.textEn.replace(/\s+/g, ' ').trim());
      expect(v.tags.length).toBeGreaterThan(0);
    }
  });
});

describe('build-pack helpers', () => {
  it('parses references', () => {
    expect(parseRef('PSA 23:1-3')).toEqual({
      book: 'PSA',
      chapter: 23,
      verseStart: 1,
      verseEnd: 3,
    });
    expect(() => parseRef('John 3:16')).toThrow('Bad reference');
  });
  it('joins verse segments and skips headers', () => {
    const entries = [
      { type: 'header', value: 'A Psalm' },
      { type: 'line text', chapterNumber: 1, verseNumber: 1, value: 'Line one  ' },
      { type: 'line text', chapterNumber: 1, verseNumber: 1, value: ' line two. ' },
    ];
    expect(extractVerse(entries, 1, 1)).toBe('Line one line two.');
    expect(() => extractVerse(entries, 1, 2)).toThrow('Verse not found');
  });
});
