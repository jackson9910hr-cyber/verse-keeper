import { openDatabaseAsync } from 'expo-sqlite';

import { CONNECTION_PRAGMAS, Database } from '@/data/db/database';
import type { BindValue, RunResult, SqlExecutor } from '@/data/db/types';

export const DB_NAME = 'verse-keeper.db';

export async function openAppDatabase(): Promise<Database> {
  const sqlite = await openDatabaseAsync(DB_NAME);
  await sqlite.execAsync(CONNECTION_PRAGMAS);
  const executor: SqlExecutor = {
    execAsync: (sql) => sqlite.execAsync(sql),
    runAsync: async (sql, params: BindValue[]): Promise<RunResult> => {
      const r = await sqlite.runAsync(sql, params);
      return { changes: r.changes, lastInsertRowId: r.lastInsertRowId };
    },
    getAllAsync: <T>(sql: string, params: BindValue[]) => sqlite.getAllAsync<T>(sql, params),
    getFirstAsync: <T>(sql: string, params: BindValue[]) => sqlite.getFirstAsync<T>(sql, params),
  };
  return new Database(executor);
}
