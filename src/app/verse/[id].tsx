import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { assignWeeklyVerse } from '@/data/repositories/family';
import {
  availableLangs,
  cardsForVerse,
  deleteCard,
  startLearning,
} from '@/data/repositories/cards';
import { deleteVerse, getVerse } from '@/data/repositories/verses';
import { isDue } from '@/domain/srs/schedule';
import { todayOf } from '@/domain/time/clock';
import { formatReference } from '@/i18n/books';
import { formatLocalDate } from '@/i18n/format';
import { haptic } from '@/platform/haptics';
import { useApp } from '@/providers/AppProvider';
import { useLive } from '@/providers/useLive';
import { announce } from '@/ui/announce';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { Screen } from '@/ui/Screen';
import { EmptyState, Skeleton } from '@/ui/States';
import { Text } from '@/ui/Text';
import { spacing } from '@/ui/theme';

import corePack from '../../../assets/packs/web-core-50.json';

export default function VerseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { ctx, activeProfile, lang, settings } = useApp();
  const profileId = activeProfile?.id ?? '';
  const [notice, setNotice] = useState<string | null>(null);
  const { data, loading } = useLive(
    async () => {
      const verse = await getVerse(ctx, id);
      return {
        verse,
        cards: verse ? await cardsForVerse(ctx, profileId, verse.id) : [],
        today: todayOf(ctx.clock),
      };
    },
    [ctx, id, profileId],
    ['verses', 'cards', 'reviews', 'family'],
  );

  if (loading && !data)
    return (
      <Screen>
        <Skeleton lines={5} />
      </Screen>
    );
  const verse = data?.verse;
  if (!verse)
    return (
      <Screen>
        <EmptyState title={t('verse.notFound')} />
      </Screen>
    );

  const langs = availableLangs(verse);
  const missing = langs.filter((l) => !data.cards.some((c) => c.lang === l));

  const learn = async () => {
    await startLearning(ctx, profileId, verse, missing);
    haptic('success', settings['ui.haptics']);
    setNotice(t('verse.learnDone'));
    announce(t('verse.learnDone'));
  };
  const setFamily = async () => {
    await assignWeeklyVerse(ctx, verse.id, settings['family.weekStartsOn']);
    haptic('success', settings['ui.haptics']);
    setNotice(t('verse.familySetDone'));
    announce(t('verse.familySetDone'));
  };
  const confirmDelete = () =>
    Alert.alert(t('verse.deleteTitle'), t('verse.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteVerse(ctx, verse.id);
          router.back();
        },
      },
    ]);
  const confirmStop = (cardId: string) =>
    Alert.alert(t('verse.stopLearning'), t('verse.stopLearningConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('verse.stopLearning'),
        style: 'destructive',
        onPress: () => void deleteCard(ctx, cardId),
      },
    ]);

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: formatReference(verse, lang),
          headerRight: () => (
            <Button
              label={t('common.edit')}
              variant="ghost"
              compact
              onPress={() => router.push({ pathname: '/verse/edit', params: { id: verse.id } })}
            />
          ),
        }}
      />
      <Text variant="title" accessibilityRole="header">
        {formatReference(verse, lang)}
      </Text>
      {verse.textKo ? (
        <Card>
          <Text variant="caption" tone="muted">
            {t('lang.ko')}
          </Text>
          <Text variant="verse">{verse.textKo}</Text>
        </Card>
      ) : null}
      {verse.textEn ? (
        <Card>
          <Text variant="caption" tone="muted">
            {t('lang.en')}
            {verse.labelEn ? ` · ${verse.labelEn}` : ''}
          </Text>
          <Text variant="verse">{verse.textEn}</Text>
          {verse.source === 'pack' ? (
            <Text variant="caption" tone="muted">
              {t('verse.source', {
                name: corePack.translation.name,
                license: corePack.translation.license,
              })}
            </Text>
          ) : null}
        </Card>
      ) : null}
      {verse.tags.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {verse.tags.map((tag) => (
            <Chip
              key={tag}
              label={`#${t(`tagNames.${tag}`, { defaultValue: tag })}`}
              onPress={() => router.navigate({ pathname: '/verses', params: { tag } })}
            />
          ))}
        </View>
      ) : null}

      {notice ? (
        <Text tone="success" accessibilityRole="alert" accessibilityLiveRegion="polite">
          {notice}
        </Text>
      ) : null}

      {data.cards.length === 0 ? <Text tone="muted">{t('verse.notLearning')}</Text> : null}
      {data.cards.map((c) => (
        <Card key={c.id}>
          <Text variant="headline" accessibilityRole="header">
            {t('verse.cardTitle', { lang: t(`lang.${c.lang}`) })}
          </Text>
          <Text tone="muted">
            {isDue(c, data.today)
              ? t('verse.dueToday')
              : t('verse.dueOn', { date: formatLocalDate(c.dueDate, lang) })}{' '}
            · {t('verse.level', { level: c.clozeLevel })}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Button
              label={t('verse.practice')}
              onPress={() => router.push(`/practice/${c.id}`)}
              style={{ flexGrow: 1 }}
            />
            <Button
              label={t('verse.stopLearning')}
              variant="ghost"
              onPress={() => confirmStop(c.id)}
            />
          </View>
        </Card>
      ))}
      {missing.length > 0 ? (
        <Button label={t('verse.learn')} onPress={learn} testID="start-learning" />
      ) : null}
      <Button label={t('verse.setFamily')} variant="secondary" onPress={setFamily} />
      <Button label={t('verse.deleteTitle')} variant="ghost" onPress={confirmDelete} />
    </Screen>
  );
}
