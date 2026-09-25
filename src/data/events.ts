/** Minimal pub/sub so hooks can refetch after writes. Topics are coarse on purpose. */
export type DataTopic = 'verses' | 'cards' | 'reviews' | 'profiles' | 'family' | 'settings' | 'all';

type Listener = (topic: DataTopic) => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emit(topic: DataTopic): void {
  for (const l of [...listeners]) l(topic);
}
