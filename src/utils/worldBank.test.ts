import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCountryStats } from './worldBank';

/** A World Bank success envelope carrying the given rows. */
function ok(rows: unknown[]) {
  return {
    ok: true,
    json: async () => [{ page: 1, total: rows.length }, rows],
  };
}

/** The envelope the API returns when any indicator in the query is unrecognised. */
function invalidIndicator() {
  return {
    ok: true,
    json: async () => [{ message: [{ id: '120', key: 'Invalid value' }] }],
  };
}

function observation(indicator: string, date: string, value: number | null) {
  return {
    indicator: { id: indicator, value: indicator },
    country: { id: 'US', value: 'United States' },
    countryiso3code: 'USA',
    date,
    value,
  };
}

/** Indicator codes requested for a given fetch call, read back out of the URL. */
function indicatorsIn(url: string): string[] {
  return decodeURIComponent(url.split('/indicator/')[1].split('?')[0]).split(';');
}

const GDP = 'NY.GDP.MKTP.CD';
const POP = 'SP.POP.TOTL';
const CO2 = 'EN.GHG.CO2.PC.CE.AR5';

describe('fetchCountryStats', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('batches all indicators into a small number of requests', async () => {
    const fetchMock = vi.fn(async () => ok([]));
    vi.stubGlobal('fetch', fetchMock);

    await fetchCountryStats('US');

    // 31 indicators at 20 per request. The previous implementation made 64.
    expect(fetchMock.mock.calls.length).toBe(2);
  });

  it('requests every indicator exactly once', async () => {
    const requested: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      requested.push(...indicatorsIn(url));
      return ok([]);
    }));

    const stats = await fetchCountryStats('US');

    expect(new Set(requested).size).toBe(requested.length);
    expect(requested.length).toBe(Object.keys(stats).length);
  });

  it('uses the replacement CO2 indicator, not the retired one', () => {
    // EN.ATM.CO2E.PC was withdrawn and is now rejected outright, which silently
    // emptied the metric.
    const requested: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      requested.push(...indicatorsIn(url));
      return ok([]);
    }));

    return fetchCountryStats('US').then(() => {
      expect(requested).toContain(CO2);
      expect(requested).not.toContain('EN.ATM.CO2E.PC');
    });
  });

  it('maps observations onto the right metric keys', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const wanted = indicatorsIn(url);
      const rows = [
        observation(GDP, '2025', 30_769_700_000_000),
        observation(POP, '2025', 341_784_857),
      ].filter((r) => wanted.includes(r.indicator.id));
      return ok(rows);
    }));

    const stats = await fetchCountryStats('US');

    expect(stats.gdp.value).toBe(30_769_700_000_000);
    expect(stats.gdp.year).toBe('2025');
    expect(stats.gdp.status).toBe('ok');
    expect(stats.population.value).toBe(341_784_857);
  });

  it('marks an indicator with no observations as no-data, not failed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok([])));

    const stats = await fetchCountryStats('US');

    expect(stats.gdp.status).toBe('no-data');
    expect(stats.gdp.value).toBeNull();
  });

  it('preserves a genuine zero', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) =>
      ok(indicatorsIn(url).includes(GDP) ? [observation(GDP, '2024', 0)] : [])
    ));

    const stats = await fetchCountryStats('US');

    expect(stats.gdp.value).toBe(0);
    expect(stats.gdp.status).toBe('ok');
  });

  it('marks every metric failed when the whole request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network down');
    }));

    const stats = await fetchCountryStats('US');

    expect(Object.values(stats).every((m) => m.status === 'failed')).toBe(true);
  });

  it('marks every metric failed on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));

    const stats = await fetchCountryStats('US');

    expect(stats.gdp.status).toBe('failed');
  });

  it('retries individually when a batch is rejected, so one bad code costs one metric', async () => {
    // This is the failure that emptied 20 metrics at once before the fallback.
    const fetchMock = vi.fn(async (url: string) => {
      const wanted = indicatorsIn(url);
      if (wanted.length > 1) return invalidIndicator();
      if (wanted[0] === GDP) return invalidIndicator();
      if (wanted[0] === POP) return ok([observation(POP, '2025', 341_784_857)]);
      return ok([]);
    });
    vi.stubGlobal('fetch', fetchMock);

    const stats = await fetchCountryStats('US');

    // The healthy indicator still resolves despite sharing a batch with a bad one.
    expect(stats.population.value).toBe(341_784_857);
    expect(stats.population.status).toBe('ok');
    expect(stats.gdp.value).toBeNull();

    // The error envelope is indistinguishable from a rate-limit notice, so
    // fetchWorldBank retries each rejected request up to 3 times before the
    // caller falls back. That is 2 batches x 3, then 31 individual requests of
    // which only the bad code retries: 6 + 3 + 30.
    const metricCount = Object.keys(stats).length;
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(metricCount);
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(metricCount * 3 + 12);
  });

  it('keeps data from a batch that succeeded when another one fails', async () => {
    let call = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const wanted = indicatorsIn(url);
      call += 1;
      // Fail only the first multi-indicator batch; let its retries return nothing.
      if (wanted.length > 1 && call === 1) return invalidIndicator();
      if (wanted.includes(POP)) return ok([observation(POP, '2025', 1)]);
      return ok([]);
    }));

    const stats = await fetchCountryStats('US');

    expect(Object.values(stats).every((m) => m.status === 'failed')).toBe(false);
  });

  it('returns a complete stats object regardless of outcome', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline');
    }));

    const stats = await fetchCountryStats('US');

    for (const [key, metric] of Object.entries(stats)) {
      expect(metric, key).toHaveProperty('value');
      expect(metric, key).toHaveProperty('year');
      expect(metric, key).toHaveProperty('status');
      expect(metric.source, key).toBeTruthy();
    }
  });

  it('sends the country code without converting it to ISO3', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      urls.push(url);
      return ok([]);
    }));

    await fetchCountryStats('PE');

    expect(urls.every((u) => u.includes('/country/PE/'))).toBe(true);
  });
});
