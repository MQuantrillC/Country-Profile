import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chunk,
  dateWindow,
  indicatorUrl,
  latestByIndicator,
  observationsFrom,
  MAX_INDICATORS_PER_REQUEST,
  type WorldBankObservation,
} from './worldBankQuery';

/** Minimal observation row, with only the fields the helpers read. */
function row(
  indicator: string,
  date: string,
  value: number | null,
  iso3 = 'USA'
): WorldBankObservation {
  return {
    indicator: { id: indicator, value: indicator },
    country: { id: 'US', value: 'United States' },
    countryiso3code: iso3,
    date,
    value,
  };
}

describe('dateWindow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-22T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('ends at the current year rather than a hardcoded one', () => {
    // The original bug: `2020:2024` was baked in, so everything published later
    // was invisible.
    expect(dateWindow()).toBe('2016:2026');
  });

  it('moves with the clock', () => {
    vi.setSystemTime(new Date('2031-06-15T12:00:00Z'));
    expect(dateWindow()).toBe('2021:2031');
  });

  it('honours an explicit lookback', () => {
    expect(dateWindow(3)).toBe('2023:2026');
  });
});

describe('chunk', () => {
  it('splits into batches of at most the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns a single batch when the list fits', () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it('returns nothing for an empty list', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('keeps batches within the API limit for the full indicator set', () => {
    // 31 indicators is what the profile page requests.
    const batches = chunk(Array.from({ length: 31 }, (_, i) => `I${i}`), MAX_INDICATORS_PER_REQUEST);
    expect(batches).toHaveLength(2);
    for (const batch of batches) {
      expect(batch.length).toBeLessThanOrEqual(MAX_INDICATORS_PER_REQUEST);
    }
  });
});

describe('indicatorUrl', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-22T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('passes an ISO2 code straight through', () => {
    // The API accepts alpha-2, which is why the old ISO2->ISO3 maps were dropped.
    expect(indicatorUrl('PE', 'NY.GDP.MKTP.CD')).toContain('/country/PE/indicator/NY.GDP.MKTP.CD');
  });

  it('omits source for a single indicator', () => {
    expect(indicatorUrl('PE', 'NY.GDP.MKTP.CD')).not.toContain('source=');
  });

  it('adds source=2 for multiple indicators, which the API requires', () => {
    const url = indicatorUrl('PE', ['NY.GDP.MKTP.CD', 'SP.POP.TOTL']);
    expect(url).toContain('source=2');
    expect(url).toContain('/indicator/NY.GDP.MKTP.CD;SP.POP.TOTL?');
  });

  it('joins multiple countries with a semicolon', () => {
    expect(indicatorUrl(['PE', 'US'], 'SP.POP.TOTL')).toContain('/country/PE;US/');
  });

  it('uses the rolling date window', () => {
    expect(indicatorUrl('PE', 'SP.POP.TOTL')).toContain('date=2016%3A2026');
  });
});

describe('observationsFrom', () => {
  it('extracts the row array from a successful response', () => {
    const payload = [{ page: 1 }, [row('A', '2024', 1)]];
    expect(observationsFrom(payload)).toHaveLength(1);
  });

  it('returns nothing for an error response', () => {
    // The API signals a bad indicator code with a single-element array, not an
    // HTTP error - this is what makes a retired code poison a whole batch.
    const payload = [{ message: [{ id: '120', key: 'Invalid value' }] }];
    expect(observationsFrom(payload)).toEqual([]);
  });

  it('returns nothing for a null row array', () => {
    expect(observationsFrom([{ page: 1 }, null])).toEqual([]);
  });

  it('returns nothing for non-array input', () => {
    expect(observationsFrom({ unexpected: true })).toEqual([]);
    expect(observationsFrom(null)).toEqual([]);
  });
});

describe('latestByIndicator', () => {
  it('picks the most recent year per indicator', () => {
    const latest = latestByIndicator([
      row('GDP', '2022', 100),
      row('GDP', '2024', 300),
      row('GDP', '2023', 200),
    ]);
    expect(latest.get('GDP')?.value).toBe(300);
    expect(latest.get('GDP')?.date).toBe('2024');
  });

  it('ignores null values so an empty recent year does not mask an older figure', () => {
    const latest = latestByIndicator([
      row('GDP', '2025', null),
      row('GDP', '2021', 50),
    ]);
    expect(latest.get('GDP')?.value).toBe(50);
    expect(latest.get('GDP')?.date).toBe('2021');
  });

  it('keeps a genuine zero, which is a real value and not missing data', () => {
    const latest = latestByIndicator([row('TERROR_DEATHS', '2024', 0)]);
    expect(latest.get('TERROR_DEATHS')?.value).toBe(0);
  });

  it('tracks each indicator separately', () => {
    const latest = latestByIndicator([
      row('GDP', '2024', 1),
      row('POP', '2020', 2),
    ]);
    expect(latest.size).toBe(2);
    expect(latest.get('POP')?.value).toBe(2);
  });

  it('does not rely on row order', () => {
    const ascending = latestByIndicator([row('GDP', '2020', 1), row('GDP', '2024', 9)]);
    const descending = latestByIndicator([row('GDP', '2024', 9), row('GDP', '2020', 1)]);
    expect(ascending.get('GDP')?.value).toBe(descending.get('GDP')?.value);
  });

  it('skips rows with no indicator id', () => {
    const latest = latestByIndicator([
      { date: '2024', value: 5 } as unknown as WorldBankObservation,
    ]);
    expect(latest.size).toBe(0);
  });
});
