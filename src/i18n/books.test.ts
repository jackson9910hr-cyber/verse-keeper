import { BOOKS } from '@/domain/bible/books';

import { BOOK_NAMES, bookName, formatReference } from './books';

describe('book names', () => {
  it('has a ko and en name for every book', () => {
    for (const b of BOOKS) {
      expect(BOOK_NAMES.ko[b.code]).toBeTruthy();
      expect(BOOK_NAMES.en[b.code]).toBeTruthy();
    }
    expect(bookName('JHN', 'ko')).toBe('요한복음');
    expect(bookName('REV', 'en')).toBe('Revelation');
    expect(bookName('XXX', 'en')).toBe('XXX');
  });
  it('formats references and ranges', () => {
    expect(formatReference({ book: 'JHN', chapter: 3, verseStart: 16, verseEnd: null }, 'ko')).toBe(
      '요한복음 3:16',
    );
    expect(formatReference({ book: 'PSA', chapter: 23, verseStart: 1, verseEnd: 3 }, 'en')).toBe(
      'Psalms 23:1-3',
    );
    expect(formatReference({ book: 'PSA', chapter: 23, verseStart: 1, verseEnd: 1 }, 'en')).toBe(
      'Psalms 23:1',
    );
  });
});
