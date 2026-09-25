/**
 * Cloze (fill-in-the-blank) generator — docs/algorithms.md §3.
 * Word order is fixed per seed and independent of level, so hidden(L) ⊆ hidden(L+1).
 */
import { EN_STOPWORDS, KO_FUNCTION_WORDS } from '../text/stopwords';
import { tokenize, wordTokens, type Token, type WordToken } from '../text/tokenize';
import { fnv1a32, mulberry32, shuffle } from './rng';

export type ClozeLevel = 1 | 2 | 3 | 4 | 5;
export const LEVEL_PCT: readonly number[] = [20, 40, 60, 80, 100];
const PCT_BY_LEVEL: Record<ClozeLevel, number> = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };
export const MAX_LEVEL: ClozeLevel = 5;

export interface ClozeOptions {
  level: ClozeLevel;
  /** `${cardId}|${sessionSeed}` — must NOT include the level. */
  seed: string;
  contentFirst: boolean;
  lang: 'ko' | 'en';
}

export interface ClozeResult {
  tokens: Token[];
  /** Hidden word indices (WordToken.index). */
  hidden: Set<number>;
  isHidden(token: Token): boolean;
}

export function blankCount(wordCount: number, level: ClozeLevel): number {
  if (wordCount === 0) return 0;
  return Math.max(1, Math.ceil((PCT_BY_LEVEL[level] * wordCount) / 100));
}

export function isFunctionWord(word: WordToken): boolean {
  switch (word.script) {
    case 'hangul':
      return [...word.text].length === 1 || KO_FUNCTION_WORDS.has(word.text);
    case 'latin':
      return EN_STOPWORDS.has(word.text.toLowerCase().replace(/’/gu, "'"));
    default:
      return false;
  }
}

export function generateCloze(text: string, opts: ClozeOptions): ClozeResult {
  const tokens = tokenize(text);
  const words = wordTokens(tokens);
  let order = shuffle(words, mulberry32(fnv1a32(opts.seed)));
  if (opts.contentFirst) {
    order = [...order.filter((w) => !isFunctionWord(w)), ...order.filter(isFunctionWord)];
  }
  const hidden = new Set(order.slice(0, blankCount(words.length, opts.level)).map((w) => w.index));
  return {
    tokens,
    hidden,
    isHidden: (t) => t.kind === 'word' && hidden.has(t.index),
  };
}

const EDGE_PUNCT_RE = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

export function normalizeAnswer(input: string): string {
  return input.normalize('NFC').trim().toLowerCase().replace(/’/gu, "'").replace(EDGE_PUNCT_RE, '');
}

export function isCorrectAnswer(given: string, expected: string): boolean {
  return normalizeAnswer(given) === normalizeAnswer(expected);
}
