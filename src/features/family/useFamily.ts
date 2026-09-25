import { listAssignedVerses, listChecks } from '@/data/repositories/family';
import { weekStart } from '@/domain/family/week';
import { todayOf } from '@/domain/time/clock';
import { useApp } from '@/providers/AppProvider';
import { useLive } from '@/providers/useLive';

export function useFamily() {
  const { ctx, settings } = useApp();
  const weekStartsOn = settings['family.weekStartsOn'];
  return useLive(
    async () => {
      const week = weekStart(todayOf(ctx.clock), weekStartsOn);
      const assigned = await listAssignedVerses(ctx);
      return {
        week,
        current: assigned.find((a) => a.weekStart === week)?.verse ?? null,
        checks: new Set((await listChecks(ctx, week)).map((c) => c.profileId)),
        history: assigned.filter((a) => a.weekStart < week),
      };
    },
    [ctx, weekStartsOn],
    ['family', 'verses', 'profiles'],
  );
}
