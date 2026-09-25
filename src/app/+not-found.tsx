import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/ui/Screen';
import { EmptyState } from '@/ui/States';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState
        title={t('verse.notFound')}
        actionLabel={t('review.backHome')}
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}
