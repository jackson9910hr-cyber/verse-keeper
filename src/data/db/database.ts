import type { BindValue, RunResult, SqlExecutor } from './types';

/**
 * Serializes all access to the single SQLite connection so that statements issued by
 * unrelated async code can never interleave with an open transaction.
 */
export class Database {
  private tail: Promise<unknown> = Promise.resolve();

  constructor(private readonly executor: SqlExecutor) {}

  private lock<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.tail.then(fn);
    this.tail = result.catch(() => undefined);
    return result;
  }

  exec(sql: string): Promise<void> {
    return this.lock(() => this.executor.execAsync(sql));
  }

  run(sql: string, params: BindValue[] = []): Promise<RunResult> {
    return this.lock(() => this.executor.runAsync(sql, params));
  }

  all<T>(sql: string, params: BindValue[] = []): Promise<T[]> {
    return this.lock(() => this.executor.getAllAsync<T>(sql, params));
  }

  first<T>(sql: string, params: BindValue[] = []): Promise<T | null> {
    return this.lock(() => this.executor.getFirstAsync<T>(sql, params));
  }

  /** Runs `fn` inside BEGIN IMMEDIATE … COMMIT; rolls back and rethrows on error. Do not nest. */
  tx<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    return this.lock(async () => {
      await this.executor.execAsync('BEGIN IMMEDIATE');
      try {
        const value = await fn(this.executor);
        await this.executor.execAsync('COMMIT');
        return value;
      } catch (error) {
        await this.executor.execAsync('ROLLBACK');
        throw error;
      }
    });
  }
}

/** Per-connection settings (foreign_keys is not persisted in the file). */
export const CONNECTION_PRAGMAS = 'PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;';
