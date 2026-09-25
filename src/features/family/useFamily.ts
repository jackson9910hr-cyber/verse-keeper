import { listAssignments, listChecks } from '@/data/repositories/family';
import { listVerses } from '@/data/repositories/verses';
import { weekStart } from '@/domain/family/week';
import { todayOf } from '@/domain/time/clock';
import { useApp } from '@/providers/AppProvider';
import { useLive } from '@/providers/useLive';

export function useFamily() {
  const { ctx, settings } = useApp();
  const weekStartsOn = settings['family.weekStartsOn'];
  return useLive(async () => {
    const week = weekStart(todayOf(ctx.clock), weekStartsOn);
    const assignments = await listAssignments(ctx);
    const verses = new Map((await listVerses(ctx)).map((v) => [v.id, v]));
    const current = assignments.find((a) => a.weekStart === week);
    return {
      week,
      current: current ? (verses.get(current.verseId) ?? null) : null,
      checks: new Set((await listChecks(ctx, week)).map((c) => c.profileId)),
      history: assignments
        .filter((a) => a.weekStart < week)
        .map((a) => ({ weekStart: a.weekStart, verse: verses.get(a.verseId) ?? null })),
    };
  }, [ctx, weekStartsOn]);
}
