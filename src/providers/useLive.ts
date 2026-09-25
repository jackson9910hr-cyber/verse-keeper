import { useEffect, useState } from 'react';

import { subscribe } from '@/data/events';

export interface Live<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  reload: () => void;
}

/**
 * Runs an async query and re-runs it whenever the data layer emits a change.
 * `deps` must capture every input of the fetcher.
 */
export function useLive<T>(fetcher: () => Promise<T>, deps: readonly unknown[]): Live<T> {
  const [state, setState] = useState<{ data: T | undefined; error: unknown; loading: boolean }>({
    data: undefined,
    error: null,
    loading: true,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    let active = true;
    fetcher()
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (__DEV__) console.error(error);
        if (active) setState((s) => ({ ...s, error, loading: false }));
      });
    return () => {
      active = false;
    };
    // The caller lists the fetcher's inputs in `deps`; `version` re-runs it after data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return { ...state, reload: () => setVersion((v) => v + 1) };
}
