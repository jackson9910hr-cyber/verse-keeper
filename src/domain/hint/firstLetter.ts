/** First-letter hints — docs/algorithms.md §4. */
import { choseongOf, isHangulSyllable } from '../text/hangul';
import { tokenize, type Token, type WordToken } from '../text/tokenize';

export type KoHintRule = 'syllable' | 'choseong';

export interface HintOptions {
  koRule: KoHintRule;
  /** true: one placeholder per hidden character; false: a single ellipsis. */
  showLength: boolean;
}

export interface HintToken {
  token: Token;
  display: string;
}

function mask(chars: string[], placeholder: string, showLength: boolean): string {
  const [first, ...rest] = chars;
  if (first === undefined) return '';
  if (rest.length === 0) return first;
  return first + (showLength ? placeholder.repeat(rest.length) : '…');
}

export function hintWord(word: WordToken, opts: HintOptions): string {
  const chars = [...word.text];
  if (word.script === 'hangul' && isHangulSyllable(chars[0] ?? '')) {
    if (opts.koRule === 'choseong') return chars.map(choseongOf).join('');
    return mask(chars, '○', opts.showLength);
  }
  return mask(chars, '_', opts.showLength);
}

export function firstLetterHint(text: string, opts: HintOptions): HintToken[] {
  return tokenize(text).map((token) => ({
    token,
    display: token.kind === 'word' ? hintWord(token, opts) : token.text,
  }));
}
