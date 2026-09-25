import { BOOKS, bookByCode, canonKey, isBookCode, validateReference } from './books';

describe('books', () => {
  it('has the 66 Protestant canon books in order', () => {
    expect(BOOKS).toHaveLength(66);
    expect(BOOKS[0]!.code).toBe('GEN');
    expect(BOOKS[38]!.code).toBe('MAL');
    expect(BOOKS[39]!.code).toBe('MAT');
    expect(BOOKS[65]!.code).toBe('REV');
    expect(BOOKS.filter((b) => b.testament === 'OT')).toHaveLength(39);
    expect(new Set(BOOKS.map((b) => b.code)).size).toBe(66);
  });
  it('knows chapter counts', () => {
    expect(bookByCode('PSA')!.chapters).toBe(150);
    expect(bookByCode('JUD')!.chapters).toBe(1);
    expect(BOOKS.reduce((n, b) => n + b.chapters, 0)).toBe(1189);
  });
  it('validates codes', () => {
    expect(isBookCode('JHN')).toBe(true);
    expect(isBookCode('XXX')).toBe(false);
  });
  it('builds a canonical sort key', () => {
    expect(canonKey({ book: 'GEN', chapter: 1, verseStart: 1 })).toBe(1_001_001);
    expect(canonKey({ book: 'JHN', chapter: 3, verseStart: 16 })).toBeGreaterThan(
      canonKey({ book: 'MAL', chapter: 4, verseStart: 6 }),
    );
  });
});

describe('validateReference', () => {
  it('accepts valid references and ranges', () => {
    expect(validateReference({ book: 'JHN', chapter: 3, verseStart: 16, verseEnd: null })).toEqual(
      [],
    );
    expect(validateReference({ book: 'PSA', chapter: 23, verseStart: 1, verseEnd: 3 })).toEqual([]);
  });
  it('rejects unknown books, chapter overflow, non-integers and reversed ranges', () => {
    expect(validateReference({ book: 'ZZZ', chapter: 1, verseStart: 1, verseEnd: null })).toContain(
      'book',
    );
    expect(validateReference({ book: 'JUD', chapter: 2, verseStart: 1, verseEnd: null })).toContain(
      'chapter',
    );
    expect(validateReference({ book: 'JHN', chapter: 0, verseStart: 1, verseEnd: null })).toContain(
      'chapter',
    );
    expect(
      validateReference({ book: 'JHN', chapter: 3, verseStart: 1.5, verseEnd: null }),
    ).toContain('verseStart');
    expect(validateReference({ book: 'JHN', chapter: 3, verseStart: 16, verseEnd: 15 })).toContain(
      'verseEnd',
    );
  });
});
