import { formatEpoch, formatLocalDate, formatTime } from './format';

describe('format', () => {
  it('formats local dates in ko and en', () => {
    expect(formatLocalDate('2026-09-26', 'ko')).toBe('9월 26일 (토)');
    expect(formatLocalDate('2026-09-26', 'en')).toBe('Sat, Sep 26');
  });
  it('formats times', () => {
    expect(formatTime('20:05', 'ko')).toBe('오후 8:05');
    expect(formatTime('00:00', 'en')).toBe('12:00 AM');
    expect(formatTime('12:30', 'en')).toBe('12:30 PM');
  });
  it('formats an instant in a given offset', () => {
    expect(formatEpoch(Date.UTC(2026, 8, 25, 15, 30), 'ko', 540)).toBe('9월 26일 (토) 오전 12:30');
  });
});
