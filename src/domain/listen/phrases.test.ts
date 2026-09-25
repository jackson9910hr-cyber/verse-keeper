import { playbackPlan, splitPhrases, tokenAtOffset } from './phrases';
import { tokenize } from '../text/tokenize';

// WEB Proverbs 3:5 (public domain)
const PRO_3_5 = 'Trust in Yahweh with all your heart, and don’t lean on your own understanding.';

describe('splitPhrases', () => {
  it('splits on punctuation and attaches it to the previous phrase', () => {
    expect(splitPhrases(PRO_3_5).map((p) => p.text)).toEqual([
      'Trust in Yahweh with all your heart,',
      'and don’t lean on your own understanding.',
    ]);
  });
  it('records offsets into the normalized text', () => {
    const [, second] = splitPhrases(PRO_3_5);
    expect(PRO_3_5.slice(second!.start, second!.start + second!.text.length)).toBe(second!.text);
  });
  it('splits long phrases every 12 words', () => {
    const text = Array.from({ length: 30 }, (_, i) => `w${i}`).join(' ');
    const phrases = splitPhrases(text);
    expect(phrases.map((p) => p.wordEnd - p.wordStart)).toEqual([12, 12, 6]);
  });
  it('handles Korean punctuation and empty input', () => {
    expect(splitPhrases('우리는 걷는다, 함께 걷는다。').map((p) => p.text)).toEqual([
      '우리는 걷는다,',
      '함께 걷는다。',
    ]);
    expect(splitPhrases('')).toEqual([]);
  });
  it('merges a trailing punctuation-only remainder into the previous phrase', () => {
    expect(splitPhrases('Amen. ”').map((p) => p.text)).toEqual(['Amen. ”']);
    expect(splitPhrases('“…”').map((p) => p.text)).toEqual(['“…”']);
  });
});

describe('playbackPlan', () => {
  it('repeats each phrase N times in order', () => {
    expect(playbackPlan(2, 2)).toEqual([
      { phraseIndex: 0, iteration: 0 },
      { phraseIndex: 0, iteration: 1 },
      { phraseIndex: 1, iteration: 0 },
      { phraseIndex: 1, iteration: 1 },
    ]);
  });
  it('clamps repeat to 1..5', () => {
    expect(playbackPlan(1, 0)).toHaveLength(1);
    expect(playbackPlan(1, 9)).toHaveLength(5);
  });
});

describe('tokenAtOffset', () => {
  const tokens = tokenize(PRO_3_5);
  it('maps a char offset to the word index', () => {
    expect(tokenAtOffset(tokens, 0)).toBe(0);
    expect(tokenAtOffset(tokens, 6)).toBe(1); // "in"
    expect(tokenAtOffset(tokens, PRO_3_5.indexOf('heart') + 2)).toBe(6);
  });
  it('maps offsets inside spaces/punctuation to the previous word', () => {
    expect(tokenAtOffset(tokens, PRO_3_5.indexOf(',') + 1)).toBe(6);
  });
  it('returns -1 before the first word or for no words', () => {
    expect(tokenAtOffset(tokenize('“Hi'), 0)).toBe(-1);
    expect(tokenAtOffset([], 3)).toBe(-1);
  });
});
