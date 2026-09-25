import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { exportBackup, importBackup } from '@/data/services/backup';
import { parseBackup } from '@/domain/backup/backup';
import { todayOf } from '@/domain/time/clock';
import { formatEpoch } from '@/i18n/format';
import { pickBackupFile, shareBackupFile } from '@/platform/backupFiles';
import { cancelAllReminders } from '@/platform/notifications';
import { useApp } from '@/providers/AppProvider';
import { useAnnounce } from '@/ui/announce';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

export default function Backup() {
  const { t } = useTranslation();
  const { ctx, settings, setSetting, lang } = useApp();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const last = settings['backup.lastExportAt'];
  useAnnounce(message?.text);

  const doExport = async () => {
    setBusy('export');
    setMessage(null);
    try {
      const file = await exportBackup(ctx, Constants.expoConfig?.version ?? '1.0.0');
      const stamp = todayOf(ctx.clock).replace(/-/g, '');
      const shared = await shareBackupFile(
        `verse-keeper-backup-${stamp}.json`,
        JSON.stringify(file),
      );
      if (!shared) setMessage({ tone: 'danger', text: t('backup.shareUnavailable') });
      else await setSetting('backup.lastExportAt', ctx.clock.now());
    } catch (e) {
      if (__DEV__) console.error(e);
      setMessage({ tone: 'danger', text: t('backup.exportError') });
    } finally {
      setBusy(null);
    }
  };

  const doImport = async () => {
    setBusy('import');
    setMessage(null);
    try {
      const picked = await pickBackupFile();
      if (picked.kind === 'canceled') return;
      const parsed = parseBackup(picked.text);
      if (!parsed.ok) {
        setMessage({
          tone: 'danger',
          text: t(`backup.errors.${parsed.error.code}`, { path: parsed.error.path ?? '' }),
        });
        return;
      }
      const { verses, profiles } = parsed.value.data;
      Alert.alert(
        t('backup.overwriteTitle'),
        t('backup.overwriteBody', { verses: verses.length, profiles: profiles.length }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('backup.overwrite'),
            style: 'destructive',
            onPress: async () => {
              try {
                await importBackup(ctx, parsed.value, { cancelReminders: cancelAllReminders });
                setMessage({ tone: 'success', text: t('backup.imported') });
              } catch (e) {
                if (__DEV__) console.error(e);
                setMessage({ tone: 'danger', text: t('backup.errors.IMPORT_FAILED') });
              }
            },
          },
        ],
      );
    } catch (e) {
      if (__DEV__) console.error(e);
      setMessage({ tone: 'danger', text: t('backup.errors.IMPORT_FAILED') });
    } finally {
      setBusy(null);
    }
  };

  const offset = ctx.clock.tzOffsetMinutes(ctx.clock.now());
  return (
    <Screen>
      <Card>
        <Text variant="headline" accessibilityRole="header">
          {t('backup.export')}
        </Text>
        <Text tone="muted">{t('backup.exportDesc')}</Text>
        <Text variant="caption" tone="muted">
          {last
            ? t('backup.lastExport', { date: formatEpoch(last, lang, offset) })
            : t('backup.never')}
        </Text>
        <Button
          label={t('backup.export')}
          onPress={doExport}
          loading={busy === 'export'}
          disabled={busy !== null}
        />
      </Card>
      <Card>
        <Text variant="headline" accessibilityRole="header">
          {t('backup.import')}
        </Text>
        <Text tone="muted">{t('backup.importDesc')}</Text>
        <Button
          label={t('backup.import')}
          variant="secondary"
          onPress={doImport}
          loading={busy === 'import'}
          disabled={busy !== null}
        />
      </Card>
      {message ? (
        <Text tone={message.tone} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {message.text}
        </Text>
      ) : null}
    </Screen>
  );
}
