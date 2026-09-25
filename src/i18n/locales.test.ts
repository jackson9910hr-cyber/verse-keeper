import en from './locales/en.json';
import ko from './locales/ko.json';
import { resolveLanguage } from './index';

type Tree = { [key: string]: string | Tree };

const PLURAL = /_(zero|one|two|few|many|other)$/;
function keys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k.replace(PLURAL, '')}`] : keys(v, `${prefix}${k}.`),
  );
}
const placeholders = (s: string) => [...s.matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort();
function flat(tree: Tree, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tree).flatMap(([k, v]) =>
      typeof v === 'string'
        ? [[`${prefix}${k.replace(PLURAL, '')}`, v]]
        : Object.entries(flat(v, `${prefix}${k}.`)),
    ),
  );
}

describe('locales', () => {
  it('ko and en have the same keys (ignoring plural suffixes)', () => {
    expect([...new Set(keys(ko as Tree))].sort()).toEqual([...new Set(keys(en as Tree))].sort());
  });
  it('translations use the same interpolation variables', () => {
    const k = flat(ko as Tree);
    const e = flat(en as Tree);
    for (const key of Object.keys(k))
      expect([key, placeholders(k[key]!)]).toEqual([key, placeholders(e[key]!)]);
  });
  it('has no empty strings', () => {
    for (const v of [...Object.values(flat(ko as Tree)), ...Object.values(flat(en as Tree))])
      expect(v.trim()).not.toBe('');
  });
});

describe('resolveLanguage', () => {
  it('honours an explicit choice', () => {
    expect(resolveLanguage('ko', 'en')).toBe('ko');
    expect(resolveLanguage('en', 'ko')).toBe('en');
  });
  it('maps the system language (Korean → ko, anything else → en)', () => {
    expect(resolveLanguage('system', 'ko')).toBe('ko');
    expect(resolveLanguage('system', 'KO')).toBe('ko');
    expect(resolveLanguage('system', 'ja')).toBe('en');
    expect(resolveLanguage('system', null)).toBe('en');
  });
});
