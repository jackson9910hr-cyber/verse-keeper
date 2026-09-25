import type { Lang, Verse } from '@/domain/model';

export const textFor = (verse: Pick<Verse, 'textKo' | 'textEn'>, lang: Lang): string =>
  (lang === 'ko' ? verse.textKo : verse.textEn) ?? '';

/** Preferred text for previews: UI language first, then the other one. */
export const previewText = (verse: Pick<Verse, 'textKo' | 'textEn'>, uiLang: Lang): string =>
  textFor(verse, uiLang) || textFor(verse, uiLang === 'ko' ? 'en' : 'ko');
