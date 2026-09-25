import { normalizeText, tokenize, wordTokens } from './tokenize';

const words = (s: string) => wordTokens(tokenize(s)).map((t) => t.text);

describe('normalizeText', () => {
  it('collapses whitespace and trims', () => {
    expect(normalizeText('  For\tGod \n\n so  ')).toBe('For God so');
  });
  it('NFC-normalizes decomposed Hangul', () => {
    const nfd = '태초에'.normalize('NFD');
    expect(nfd).not.toBe('태초에');
    expect(normalizeText(nfd)).toBe('태초에');
  });
});

describe('tokenize', () => {
  it('returns no tokens for empty or whitespace-only input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   \n ')).toEqual([]);
  });

  it('splits words, punctuation and spaces and keeps offsets', () => {
    const tokens = tokenize('For God so loved the world,');
    expect(tokens.map((t) => t.kind)).toEqual([
      'word',
      'space',
      'word',
      'space',
      'word',
      'space',
      'word',
      'space',
      'word',
      'space',
      'word',
      'punct',
    ]);
    expect(tokens.map((t) => t.text).join('')).toBe('For God so loved the world,');
    for (const t of tokens)
      expect('For God so loved the world,'.slice(t.start, t.start + t.text.length)).toBe(t.text);
  });

  it('numbers word tokens sequentially', () => {
    expect(wordTokens(tokenize('a, b; c')).map((t) => t.index)).toEqual([0, 1, 2]);
  });

  it('keeps apostrophes (straight and curly) and hyphens inside words', () => {
    expect(words("God's Lord’s well-pleasing don’t")).toEqual([
      "God's",
      'Lord’s',
      'well-pleasing',
      'don’t',
    ]);
  });

  it('keeps digit separators inside numbers only', () => {
    expect(words('3,000 men at 3:16 and 1.5')).toEqual([
      '3,000',
      'men',
      'at',
      '3:16',
      'and',
      '1.5',
    ]);
    expect(words('love,the')).toEqual(['love', 'the']);
  });

  it('treats leading/trailing quotes and dashes as punctuation', () => {
    const tokens = tokenize('“Jesus—wept.”');
    expect(tokens.filter((t) => t.kind === 'punct').map((t) => t.text)).toEqual(['“', '—', '.”']);
    expect(words('“Jesus—wept.”')).toEqual(['Jesus', 'wept']);
  });

  it('handles punctuation-only input', () => {
    const tokens = tokenize('“…!”');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]!.kind).toBe('punct');
  });

  it('handles a single word', () => {
    expect(words('Amen')).toEqual(['Amen']);
  });

  it('treats Korean eojeol as words and detects scripts', () => {
    const w = wordTokens(tokenize('태초에 하나님이 Christ께서 3일'));
    expect(w.map((t) => t.text)).toEqual(['태초에', '하나님이', 'Christ께서', '3일']);
    expect(w.map((t) => t.script)).toEqual(['hangul', 'hangul', 'latin', 'digit']);
  });

  it('classifies other scripts and emoji', () => {
    const tokens = tokenize('Ἀγάπη 🙏');
    expect(wordTokens(tokens)[0]!.script).toBe('other');
    expect(tokens.at(-1)!.kind).toBe('punct');
  });
});
