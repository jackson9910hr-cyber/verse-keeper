import { learningVerseIds } from '@/data/repositories/cards';
import { listVerses, type VerseQuery } from '@/data/repositories/verses';
import { useApp } from '@/providers/AppProvider';
import { useLive } from '@/providers/useLive';

export function useVerseList(query: VerseQuery) {
  const { ctx, activeProfile } = useApp();
  const profileId = activeProfile?.id ?? '';
  return useLive(async () => {
    const [verses, learning] = [
      await listVerses(ctx, query),
      await learningVerseIds(ctx, profileId),
    ];
    return { verses, learning };
  }, [ctx, profileId, query.filter, query.search, query.sort, query.tag]);
}
