import type { Clock } from '@/domain/time/clock';

import type { Database } from './db/database';

/** Everything the data layer needs, injected (real implementations come from src/platform). */
export interface DataContext {
  db: Database;
  clock: Clock;
  newId: () => string;
}
