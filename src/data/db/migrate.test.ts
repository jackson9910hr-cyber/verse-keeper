import { openTestDb } from '../testing/nodeSqlite';
import { Database } from './database';
import {
  DbNewerThanAppError,
  MigrationError,
  assertContiguous,
  getUserVersion,
  migrate,
} from './migrate';
import { LATEST_SCHEMA_VERSION, MIGRATIONS, type Migration } from './migrations';

const tables = async (db: Database) =>
  (
    await db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
  ).map((r) => r.name);

describe('migrate', () => {
  it('migrates an empty database (v0) to the latest version', async () => {
    const { db } = await openTestDb({ migrate: false });
    expect(await getUserVersion(db)).toBe(0);
    expect(await migrate(db)).toEqual({ from: 0, to: LATEST_SCHEMA_VERSION });
    expect(await tables(db)).toEqual([
      'cards',
      'family_checks',
      'family_weekly',
      'installed_packs',
      'profiles',
      'review_logs',
      'settings',
      'tags',
      'verse_tags',
      'verses',
    ]);
  });

  it('is idempotent', async () => {
    const { db } = await openTestDb();
    expect(await migrate(db)).toEqual({ from: LATEST_SCHEMA_VERSION, to: LATEST_SCHEMA_VERSION });
  });

  it('continues from an intermediate version', async () => {
    const { db } = await openTestDb({ migrate: false });
    const extra: Migration[] = [
      ...MIGRATIONS,
      {
        version: 2,
        name: 'add_note',
        up: (tx) => tx.execAsync('ALTER TABLE verses ADD COLUMN note TEXT'),
      },
    ];
    await migrate(db, MIGRATIONS);
    expect(await migrate(db, extra)).toEqual({ from: 1, to: 2 });
    const cols = await db.all<{ name: string }>('PRAGMA table_info(verses)');
    expect(cols.map((c) => c.name)).toContain('note');
  });

  it('rolls back a failing migration and keeps the previous version', async () => {
    const { db } = await openTestDb();
    const broken: Migration[] = [
      ...MIGRATIONS,
      {
        version: 2,
        name: 'broken',
        up: async (tx) => {
          await tx.execAsync('CREATE TABLE half_done (id INTEGER)');
          await tx.execAsync('THIS IS NOT SQL');
        },
      },
    ];
    await expect(migrate(db, broken)).rejects.toBeInstanceOf(MigrationError);
    expect(await getUserVersion(db)).toBe(1);
    expect(await tables(db)).not.toContain('half_done');
  });

  it('refuses to open a database newer than the app', async () => {
    const { db } = await openTestDb();
    await db.exec('PRAGMA user_version = 99');
    await expect(migrate(db)).rejects.toBeInstanceOf(DbNewerThanAppError);
  });

  it('requires contiguous versions', () => {
    expect(() => assertContiguous([{ version: 2, name: 'x', up: async () => {} }])).toThrow(
      'contiguous',
    );
    expect(() => assertContiguous(MIGRATIONS)).not.toThrow();
  });

  it('enables foreign keys on the connection', async () => {
    const { db } = await openTestDb();
    expect(await db.first<{ foreign_keys: number }>('PRAGMA foreign_keys')).toEqual({
      foreign_keys: 1,
    });
  });
});

describe('Database.tx', () => {
  it('serializes concurrent statements around a transaction', async () => {
    const { db } = await openTestDb();
    await db.exec('CREATE TABLE t (v TEXT)');
    const inTx = db.tx(async (tx) => {
      await tx.runAsync("INSERT INTO t VALUES ('a')", []);
      await new Promise((r) => setTimeout(r, 10));
      throw new Error('boom');
    });
    const outside = db.run("INSERT INTO t VALUES ('b')");
    await expect(inTx).rejects.toThrow('boom');
    await outside;
    expect(await db.all<{ v: string }>('SELECT v FROM t')).toEqual([{ v: 'b' }]);
  });
});
