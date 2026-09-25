import { useMemo, useRef } from 'react';

import { learningVerseIds } from '@/data/repositories/cards';
import { listVerses, type VerseQuery } from '@/data/repositories/verses';
import type { Verse } from '@/domain/model';
import { useApp } from '@/providers/AppProvider';
import { useLive } from '@/providers/useLive';

/**
 * Verse list + "learning" ids for the active profile. Unchanged verses keep their object
 * identity across refetches so memoized rows don't re-render.
 */
export function useVerseList(query: VerseQuery) {
  const { ctx, activeProfile } = useApp();
  const profileId = activeProfile?.id ?? '';
  const cache = useRef(new Map<string, Verse>());
  const live = useLive(
    async () => {
      const fresh = await listVerses(ctx, query);
      const previous = cache.current;
      const verses = fresh.map((v) => {
        const old = previous.get(v.id);
        return old && old.updatedAt === v.updatedAt && old.tags.join() === v.tags.join() ? old : v;
      });
      cache.current = new Map(verses.map((v) => [v.id, v]));
      const learningKey = [...(await learningVerseIds(ctx, profileId))].sort().join('|');
      return { verses, learningKey };
    },
    [ctx, profileId, query.filter, query.search, query.sort, query.tag],
    ['verses', 'cards', 'profiles'],
  );
  const learningKey = live.data?.learningKey ?? '';
  const learning = useMemo(() => new Set(learningKey ? learningKey.split('|') : []), [learningKey]);
  return { ...live, data: live.data ? { verses: live.data.verses, learning } : undefined };
}
