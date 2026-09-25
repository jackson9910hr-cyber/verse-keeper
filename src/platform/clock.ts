import type { Clock } from '@/domain/time/clock';

/** The only place that reads the device clock and time zone. */
export const systemClock: Clock = {
  now: () => Date.now(),
  tzOffsetMinutes: (at) => -new Date(at).getTimezoneOffset(),
};
