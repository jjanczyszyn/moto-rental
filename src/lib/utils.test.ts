import { describe, it, expect } from 'vitest';
import { formatDate, parseDate, calculateNights } from './utils';

describe('formatDate', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(formatDate(new Date(2026, 2, 13))).toBe('2026-03-13');
  });

  it('pads single-digit month and day', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('handles December', () => {
    expect(formatDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('parseDate', () => {
  it('parses YYYY-MM-DD string to Date', () => {
    const date = parseDate('2026-03-13');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2); // 0-indexed
    expect(date.getDate()).toBe(13);
  });

  it('roundtrips with formatDate', () => {
    const original = '2026-06-15';
    expect(formatDate(parseDate(original))).toBe(original);
  });
});

describe('calculateNights', () => {
  it('calculates 1 night', () => {
    const start = new Date(2026, 2, 13);
    const end = new Date(2026, 2, 14);
    expect(calculateNights(start, end)).toBe(1);
  });

  it('calculates 7 nights', () => {
    const start = new Date(2026, 2, 1);
    const end = new Date(2026, 2, 8);
    expect(calculateNights(start, end)).toBe(7);
  });

  it('calculates 30 nights', () => {
    const start = new Date(2026, 2, 1);
    const end = new Date(2026, 2, 31);
    expect(calculateNights(start, end)).toBe(30);
  });

  it('returns 0 for same day', () => {
    const date = new Date(2026, 2, 13);
    expect(calculateNights(date, date)).toBe(0);
  });
});
