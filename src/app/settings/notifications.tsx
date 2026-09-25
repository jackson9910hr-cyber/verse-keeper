import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, View } from 'react-native';

import { formatTime } from '@/i18n/format';
import { CAPABILITIES } from '@/platform/capabilities';
import {
  cancelReminder,
  ensureNotificationPermission,
  scheduleDailyReminder,
} from '@/platform/notifications';
import { useApp } from '@/providers/AppProvider';
import { Section, SwitchRow } from '@/ui/Rows';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/ThemeContext';
import { spacing } from '@/ui/theme';

export default function Notifications() {
  const { t } = useTranslation();
  const { scheme } = useTheme();
  const { settings, setSetting, lang } = useApp();
  const [busy, setBusy] = useState(false);
  const enabled = settings['notify.enabled'];
  const time = settings['notify.time'];
  const [h = 20, m = 0] = time.split(':').map(Number);

  const reschedule = async (hhmm: string) => {
    await cancelReminder(settings['notify.scheduledId']);
    const [hh = 20, mm = 0] = hhmm.split(':').map(Number);
    const id = await scheduleDailyReminder(
      hh,
      mm,
      t('notify.contentTitle'),
      t('notify.contentBody'),
    );
    await setSetting('notify.scheduledId', id);
  };

  const toggle = async (on: boolean) => {
    setBusy(true);
    try {
      if (!on) {
        await cancelReminder(settings['notify.scheduledId']);
        await setSetting('notify.scheduledId', null);
        await setSetting('notify.enabled', false);
        return;
      }
      // Permission is requested only now, when the user turns reminders on (docs/spec.md US-NT-1).
      if ((await ensureNotificationPermission()) !== 'granted') {
        await setSetting('notify.enabled', false);
        Alert.alert(t('notify.deniedTitle'), t('notify.deniedBody'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('notify.openSettings'), onPress: () => void Linking.openSettings() },
        ]);
        return;
      }
      await reschedule(time);
      await setSetting('notify.enabled', true);
    } finally {
      setBusy(false);
    }
  };

  const onTime = async (_: DateTimePickerEvent, date?: Date) => {
    if (!date) return;
    const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    await setSetting('notify.time', hhmm);
    if (enabled) await reschedule(hhmm);
  };

  const pickerValue = new Date(2000, 0, 1, h, m);

  if (!CAPABILITIES.localNotifications) {
    return (
      <Screen>
        <Text tone="muted">{t('notify.unsupported')}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Section footer={t('notify.description')}>
        <SwitchRow
          label={t('notify.enable')}
          value={enabled}
          onValueChange={(v) => void toggle(v)}
          disabled={busy}
        />
      </Section>
      {enabled ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="headline" accessibilityRole="header">
            {t('notify.time')}: {formatTime(time, lang)}
          </Text>
          <DateTimePicker
            value={pickerValue}
            mode="time"
            display="spinner"
            themeVariant={scheme}
            locale={lang === 'ko' ? 'ko-KR' : 'en-US'}
            onChange={(e, d) => void onTime(e, d)}
            accessibilityLabel={t('notify.time')}
          />
        </View>
      ) : null}
    </Screen>
  );
}
