/** The 66-book Protestant canon (USFM codes, English versification). Display names live in i18n. */

export type Testament = 'OT' | 'NT';
export interface Book {
  code: string;
  order: number; // 1..66
  chapters: number;
  testament: Testament;
}

const RAW =
  'GEN 50,EXO 40,LEV 27,NUM 36,DEU 34,JOS 24,JDG 21,RUT 4,1SA 31,2SA 24,1KI 22,2KI 25,1CH 29,2CH 36,EZR 10,' +
  'NEH 13,EST 10,JOB 42,PSA 150,PRO 31,ECC 12,SNG 8,ISA 66,JER 52,LAM 5,EZK 48,DAN 12,HOS 14,JOL 3,AMO 9,' +
  'OBA 1,JON 4,MIC 7,NAM 3,HAB 3,ZEP 3,HAG 2,ZEC 14,MAL 4,' +
  'MAT 28,MRK 16,LUK 24,JHN 21,ACT 28,ROM 16,1CO 16,2CO 13,GAL 6,EPH 6,PHP 4,COL 4,1TH 5,2TH 3,1TI 6,2TI 4,' +
  'TIT 3,PHM 1,HEB 13,JAS 5,1PE 5,2PE 3,1JN 5,2JN 1,3JN 1,JUD 1,REV 22';

export const BOOKS: readonly Book[] = RAW.split(',').map((entry, i) => {
  const [code, chapters] = entry.split(' ') as [string, string];
  return { code, order: i + 1, chapters: Number(chapters), testament: i < 39 ? 'OT' : 'NT' };
});

const BY_CODE = new Map(BOOKS.map((b) => [b.code, b]));

export const bookByCode = (code: string): Book | undefined => BY_CODE.get(code);
export const isBookCode = (code: string): boolean => BY_CODE.has(code);

export interface Reference {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
}

export function canonKey(ref: Pick<Reference, 'book' | 'chapter' | 'verseStart'>): number {
  const order = bookByCode(ref.book)?.order ?? 99;
  return order * 1_000_000 + ref.chapter * 1_000 + ref.verseStart;
}

const isPositiveInt = (n: number) => Number.isInteger(n) && n >= 1;

/** Returns the names of invalid fields (empty when valid). Verse maxima are not checked (vary by translation). */
export function validateReference(ref: Reference): (keyof Reference)[] {
  const errors: (keyof Reference)[] = [];
  const book = bookByCode(ref.book);
  if (!book) errors.push('book');
  if (!isPositiveInt(ref.chapter) || (book && ref.chapter > book.chapters)) errors.push('chapter');
  if (!isPositiveInt(ref.verseStart) || ref.verseStart > 999) errors.push('verseStart');
  if (
    ref.verseEnd !== null &&
    (!isPositiveInt(ref.verseEnd) || ref.verseEnd < ref.verseStart || ref.verseEnd > 999)
  ) {
    errors.push('verseEnd');
  }
  return errors;
}
