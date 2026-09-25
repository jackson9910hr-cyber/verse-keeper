import { useTranslation } from 'react-i18next';

import type { LanguagePref, ThemePref } from '@/data/settings';
import { useApp } from '@/providers/AppProvider';
import { ChoiceRow, Section } from '@/ui/Rows';
import { Screen } from '@/ui/Screen';

export default function Appearance() {
  const { t } = useTranslation();
  const { settings, setSetting } = useApp();
  const themes: [ThemePref, string][] = [
    ['system', t('appearance.themeSystem')],
    ['light', t('appearance.themeLight')],
    ['dark', t('appearance.themeDark')],
  ];
  const langs: [LanguagePref, string][] = [
    ['system', t('appearance.langSystem')],
    ['ko', t('appearance.langKo')],
    ['en', t('appearance.langEn')],
  ];
  return (
    <Screen>
      <Section title={t('appearance.theme')}>
        {themes.map(([v, label]) => (
          <ChoiceRow
            key={v}
            label={label}
            selected={settings['ui.theme'] === v}
            onPress={() => void setSetting('ui.theme', v)}
          />
        ))}
      </Section>
      <Section title={t('appearance.language')}>
        {langs.map(([v, label]) => (
          <ChoiceRow
            key={v}
            label={label}
            selected={settings['ui.language'] === v}
            onPress={() => void setSetting('ui.language', v)}
          />
        ))}
      </Section>
    </Screen>
  );
}
