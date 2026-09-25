import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { resetAllData } from '@/data/services/app';
import { CAPABILITIES } from '@/platform/capabilities';
import { cancelAllReminders } from '@/platform/notifications';
import { useApp } from '@/providers/AppProvider';
import { LinkRow, Section } from '@/ui/Rows';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

export default function Settings() {
  const { t } = useTranslation();
  const { ctx, profiles, settings } = useApp();

  const confirmDeleteAll = () => {
    Alert.alert(t('settings.deleteAllTitle'), t('settings.deleteAllBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteAllAction'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(t('settings.deleteAllConfirm'), t('settings.deleteAllConfirmBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('settings.deleteAllAction'),
              style: 'destructive',
              onPress: () => void resetAllData(ctx, { cancelReminders: cancelAllReminders }),
            },
          ]),
      },
    ]);
  };

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t('settings.title')}
      </Text>
      <Section>
        <LinkRow
          label={t('settings.profiles')}
          value={String(profiles.length)}
          onPress={() => router.push('/settings/profiles')}
        />
        <LinkRow label={t('settings.study')} onPress={() => router.push('/settings/study')} />
        <LinkRow
          label={t('settings.appearance')}
          onPress={() => router.push('/settings/appearance')}
        />
        {CAPABILITIES.localNotifications ? (
          <LinkRow
            label={t('settings.notifications')}
            value={settings['notify.enabled'] ? t('common.on') : t('common.off')}
            onPress={() => router.push('/settings/notifications')}
          />
        ) : null}
        <LinkRow label={t('settings.backup')} onPress={() => router.push('/settings/backup')} />
        <LinkRow label={t('settings.about')} onPress={() => router.push('/settings/about')} />
      </Section>
      <Section>
        <LinkRow label={t('settings.deleteAll')} onPress={confirmDeleteAll} destructive />
      </Section>
    </Screen>
  );
}
