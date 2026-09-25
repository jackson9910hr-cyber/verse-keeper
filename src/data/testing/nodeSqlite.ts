/** Jest-only SqlExecutor over Node's built-in node:sqlite. Never imported by app code. */
import { DatabaseSync } from 'node:sqlite';

import { CONNECTION_PRAGMAS, Database } from '../db/database';
import { migrate } from '../db/migrate';
import type { BindValue, RunResult, SqlExecutor } from '../db/types';

export class NodeSqliteExecutor implements SqlExecutor {
  readonly raw: DatabaseSync;
  constructor(path = ':memory:') {
    this.raw = new DatabaseSync(path);
  }
  async execAsync(sql: string): Promise<void> {
    this.raw.exec(sql);
  }
  async runAsync(sql: string, params: BindValue[]): Promise<RunResult> {
    const r = this.raw.prepare(sql).run(...params);
    return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) };
  }
  async getAllAsync<T>(sql: string, params: BindValue[]): Promise<T[]> {
    return this.raw.prepare(sql).all(...params) as T[];
  }
  async getFirstAsync<T>(sql: string, params: BindValue[]): Promise<T | null> {
    return (this.raw.prepare(sql).get(...params) as T | undefined) ?? null;
  }
}

export async function openTestDb(
  options: { migrate?: boolean } = {},
): Promise<{ db: Database; executor: NodeSqliteExecutor }> {
  const executor = new NodeSqliteExecutor();
  executor.raw.exec(CONNECTION_PRAGMAS);
  const db = new Database(executor);
  if (options.migrate !== false) await migrate(db);
  return { db, executor };
}
