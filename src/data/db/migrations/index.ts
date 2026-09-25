import type { SqlExecutor } from '../types';
import { m001Init } from './m001_init';

export interface Migration {
  version: number;
  name: string;
  up(tx: SqlExecutor): Promise<void>;
}

/** Append-only. Versions must be contiguous from 1. */
export const MIGRATIONS: readonly Migration[] = [{ version: 1, name: 'init', up: m001Init }];

export const LATEST_SCHEMA_VERSION = MIGRATIONS.length;
