/** Validation for the add/edit verse form — docs/spec.md US-VC-1. */
import { validateReference, type Reference } from '../bible/books';

export const MAX_TEXT_LENGTH = 2000;
export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 20;

export interface VerseInput extends Reference {
  textKo: string;
  textEn: string;
  tags: string[];
}

export interface ValidVerse extends Reference {
  textKo: string | null;
  textEn: string | null;
  tags: string[];
}

export type VerseErrorCode = 'textRequired' | 'tooLong' | 'invalid';
export type VerseErrors = Partial<
  Record<
    'book' | 'chapter' | 'verseStart' | 'verseEnd' | 'text' | 'textKo' | 'textEn',
    VerseErrorCode
  >
>;

export type Result<T, E> = { ok: true; value: T } | { ok: false; errors: E };

const cleanText = (s: string) => {
  const t = s.normalize('NFC').trim();
  return t.length === 0 ? null : t;
};

export function normalizeTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = [...raw.normalize('NFC').trim()].slice(0, MAX_TAG_LENGTH).join('');
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length === MAX_TAGS) break;
  }
  return out;
}

export function validateVerseInput(input: VerseInput): Result<ValidVerse, VerseErrors> {
  const errors: VerseErrors = {};
  for (const field of validateReference(input)) errors[field] = 'invalid';
  const textKo = cleanText(input.textKo);
  const textEn = cleanText(input.textEn);
  if (!textKo && !textEn) errors.text = 'textRequired';
  if (textKo && textKo.length > MAX_TEXT_LENGTH) errors.textKo = 'tooLong';
  if (textEn && textEn.length > MAX_TEXT_LENGTH) errors.textEn = 'tooLong';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      book: input.book,
      chapter: input.chapter,
      verseStart: input.verseStart,
      verseEnd: input.verseEnd,
      textKo,
      textEn,
      tags: normalizeTags(input.tags),
    },
  };
}
