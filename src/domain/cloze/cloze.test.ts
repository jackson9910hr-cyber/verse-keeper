import { tokenize, wordTokens } from '../text/tokenize';
import {
  LEVEL_PCT,
  blankCount,
  generateCloze,
  isFunctionWord,
  normalizeAnswer,
  isCorrectAnswer,
} from './cloze';
import { fnv1a32, mulberry32, shuffle } from './rng';

// WEB John 3:16 (public domain)
const JOHN_3_16 =
  'For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.';

describe('rng', () => {
  it('fnv1a32 is stable', () => {
    expect(fnv1a32('')).toBe(0x811c9dc5);
    expect(fnv1a32('a')).toBe(0xe40c292c);
  });
  it('mulberry32 is deterministic and in [0,1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
  it('shuffle is a permutation and does not mutate', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input, mulberry32(7));
    expect([...out].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('blankCount', () => {
  it('uses integer percent math (no float drift)', () => {
    expect(LEVEL_PCT).toEqual([20, 40, 60, 80, 100]);
    expect(blankCount(5, 3)).toBe(3); // 0.6*5 would be 3.0000000000000004 -> 4
    expect(blankCount(10, 1)).toBe(2);
    expect(blankCount(7, 1)).toBe(2); // ceil(1.4)
  });
  it('is 0 for no words and at least 1 otherwise', () => {
    expect(blankCount(0, 5)).toBe(0);
    expect(blankCount(1, 1)).toBe(1);
  });
  it('hides everything at the max level', () => {
    expect(blankCount(26, 5)).toBe(26);
  });
});

describe('generateCloze', () => {
  const opts = { seed: 'card-1|session-1', contentFirst: false, lang: 'en' as const };

  it('is reproducible for the same seed', () => {
    const a = generateCloze(JOHN_3_16, { ...opts, level: 3 });
    const b = generateCloze(JOHN_3_16, { ...opts, level: 3 });
    expect(a.hidden).toEqual(b.hidden);
  });

  it('differs for a different seed', () => {
    const a = generateCloze(JOHN_3_16, { ...opts, level: 2 });
    const b = generateCloze(JOHN_3_16, { ...opts, seed: 'card-1|session-2', level: 2 });
    expect(a.hidden).not.toEqual(b.hidden);
  });

  it('hides the spec count of words and never punctuation', () => {
    const r = generateCloze(JOHN_3_16, { ...opts, level: 1 });
    const words = wordTokens(r.tokens);
    expect(r.hidden.size).toBe(Math.ceil(words.length / 5));
    for (const t of r.tokens) if (t.kind !== 'word') expect(r.isHidden(t)).toBe(false);
  });

  it('levels are nested: hidden(L) ⊆ hidden(L+1)', () => {
    for (let level = 1; level < 5; level++) {
      const lo = generateCloze(JOHN_3_16, { ...opts, level: level as 1 | 2 | 3 | 4 });
      const hi = generateCloze(JOHN_3_16, { ...opts, level: (level + 1) as 2 | 3 | 4 | 5 });
      for (const i of lo.hidden) expect(hi.hidden.has(i)).toBe(true);
    }
  });

  it('level 5 hides every word', () => {
    const r = generateCloze(JOHN_3_16, { ...opts, level: 5 });
    expect(r.hidden.size).toBe(wordTokens(r.tokens).length);
  });

  it('content-first hides content words before function words', () => {
    const r = generateCloze(JOHN_3_16, { ...opts, contentFirst: true, level: 2 });
    const hiddenWords = wordTokens(r.tokens).filter((w) => r.hidden.has(w.index));
    expect(hiddenWords.every((w) => !isFunctionWord(w))).toBe(true);
  });

  it('content-first falls back to function words when only those remain', () => {
    const r = generateCloze('and the of', { ...opts, contentFirst: true, level: 1 });
    expect(r.hidden.size).toBe(1);
  });

  it('handles empty text and a single word', () => {
    expect(generateCloze('', { ...opts, level: 3 }).hidden.size).toBe(0);
    expect(generateCloze('Amen.', { ...opts, level: 1 }).hidden).toEqual(new Set([0]));
  });

  it('works for Korean dummy text', () => {
    const r = generateCloze('우리는 매일 아침 함께 걷는다.', { ...opts, lang: 'ko', level: 2 });
    expect(r.hidden.size).toBe(2);
  });
});

describe('isFunctionWord', () => {
  const w = (s: string) => wordTokens(tokenize(s))[0]!;
  it('uses the English stopword list case-insensitively', () => {
    expect(isFunctionWord(w('The'))).toBe(true);
    expect(isFunctionWord(w('loved'))).toBe(false);
  });
  it('treats 1-syllable and listed Korean words as function words', () => {
    expect(isFunctionWord(w('그'))).toBe(true);
    expect(isFunctionWord(w('그러므로'))).toBe(true);
    expect(isFunctionWord(w('사랑'))).toBe(false);
  });
  it('treats numbers as content', () => {
    expect(isFunctionWord(w('3,000'))).toBe(false);
  });
});

describe('answers', () => {
  it('normalizes case, curly apostrophes and edge punctuation', () => {
    expect(normalizeAnswer('  “Lord’s,” ')).toBe("lord's");
  });
  it('requires an exact match after normalization', () => {
    expect(isCorrectAnswer('world', 'World,')).toBe(true);
    expect(isCorrectAnswer('word', 'world')).toBe(false);
    expect(isCorrectAnswer('사랑을', '사랑을')).toBe(true);
    expect(isCorrectAnswer('사랑', '사랑을')).toBe(false);
  });
});
