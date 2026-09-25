import { dueCount, learningCount } from '@/data/repositories/cards';
import { listAssignments } from '@/data/repositories/family';
import { getVerse } from '@/data/repositories/verses';
import { streakFor } from '@/data/services/review';
import { currentFamilyVerse, weekStart } from '@/domain/family/week';
import { todayOf } from '@/domain/time/clock';
import { useApp } from '@/providers/AppProvider';
import { useLive } from '@/providers/useLive';

export function useHome() {
  const { ctx, activeProfile, settings } = useApp();
  const profileId = activeProfile?.id ?? '';
  const weekStartsOn = settings['family.weekStartsOn'];
  return useLive(
    async () => {
      const today = todayOf(ctx.clock);
      const assignments = await listAssignments(ctx);
      const familyVerseId = currentFamilyVerse(assignments, today, weekStartsOn);
      return {
        today,
        week: weekStart(today, weekStartsOn),
        due: await dueCount(ctx, profileId, today),
        learning: await learningCount(ctx, profileId),
        streak: await streakFor(ctx, profileId),
        familyVerse: familyVerseId ? await getVerse(ctx, familyVerseId) : null,
      };
    },
    [ctx, profileId, weekStartsOn],
    ['cards', 'reviews', 'family', 'verses', 'profiles'],
  );
}
