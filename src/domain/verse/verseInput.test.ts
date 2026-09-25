import { MAX_TAGS, MAX_TEXT_LENGTH, normalizeTags, validateVerseInput } from './verseInput';

const base = {
  book: 'JHN',
  chapter: 3,
  verseStart: 16,
  verseEnd: null,
  textKo: '',
  textEn: 'For God so loved the world.',
  tags: [],
};

describe('validateVerseInput', () => {
  it('accepts a verse with one text', () => {
    const r = validateVerseInput(base);
    expect(r.ok).toBe(true);
    if (r.ok)
      expect(r.value).toMatchObject({ textKo: null, textEn: 'For God so loved the world.' });
  });
  it('requires at least one non-blank text', () => {
    const r = validateVerseInput({ ...base, textEn: '   ', textKo: '\n' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.text).toBe('textRequired');
  });
  it('limits text length', () => {
    const r = validateVerseInput({ ...base, textKo: '가'.repeat(MAX_TEXT_LENGTH + 1) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.textKo).toBe('tooLong');
  });
  it('reports reference errors', () => {
    const r = validateVerseInput({ ...base, verseEnd: 3 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.verseEnd).toBe('invalid');
  });
  it('normalizes text to NFC and trims', () => {
    const r = validateVerseInput({ ...base, textKo: `  ${'태초에'.normalize('NFD')}  ` });
    expect(r.ok && r.value.textKo).toBe('태초에');
  });
});

describe('normalizeTags', () => {
  it('trims, dedupes case-insensitively and drops empties', () => {
    expect(normalizeTags([' Love ', 'love', '', 'Faith', 'LOVE'])).toEqual(['Love', 'Faith']);
  });
  it('limits the count and length', () => {
    expect(normalizeTags(Array.from({ length: 15 }, (_, i) => `t${i}`))).toHaveLength(MAX_TAGS);
    expect(normalizeTags(['x'.repeat(30)])[0]).toHaveLength(20);
  });
});
