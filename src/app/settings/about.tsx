import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

import corePack from '../../../assets/packs/web-core-50.json';

export default function About() {
  const { t } = useTranslation();
  const tr = corePack.translation;
  return (
    <Screen>
      <Card>
        <Text variant="title">Verse Keeper</Text>
        <Text tone="muted">
          {t('about.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
        </Text>
        <Text>{t('about.offline')}</Text>
      </Card>
      <Card>
        <Text variant="headline" accessibilityRole="header">
          {t('about.translation')}
        </Text>
        <Text>
          {t('about.translationBody', {
            name: tr.name,
            code: tr.code,
            license: tr.license,
            note: tr.licenseNote,
            source: tr.source,
          })}
        </Text>
        <Text tone="muted">{t('about.koreanNote')}</Text>
      </Card>
      <Card>
        <Text variant="headline" accessibilityRole="header">
          {t('about.privacy')}
        </Text>
        <Text>{t('about.privacyBody')}</Text>
      </Card>
      <Card>
        <Text variant="headline" accessibilityRole="header">
          {t('about.licenses')}
        </Text>
        <Text>{t('about.licensesBody')}</Text>
      </Card>
    </Screen>
  );
}
