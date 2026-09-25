import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { LanguagePref } from '@/data/settings';

import type { UiLang } from './books';
import en from './locales/en.json';
import ko from './locales/ko.json';

export const resources = { ko: { translation: ko }, en: { translation: en } } as const;

/** System language → ko when the device prefers Korean, otherwise en (docs/spec.md US-ST-2). */
export function resolveLanguage(
  pref: LanguagePref,
  systemLanguageCode: string | null | undefined,
): UiLang {
  if (pref === 'ko' || pref === 'en') return pref;
  return systemLanguageCode?.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

const i18n = createInstance();
let initialized = false;

/** Synchronous first-time init (resources are bundled, so no async loading happens). */
export function initI18n(lang: UiLang): typeof i18n {
  if (!initialized) {
    initialized = true;
    void i18n.use(initReactI18next).init({
      resources,
      lng: lang,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      returnNull: false,
      initAsync: false,
    });
  }
  return i18n;
}

export async function setLanguage(lang: UiLang): Promise<void> {
  if (i18n.language !== lang) await i18n.changeLanguage(lang);
}

export { i18n };
