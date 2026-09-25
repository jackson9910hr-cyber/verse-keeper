import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { toggleCheck } from '@/data/repositories/family';
import { useFamily } from '@/features/family/useFamily';
import { previewText } from '@/features/verses/text';
import { formatReference } from '@/i18n/books';
import { formatLocalDate } from '@/i18n/format';
import { haptic } from '@/platform/haptics';
import { useApp } from '@/providers/AppProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { LinkRow, Section } from '@/ui/Rows';
import { Screen } from '@/ui/Screen';
import { EmptyState, ErrorState, Skeleton } from '@/ui/States';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/ThemeContext';
import { spacing } from '@/ui/theme';

const HISTORY_PREVIEW = 12;

export default function Family() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { ctx, lang, profiles, settings } = useApp();
  const { data, error, loading, reload } = useFamily();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const history = data
    ? showAllHistory
      ? data.history
      : data.history.slice(0, HISTORY_PREVIEW)
    : [];

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t('family.title')}
      </Text>
      {error ? (
        <ErrorState title={t('errors.generic')} retryLabel={t('common.retry')} onRetry={reload} />
      ) : null}
      {loading && !data ? <Skeleton lines={4} /> : null}
      {data ? (
        <>
          <Card>
            <Text variant="caption" tone="muted">
              {t('family.thisWeek', { date: formatLocalDate(data.week, lang) })}
            </Text>
            {data.current ? (
              <View style={{ gap: spacing.md }}>
                <Text variant="title" tone="primary">
                  {formatReference(data.current, lang)}
                </Text>
                <Text variant="verse">{previewText(data.current, lang)}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  <Button
                    label={t('verse.practice')}
                    onPress={() => router.push(`/verse/${data.current!.id}`)}
                    style={{ flexGrow: 1 }}
                  />
                  <Button
                    label={t('family.change')}
                    variant="secondary"
                    onPress={() => router.push('/family-pick')}
                    style={{ flexGrow: 1 }}
                  />
                </View>
              </View>
            ) : (
              <EmptyState
                title={t('family.empty')}
                actionLabel={t('family.pick')}
                onAction={() => router.push('/family-pick')}
              />
            )}
          </Card>

          {data.current ? (
            <Card>
              <Text variant="headline" accessibilityRole="header">
                {t('family.members')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {profiles.map((p) => {
                  const checked = data.checks.has(p.id);
                  return (
                    <Chip
                      key={p.id}
                      role="checkbox"
                      label={`${checked ? '✓ ' : ''}${p.name}`}
                      color={colors.profile[p.color]}
                      selected={checked}
                      accessibilityLabel={p.name}
                      onPress={() => {
                        haptic('tap', settings['ui.haptics']);
                        void toggleCheck(ctx, data.week, p.id);
                      }}
                    />
                  );
                })}
              </View>
              {profiles.length < 2 ? (
                <View style={{ gap: spacing.sm }}>
                  <Text tone="muted">{t('family.onlyOne')}</Text>
                  <Button
                    label={t('family.addMember')}
                    variant="secondary"
                    onPress={() => router.push('/settings/profiles')}
                  />
                </View>
              ) : null}
            </Card>
          ) : null}

          <Section title={t('family.history')}>
            {data.history.length === 0 ? (
              <View style={{ padding: spacing.lg }}>
                <Text tone="muted">{t('family.noHistory')}</Text>
              </View>
            ) : (
              history.map((h) => (
                <LinkRow
                  key={h.weekStart}
                  label={formatReference(h.verse, lang)}
                  value={t('family.weekOf', { date: formatLocalDate(h.weekStart, lang) })}
                  onPress={() => router.push(`/verse/${h.verse.id}`)}
                />
              ))
            )}
          </Section>
          {data.history.length > HISTORY_PREVIEW && !showAllHistory ? (
            <Button
              label={t('family.showMore')}
              variant="ghost"
              onPress={() => setShowAllHistory(true)}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
