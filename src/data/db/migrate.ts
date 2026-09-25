import type { Database } from './database';
import { MIGRATIONS, type Migration } from './migrations';

export class DbNewerThanAppError extends Error {
  constructor(
    readonly dbVersion: number,
    readonly appVersion: number,
  ) {
    super(`Database schema v${dbVersion} is newer than this app (v${appVersion})`);
  }
}

export class MigrationError extends Error {
  constructor(
    readonly version: number,
    readonly original: unknown,
  ) {
    super(`Migration v${version} failed: ${String(original)}`);
  }
}

export async function getUserVersion(db: Database): Promise<number> {
  const row = await db.first<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

export function assertContiguous(migrations: readonly Migration[]): void {
  migrations.forEach((m, i) => {
    if (m.version !== i + 1)
      throw new Error(`Migration versions must be contiguous from 1 (got ${m.version} at ${i})`);
  });
}

/** Applies pending migrations, each in its own transaction together with the user_version bump. */
export async function migrate(
  db: Database,
  migrations: readonly Migration[] = MIGRATIONS,
): Promise<{ from: number; to: number }> {
  assertContiguous(migrations);
  const from = await getUserVersion(db);
  const latest = migrations.length;
  if (from > latest) throw new DbNewerThanAppError(from, latest);
  for (const m of migrations) {
    if (m.version <= from) continue;
    try {
      await db.tx(async (tx) => {
        await m.up(tx);
        await tx.execAsync(`PRAGMA user_version = ${m.version}`);
      });
    } catch (cause) {
      throw new MigrationError(m.version, cause);
    }
  }
  return { from, to: await getUserVersion(db) };
}
