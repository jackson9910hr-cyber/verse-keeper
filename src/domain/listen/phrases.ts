/** Listen mode: phrase splitting, playback plan and TTS boundary mapping — docs/algorithms.md §5. */
import { normalizeText, tokenize, type Token } from '../text/tokenize';

export const MAX_WORDS_PER_PHRASE = 12;
const BOUNDARY_RE = /[,;:.!?…—·，。、！？]/u;

export interface Phrase {
  text: string;
  /** Offset of the phrase in the normalized verse text. */
  start: number;
  end: number;
  /** Word index range [wordStart, wordEnd). */
  wordStart: number;
  wordEnd: number;
}

export function splitPhrases(input: string): Phrase[] {
  const text = normalizeText(input);
  const phrases: Phrase[] = [];
  let current: Phrase | null = null;
  let words = 0;

  const close = () => {
    if (!current) return;
    current.text = text.slice(current.start, current.end);
    const previous = phrases.at(-1);
    if (words === 0 && previous) {
      previous.end = current.end;
      previous.text = text.slice(previous.start, previous.end);
    } else {
      phrases.push(current);
    }
    current = null;
    words = 0;
  };

  let wordIndex = 0;
  for (const token of tokenize(text)) {
    if (token.kind === 'space') continue;
    if (token.kind === 'word' && words === MAX_WORDS_PER_PHRASE) close();
    const end = token.start + token.text.length;
    if (!current)
      current = { text: '', start: token.start, end, wordStart: wordIndex, wordEnd: wordIndex };
    current.end = end;
    if (token.kind === 'word') {
      wordIndex++;
      words++;
      current.wordEnd = wordIndex;
    } else if (BOUNDARY_RE.test(token.text)) {
      close();
    }
  }
  close();
  return phrases;
}

export interface PlaybackStep {
  phraseIndex: number;
  iteration: number;
}

export function playbackPlan(phraseCount: number, repeat: number): PlaybackStep[] {
  const n = Math.min(5, Math.max(1, Math.floor(repeat)));
  const plan: PlaybackStep[] = [];
  for (let p = 0; p < phraseCount; p++)
    for (let i = 0; i < n; i++) plan.push({ phraseIndex: p, iteration: i });
  return plan;
}

/** Word index for a character offset in the normalized text (last word starting at or before it), or -1. */
export function tokenAtOffset(tokens: readonly Token[], offset: number): number {
  let lo = 0;
  let hi = tokens.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (tokens[mid]!.start <= offset) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  for (let i = found; i >= 0; i--) {
    const t = tokens[i]!;
    if (t.kind === 'word') return t.index;
  }
  return -1;
}
