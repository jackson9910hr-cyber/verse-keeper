import { firstLetterHint, hintWord } from './firstLetter';
import { tokenize, wordTokens } from '../text/tokenize';

const render = (text: string, opts: Parameters<typeof firstLetterHint>[1]) =>
  firstLetterHint(text, opts)
    .map((t) => t.display)
    .join('');
const w = (s: string) => wordTokens(tokenize(s))[0]!;

describe('firstLetterHint — English', () => {
  it('shows the first letter and underscores, keeping punctuation', () => {
    expect(render('For God so loved the world,', { koRule: 'syllable', showLength: true })).toBe(
      'F__ G__ s_ l____ t__ w____,',
    );
  });
  it('hides the length with an ellipsis', () => {
    expect(render('For God so loved.', { koRule: 'syllable', showLength: false })).toBe(
      'F… G… s… l….',
    );
  });
  it('keeps one-letter words intact', () => {
    expect(hintWord(w('a'), { koRule: 'syllable', showLength: true })).toBe('a');
    expect(hintWord(w('I'), { koRule: 'syllable', showLength: false })).toBe('I');
  });
  it('handles numbers', () => {
    expect(hintWord(w('3,000'), { koRule: 'syllable', showLength: true })).toBe('3____');
  });
  it('returns nothing for empty text', () => {
    expect(firstLetterHint('', { koRule: 'syllable', showLength: true })).toEqual([]);
  });
});

describe('firstLetterHint — Korean', () => {
  it('syllable rule: first syllable + circles', () => {
    expect(render('태초에 하나님이', { koRule: 'syllable', showLength: true })).toBe('태○○ 하○○○');
  });
  it('syllable rule with hidden length', () => {
    expect(render('태초에', { koRule: 'syllable', showLength: false })).toBe('태…');
  });
  it('choseong rule maps every syllable', () => {
    expect(render('태초에 하나님이.', { koRule: 'choseong', showLength: true })).toBe(
      'ㅌㅊㅇ ㅎㄴㄴㅇ.',
    );
  });
  it('mixed eojeol follows the first character script', () => {
    expect(hintWord(w('Christ께서'), { koRule: 'choseong', showLength: true })).toBe('C_______');
    expect(hintWord(w('예수Christ'), { koRule: 'choseong', showLength: true })).toBe('ㅇㅅChrist');
  });
  it('single syllable stays visible under the syllable rule', () => {
    expect(hintWord(w('곧'), { koRule: 'syllable', showLength: true })).toBe('곧');
  });
});
