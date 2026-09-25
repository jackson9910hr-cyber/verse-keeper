import { useEffect, useState } from 'react';

import { subscribe, type DataTopic } from '@/data/events';

export interface Live<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  reload: () => void;
}

/**
 * Runs an async query and re-runs it when the data layer emits one of `topics` (or 'all').
 * `deps` must capture every input of the fetcher.
 */
export function useLive<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
  topics: readonly DataTopic[],
): Live<T> {
  const [state, setState] = useState<{ data: T | undefined; error: unknown; loading: boolean }>({
    data: undefined,
    error: null,
    loading: true,
  });
  const [version, setVersion] = useState(0);

  const topicKey = topics.join(',');
  useEffect(
    () =>
      subscribe((topic) => {
        if (topic === 'all' || topicKey.split(',').includes(topic)) setVersion((v) => v + 1);
      }),
    [topicKey],
  );

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
