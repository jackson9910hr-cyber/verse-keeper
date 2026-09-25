import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getCardWithVerse } from '@/data/repositories/cards';
import { gradeCard } from '@/data/services/review';
import type { PracticeMode } from '@/domain/model';
import { isDue, type Grade } from '@/domain/srs/schedule';
import { todayOf } from '@/domain/time/clock';
import { PracticePanel } from '@/features/practice/PracticePanel';
import { haptic } from '@/platform/haptics';
import { useApp } from '@/providers/AppProvider';
import { useLive } from '@/providers/useLive';
import { Screen } from '@/ui/Screen';
import { EmptyState, ErrorState, Skeleton } from '@/ui/States';

export default function Practice() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const { t } = useTranslation();
  const { ctx, settings } = useApp();
  const [seed] = useState(() => String(Date.now()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const { data: current, loading } = useLive(() => getCardWithVerse(ctx, cardId), [ctx, cardId]);

  if (loading && !current)
    return (
      <Screen>
        <Skeleton lines={5} />
      </Screen>
    );
  if (!current)
    return (
      <Screen>
        <EmptyState title={t('verse.notFound')} />
      </Screen>
    );

  const due = isDue(current.card, todayOf(ctx.clock));
  const onGrade = async (grade: Grade, mode: PracticeMode) => {
    setBusy(true);
    setError(false);
    try {
      await gradeCard(ctx, { cardId: current.card.id, grade, mode });
      haptic(grade === 'again' ? 'warning' : 'success', settings['ui.haptics']);
      router.back();
    } catch (e) {
      if (__DEV__) console.error(e);
      setError(true);
      setBusy(false);
    }
  };

  return (
    <Screen>
      {error ? <ErrorState title={t('review.saveError')} /> : null}
      <PracticePanel
        item={current}
        seed={seed}
        onGrade={onGrade}
        busy={busy}
        notice={due ? undefined : t('practice.practiceOnly')}
      />
    </Screen>
  );
}
