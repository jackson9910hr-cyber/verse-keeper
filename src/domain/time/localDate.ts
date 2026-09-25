/**
 * Calendar-date arithmetic that never touches the JS Date time-zone machinery.
 * Algorithms: Howard Hinnant, "chrono-Compatible Low-Level Date Algorithms".
 */

/** 'YYYY-MM-DD' in the device's local calendar. */
export type LocalDate = string;

const MS_PER_DAY = 86_400_000;
const LOCAL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface CivilDate {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
}

export function daysFromCivil({ year, month, day }: CivilDate): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = (month + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146_097 + doe - 719_468;
}

export function civilFromDays(days: number): CivilDate {
  const z = days + 719_468;
  const era = Math.floor(z / 146_097);
  const doe = z - era * 146_097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36_524) - Math.floor(doe / 146_096)) / 365,
  );
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  return { year: yoe + era * 400 + (month <= 2 ? 1 : 0), month, day };
}

const pad = (n: number, width: number) => String(n).padStart(width, '0');

export function formatLocalDate({ year, month, day }: CivilDate): LocalDate {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

export function isValidLocalDate(value: string): boolean {
  const m = LOCAL_DATE_RE.exec(value);
  if (!m) return false;
  const civil = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  if (civil.month < 1 || civil.month > 12 || civil.day < 1) return false;
  return formatLocalDate(civilFromDays(daysFromCivil(civil))) === value;
}

export function parseLocalDate(value: LocalDate): CivilDate {
  if (!isValidLocalDate(value)) throw new Error(`Invalid LocalDate: ${value}`);
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  return { year, month, day };
}

const toDays = (date: LocalDate) => daysFromCivil(parseLocalDate(date));
const fromDays = (days: number) => formatLocalDate(civilFromDays(days));

/** Converts an instant to the local calendar date, given the UTC offset in effect at that instant. */
export function toLocalDate(epochMs: number, offsetMinutes: number): LocalDate {
  return fromDays(Math.floor((epochMs + offsetMinutes * 60_000) / MS_PER_DAY));
}

export function addDays(date: LocalDate, n: number): LocalDate {
  return fromDays(toDays(date) + n);
}

/** a − b in days. */
export function diffDays(a: LocalDate, b: LocalDate): number {
  return toDays(a) - toDays(b);
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(date: LocalDate): number {
  const d = toDays(date);
  return (((d + 4) % 7) + 7) % 7; // 1970-01-01 was a Thursday
}

export function compareLocalDate(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
