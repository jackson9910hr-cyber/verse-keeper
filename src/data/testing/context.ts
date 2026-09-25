import { FixedClock } from '@/domain/time/clock';

import type { DataContext } from '../context';
import { openTestDb } from './nodeSqlite';

/** 2026-09-25 12:00 KST */
export const TEST_NOW = Date.UTC(2026, 8, 25, 3);
export const KST = 540;

export async function makeTestContext(): Promise<DataContext & { clock: FixedClock }> {
  const { db } = await openTestDb();
  let n = 0;
  return { db, clock: new FixedClock(TEST_NOW, KST), newId: () => `id-${++n}` };
}

export const DAY = 86_400_000;
