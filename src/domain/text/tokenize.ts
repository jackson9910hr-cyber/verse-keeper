/**
 * Tokenizer — docs/algorithms.md §2. Korean is split into eojeol (whitespace units); no morphology.
 */
import { isHangulChar } from './hangul';

export type Script = 'hangul' | 'latin' | 'digit' | 'other';

export interface WordToken {
  kind: 'word';
  text: string;
  start: number;
  /** Position among word tokens only (0-based). */
  index: number;
  script: Script;
}
export interface PunctToken {
  kind: 'punct';
  text: string;
  start: number;
}
export interface SpaceToken {
  kind: 'space';
  text: string;
  start: number;
}
export type Token = WordToken | PunctToken | SpaceToken;

const WORD_RE = /[\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+|(?<=\p{N})[.,:]\p{N}+)*/gu;
const SPACE_RUN_RE = /\s+|\S+/gu;
const DIGIT_RE = /^\p{N}/u;
const LATIN_RE = /^\p{Script=Latin}/u;

export function normalizeText(text: string): string {
  return text.normalize('NFC').replace(/\s+/gu, ' ').trim();
}

export function scriptOf(word: string): Script {
  const first = String.fromCodePoint(word.codePointAt(0) ?? 0);
  if (isHangulChar(first)) return 'hangul';
  if (DIGIT_RE.test(first)) return 'digit';
  if (LATIN_RE.test(first)) return 'latin';
  return 'other';
}

function pushGap(tokens: Token[], text: string, gapStart: number): void {
  for (const m of text.matchAll(SPACE_RUN_RE)) {
    const kind = /^\s/u.test(m[0]) ? 'space' : 'punct';
    tokens.push({ kind, text: m[0], start: gapStart + m.index });
  }
}

/** Tokenizes already-normalized text (call normalizeText first when the source is user input). */
export function tokenize(input: string): Token[] {
  const text = normalizeText(input);
  const tokens: Token[] = [];
  let cursor = 0;
  let index = 0;
  for (const m of text.matchAll(WORD_RE)) {
    if (m.index > cursor) pushGap(tokens, text.slice(cursor, m.index), cursor);
    tokens.push({
      kind: 'word',
      text: m[0],
      start: m.index,
      index: index++,
      script: scriptOf(m[0]),
    });
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) pushGap(tokens, text.slice(cursor), cursor);
  return tokens;
}

export function wordTokens(tokens: readonly Token[]): WordToken[] {
  return tokens.filter((t): t is WordToken => t.kind === 'word');
}
