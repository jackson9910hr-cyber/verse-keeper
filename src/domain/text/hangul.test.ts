import { choseongOf, isHangulSyllable } from './hangul';

describe('hangul', () => {
  it('detects precomposed syllables', () => {
    expect(isHangulSyllable('가')).toBe(true);
    expect(isHangulSyllable('힣')).toBe(true);
    expect(isHangulSyllable('ㄱ')).toBe(false);
    expect(isHangulSyllable('A')).toBe(false);
    expect(isHangulSyllable('')).toBe(false);
  });
  it('extracts choseong including double consonants', () => {
    expect(choseongOf('태')).toBe('ㅌ');
    expect(choseongOf('까')).toBe('ㄲ');
    expect(choseongOf('아')).toBe('ㅇ');
    expect(choseongOf('힣')).toBe('ㅎ');
  });
  it('returns non-syllables unchanged', () => {
    expect(choseongOf('ㄱ')).toBe('ㄱ');
    expect(choseongOf('A')).toBe('A');
  });
});
