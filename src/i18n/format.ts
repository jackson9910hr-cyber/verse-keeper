import { dayOfWeek, parseLocalDate, type LocalDate } from '@/domain/time/localDate';

import type { UiLang } from './books';

const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'];
const EN_DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EN_MONTH = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** "9월 26일 (토)" / "Sat, Sep 26" — deterministic, no Intl dependency. */
export function formatLocalDate(date: LocalDate, lang: UiLang): string {
  const { month, day } = parseLocalDate(date);
  const dow = dayOfWeek(date);
  return lang === 'ko'
    ? `${month}월 ${day}일 (${KO_DOW[dow]})`
    : `${EN_DOW[dow]}, ${EN_MONTH[month - 1]} ${day}`;
}

export function formatTime(hhmm: string, lang: UiLang): string {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const mm = String(m).padStart(2, '0');
  if (lang === 'ko') return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${mm}`;
  return `${h % 12 === 0 ? 12 : h % 12}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}

export function formatEpoch(ms: number, lang: UiLang, offsetMinutes: number): string {
  const local = new Date(ms + offsetMinutes * 60_000);
  const date = local.toISOString().slice(0, 10);
  const time = local.toISOString().slice(11, 16);
  return `${formatLocalDate(date, lang)} ${formatTime(time, lang)}`;
}
