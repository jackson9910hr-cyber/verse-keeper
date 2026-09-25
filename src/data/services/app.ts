import type { DataContext } from '../context';
import { emit } from '../events';
import { cleanProfileName } from '../repositories/profiles';
import { loadSettings, writeSetting } from '../settings';
import { CLEAR_ALL_SQL } from './backup';

/** Finishes first-run setup: creates the first profile (if none) and marks onboarding done. */
export async function completeOnboarding(ctx: DataContext, name: string): Promise<string> {
  const clean = cleanProfileName(name);
  const id = await ctx.db.tx(async (tx) => {
    const existing = await tx.getFirstAsync<{ id: string }>(
      'SELECT id FROM profiles ORDER BY sort_order LIMIT 1',
      [],
    );
    const profileId = existing?.id ?? ctx.newId();
    if (!existing) {
      await tx.runAsync(
        "INSERT INTO profiles (id, name, color, sort_order, created_at) VALUES (?, ?, 'blue', 0, ?)",
        [profileId, clean, ctx.clock.now()],
      );
    }
    await writeSetting(tx, 'profile.activeId', profileId);
    await writeSetting(tx, 'onboarding.done', true);
    return profileId;
  });
  emit('all');
  return id;
}

/** "Delete all data": wipes every table; the app returns to onboarding. */
export async function resetAllData(ctx: DataContext): Promise<void> {
  await ctx.db.tx(async (tx) => {
    await tx.execAsync(CLEAR_ALL_SQL);
    await tx.execAsync('DELETE FROM settings');
  });
  emit('all');
}

/** Returns the active profile id, repairing a dangling setting. */
export async function resolveActiveProfile(ctx: DataContext): Promise<string | null> {
  const settings = await loadSettings(ctx.db);
  const active = settings['profile.activeId'];
  if (active && (await ctx.db.first('SELECT 1 FROM profiles WHERE id = ?', [active])))
    return active;
  const first = await ctx.db.first<{ id: string }>(
    'SELECT id FROM profiles ORDER BY sort_order, created_at LIMIT 1',
  );
  if (first) await ctx.db.tx((tx) => writeSetting(tx, 'profile.activeId', first.id));
  return first?.id ?? null;
}
