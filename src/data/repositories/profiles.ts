import {
  MAX_PROFILES,
  MAX_PROFILE_NAME,
  PROFILE_COLORS,
  type Profile,
  type ProfileColor,
} from '@/domain/model';

import type { DataContext } from '../context';
import { emit } from '../events';
import { toProfile, type ProfileRow } from '../rows';
import { loadSettings, writeSetting } from '../settings';

export class ProfileLimitError extends Error {}
export class LastProfileError extends Error {}
export class InvalidNameError extends Error {}

export function cleanProfileName(name: string): string {
  const cleaned = [...name.normalize('NFC').trim()].slice(0, MAX_PROFILE_NAME).join('');
  if (!cleaned) throw new InvalidNameError('Profile name is empty');
  return cleaned;
}

export async function listProfiles({ db }: DataContext): Promise<Profile[]> {
  const rows = await db.all<ProfileRow>('SELECT * FROM profiles ORDER BY sort_order, created_at');
  return rows.map(toProfile);
}

export async function createProfile(
  ctx: DataContext,
  name: string,
  color?: ProfileColor,
): Promise<Profile> {
  const clean = cleanProfileName(name);
  const profile = await ctx.db.tx(async (tx) => {
    const count =
      (await tx.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM profiles', []))?.n ?? 0;
    if (count >= MAX_PROFILES) throw new ProfileLimitError(`At most ${MAX_PROFILES} profiles`);
    const p: Profile = {
      id: ctx.newId(),
      name: clean,
      color: color ?? PROFILE_COLORS[count % PROFILE_COLORS.length]!,
      sortOrder: count,
      createdAt: ctx.clock.now(),
    };
    await tx.runAsync(
      'INSERT INTO profiles (id, name, color, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
      [p.id, p.name, p.color, p.sortOrder, p.createdAt],
    );
    return p;
  });
  emit('profiles');
  return profile;
}

export async function updateProfile(
  ctx: DataContext,
  id: string,
  patch: { name?: string; color?: ProfileColor },
): Promise<void> {
  if (patch.name !== undefined) {
    await ctx.db.run('UPDATE profiles SET name = ? WHERE id = ?', [
      cleanProfileName(patch.name),
      id,
    ]);
  }
  if (patch.color !== undefined) {
    if (!PROFILE_COLORS.includes(patch.color)) throw new Error('Invalid color');
    await ctx.db.run('UPDATE profiles SET color = ? WHERE id = ?', [patch.color, id]);
  }
  emit('profiles');
}

/** Deletes a profile with its cards/logs/checks (verses are shared and kept). Keeps the active profile valid. */
export async function deleteProfile(ctx: DataContext, id: string): Promise<void> {
  const settings = await loadSettings(ctx.db);
  await ctx.db.tx(async (tx) => {
    const others = await tx.getAllAsync<{ id: string }>(
      'SELECT id FROM profiles WHERE id != ? ORDER BY sort_order, created_at',
      [id],
    );
    if (others.length === 0) throw new LastProfileError('Cannot delete the last profile');
    await tx.runAsync('DELETE FROM profiles WHERE id = ?', [id]);
    if (settings['profile.activeId'] === id)
      await writeSetting(tx, 'profile.activeId', others[0]!.id);
  });
  emit('profiles');
}
