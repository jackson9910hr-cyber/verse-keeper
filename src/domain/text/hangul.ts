const SYLLABLE_FIRST = 0xac00;
const SYLLABLE_LAST = 0xd7a3;
const SYLLABLES_PER_CHOSEONG = 588; // 21 medials × 28 finals
const CHOSEONG = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';

export function isHangulSyllable(ch: string): boolean {
  const cp = ch.codePointAt(0);
  return cp !== undefined && cp >= SYLLABLE_FIRST && cp <= SYLLABLE_LAST;
}

/** Initial consonant (compatibility jamo) of a precomposed syllable; other characters are returned as-is. */
export function choseongOf(ch: string): string {
  if (!isHangulSyllable(ch)) return ch;
  const index = Math.floor((ch.codePointAt(0)! - SYLLABLE_FIRST) / SYLLABLES_PER_CHOSEONG);
  return CHOSEONG[index]!;
}

/** Any Hangul syllable or jamo (conjoining or compatibility). */
export function isHangulChar(ch: string): boolean {
  const cp = ch.codePointAt(0);
  if (cp === undefined) return false;
  return (
    (cp >= SYLLABLE_FIRST && cp <= SYLLABLE_LAST) ||
    (cp >= 0x1100 && cp <= 0x11ff) ||
    (cp >= 0x3130 && cp <= 0x318f)
  );
}
