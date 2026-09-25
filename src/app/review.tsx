import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { dueQueue, type CardWithVerse } from '@/data/repositories/cards';
import { gradeCard } from '@/data/services/review';
import type { PracticeMode } from '@/domain/model';
import type { Grade } from '@/domain/srs/schedule';
import { todayOf } from '@/domain/time/clock';
import { PracticePanel } from '@/features/practice/PracticePanel';
import { haptic } from '@/platform/haptics';
import { useApp } from '@/providers/AppProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';
import { ErrorState, Skeleton } from '@/ui/States';
import { Text } from '@/ui/Text';
import { spacing } from '@/ui/theme';

interface QueueItem {
  item: CardWithVerse;
  relearn: boolean;
}

export default function Review() {
  const { t } = useTranslation();
  const { ctx, activeProfile, settings } = useApp();
  const [seed] = useState(() => String(Date.now()));
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(0);
  const [again, setAgain] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    void dueQueue(
      ctx,
      activeProfile?.id ?? '',
      todayOf(ctx.clock),
      settings['review.sessionSize'],
    ).then((items) => setQueue(items.map((item) => ({ item, relearn: false }))));
    // Build the queue once per session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!queue)
    return (
      <Screen>
        <Skeleton lines={5} />
      </Screen>
    );

  const current = queue[index];
  if (!current) {
    return (
      <Screen>
        <Card style={{ alignItems: 'center', gap: spacing.md }}>
          <Text variant="title" accessibilityRole="header">
            {queue.length === 0 ? t('review.empty') : t('review.summaryTitle')}
          </Text>
          {queue.length > 0 ? <Text>{t('review.summaryBody', { count: done })}</Text> : null}
          {again > 0 ? (
            <Text tone="muted">{t('review.summaryAgain', { count: again })}</Text>
          ) : null}
        </Card>
        <Button label={t('review.backHome')} onPress={() => router.back()} testID="review-home" />
      </Screen>
    );
  }

  const onGrade = async (grade: Grade, mode: PracticeMode) => {
    setBusy(true);
    setError(false);
    try {
      const result = await gradeCard(ctx, {
        cardId: current.item.card.id,
        grade,
        mode,
        relearn: current.relearn,
      });
      haptic(grade === 'again' ? 'warning' : 'success', settings['ui.haptics']);
      if (grade === 'again' && !current.relearn) {
        // docs/spec.md US-SR-2 AC3: show a failed card once more at the end of the session.
        setQueue((q) => [
          ...(q ?? []),
          { item: { ...current.item, card: result.card }, relearn: true },
        ]);
        setAgain((n) => n + 1);
      }
      if (!current.relearn) setDone((n) => n + 1);
      setIndex((i) => i + 1);
    } catch (e) {
      if (__DEV__) console.error(e);
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View accessibilityLiveRegion="polite">
        <Text variant="caption" tone="muted">
          {t('review.progress', { current: index + 1, total: queue.length })}
        </Text>
      </View>
      {error ? <ErrorState title={t('review.saveError')} /> : null}
      <PracticePanel
        key={`${current.item.card.id}-${index}`}
        item={current.item}
        seed={`${seed}-${index}`}
        onGrade={onGrade}
        busy={busy}
      />
    </Screen>
  );
}
