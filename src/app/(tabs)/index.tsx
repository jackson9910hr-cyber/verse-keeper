import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ProfileSwitcher } from '@/features/home/ProfileSwitcher';
import { useHome } from '@/features/home/useHome';
import { previewText } from '@/features/verses/text';
import { formatReference } from '@/i18n/books';
import { formatLocalDate } from '@/i18n/format';
import { useApp } from '@/providers/AppProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';
import { EmptyState, ErrorState, Skeleton } from '@/ui/States';
import { Text } from '@/ui/Text';
import { spacing } from '@/ui/theme';

export default function Home() {
  const { t } = useTranslation();
  const { activeProfile, lang } = useApp();
  const { data, error, loading, reload } = useHome();

  return (
    <Screen testID="home">
      <ProfileSwitcher />
      <Text variant="title" accessibilityRole="header">
        {t('home.greeting', { name: activeProfile?.name ?? '' })}
      </Text>

      {error ? (
        <ErrorState title={t('errors.generic')} retryLabel={t('common.retry')} onRetry={reload} />
      ) : null}
      {loading && !data ? <Skeleton lines={4} /> : null}

      {data ? (
        <>
          <Card
            accessible
            accessibilityLabel={`${t('home.dueTitle')} ${t('home.dueCount', { count: data.due })}`}
          >
            <Text variant="headline">{t('home.dueTitle')}</Text>
            <Text variant="number" tone="primary" testID="due-count">
              {t('home.dueCount', { count: data.due })}
            </Text>
          </Card>
          {data.due > 0 ? (
            <Button
              label={t('home.startReview')}
              onPress={() => router.push('/review')}
              testID="start-review"
            />
          ) : data.learning === 0 ? (
            <EmptyState
              title={t('home.noCards')}
              body={t('home.noCardsBody')}
              actionLabel={t('home.learnNew')}
              onAction={() => router.push('/verses')}
            />
          ) : (
            <EmptyState
              title={t('home.allDone')}
              body={t('home.allDoneBody')}
              actionLabel={t('home.learnNew')}
              onAction={() => router.push('/verses')}
            />
          )}

          <Card
            accessible
            accessibilityLabel={`${t('home.streak', { count: data.streak.current })}, ${t('home.streakLongest', { count: data.streak.longest })}`}
          >
            <Text variant="headline">🔥 {t('home.streak', { count: data.streak.current })}</Text>
            <Text tone="muted">
              {data.streak.studiedToday ? t('home.streakToday') : t('home.streakPending')} ·{' '}
              {t('home.streakLongest', { count: data.streak.longest })}
            </Text>
          </Card>

          <Card>
            <Text variant="headline" accessibilityRole="header">
              {t('home.familyTitle')}
            </Text>
            <Text variant="caption" tone="muted">
              {t('family.thisWeek', { date: formatLocalDate(data.week, lang) })}
            </Text>
            {data.familyVerse ? (
              <View style={{ gap: spacing.sm }}>
                <Text variant="headline" tone="primary">
                  {formatReference(data.familyVerse, lang)}
                </Text>
                <Text numberOfLines={4}>{previewText(data.familyVerse, lang)}</Text>
                <Button
                  label={t('verse.practice')}
                  variant="secondary"
                  onPress={() => router.push(`/verse/${data.familyVerse!.id}`)}
                />
              </View>
            ) : (
              <View style={{ gap: spacing.sm }}>
                <Text tone="muted">{t('home.familyEmpty')}</Text>
                <Button
                  label={t('home.familySet')}
                  variant="secondary"
                  onPress={() => router.push('/family-pick')}
                />
              </View>
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
