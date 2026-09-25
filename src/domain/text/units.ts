/** Groups tokens into display units: optional leading punctuation + word + trailing punctuation. */
import type { Token, WordToken } from './tokenize';

export interface WordUnit {
  key: string;
  before: string;
  word: WordToken | null;
  after: string;
}

export function groupUnits(tokens: readonly Token[]): WordUnit[] {
  const units: WordUnit[] = [];
  let current: WordUnit | null = null;

  for (const t of tokens) {
    if (t.kind === 'space') {
      if (current) units.push(current);
      current = null;
    } else if (t.kind === 'word') {
      if (current?.word) units.push(current);
      if (current && !current.word) current.word = t;
      else current = { key: `u${t.start}`, before: '', word: t, after: '' };
    } else if (current?.word) {
      current.after += t.text;
    } else if (current) {
      current.before += t.text;
    } else {
      current = { key: `u${t.start}`, before: t.text, word: null, after: '' };
    }
  }
  if (current) units.push(current);
  return units;
}
