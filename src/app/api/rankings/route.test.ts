import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';
import { rankingMetrics, type RankingsPayload } from '../../../lib/rankingMetrics';

function observation(indicator: string, iso3: string, date: string, value: number | null) {
  return {
    indicator: { id: indicator, value: indicator },
    country: { id: iso3.slice(0, 2), value: iso3 },
    countryiso3code: iso3,
    date,
    value,
  };
}

function ok(rows: unknown[]) {
  return { ok: true, json: async () => [{ page: 1, total: rows.length }, rows] };
}

const GDP = 'NY.GDP.MKTP.CD';
const URBAN = 'SP.URB.TOTL.IN.ZS';

/** Serve the given rows to whichever batch asks for their indicator. */
function serve(rows: ReturnType<typeof observation>[]) {
  return vi.fn(async (url: string) => {
    const wanted = decodeURIComponent(url.split('/indicator/')[1].split('?')[0]).split(';');
    return ok(rows.filter((r) => wanted.includes(r.indicator.id)));
  });
}

async function payloadFrom(response: Response): Promise<RankingsPayload> {
  return response.json();
}

describe('GET /api/rankings', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('asks for every fetched metric across a small number of requests', async () => {
    const fetchMock = serve([]);
    vi.stubGlobal('fetch', fetchMock);

    await GET();

    // 14 fetched indicators fit in one batch; the page used to make 14 requests.
    expect(fetchMock.mock.calls.length).toBe(1);
  });

  it('returns an entry for a country the World Bank has data for', async () => {
    vi.stubGlobal('fetch', serve([observation(GDP, 'USA', '2025', 30_769_700_000_000)]));

    const payload = await payloadFrom(await GET());

    expect(payload.metrics.gdp).toEqual([
      { code: 'US', value: 30_769_700_000_000, year: '2025' },
    ]);
  });

  it('drops World Bank aggregates, which are not countries', async () => {
    // "World", "Arab World", "OECD members" and the income groups all arrive as
    // ordinary rows and used to be filtered by matching their names.
    vi.stubGlobal('fetch', serve([
      observation(GDP, 'WLD', '2025', 1e14),
      observation(GDP, 'ARB', '2025', 5e12),
      observation(GDP, 'OED', '2025', 6e13),
      observation(GDP, 'HIC', '2025', 7e13),
      observation(GDP, 'USA', '2025', 3e13),
    ]));

    const payload = await payloadFrom(await GET());

    expect(payload.metrics.gdp.map((e) => e.code)).toEqual(['US']);
  });

  it('sorts each ranking from highest to lowest', async () => {
    vi.stubGlobal('fetch', serve([
      observation(GDP, 'PER', '2025', 3),
      observation(GDP, 'USA', '2025', 100),
      observation(GDP, 'BRA', '2025', 20),
    ]));

    const payload = await payloadFrom(await GET());

    expect(payload.metrics.gdp.map((e) => e.value)).toEqual([100, 20, 3]);
  });

  it('takes each country its most recent non-null year', async () => {
    vi.stubGlobal('fetch', serve([
      observation(GDP, 'USA', '2025', null),
      observation(GDP, 'USA', '2023', 27),
      observation(GDP, 'USA', '2024', 29),
    ]));

    const payload = await payloadFrom(await GET());

    expect(payload.metrics.gdp).toEqual([{ code: 'US', value: 29, year: '2024' }]);
  });

  it('derives rural population from urban for every country, not just the top ten', async () => {
    // The old page computed this then sliced to 10 before the client re-sorted, so
    // "Lowest 10" showed the bottom of the top 10.
    const rows = [
      observation(URBAN, 'USA', '2025', 80),
      observation(URBAN, 'PER', '2025', 78),
      observation(URBAN, 'BRA', '2025', 88),
      observation(URBAN, 'IND', '2025', 36),
    ];
    vi.stubGlobal('fetch', serve(rows));

    const payload = await payloadFrom(await GET());

    expect(payload.metrics.ruralPopPct).toHaveLength(rows.length);
    expect(payload.metrics.ruralPopPct[0]).toEqual({ code: 'IN', value: 64, year: '2025' });
    // Highest rural is the lowest urban, and the two lists are exact complements.
    for (const entry of payload.metrics.ruralPopPct) {
      const urban = payload.metrics.urbanPopPct.find((u) => u.code === entry.code);
      expect(entry.value + urban!.value).toBeCloseTo(100, 6);
    }
  });

  it('never reports a negative rural percentage', async () => {
    // Rounding upstream can push urban slightly past 100.
    vi.stubGlobal('fetch', serve([observation(URBAN, 'SGP', '2025', 100.4)]));

    const payload = await payloadFrom(await GET());

    expect(payload.metrics.ruralPopPct[0].value).toBe(0);
  });

  it('lists metrics with no data as unavailable', async () => {
    vi.stubGlobal('fetch', serve([observation(GDP, 'USA', '2025', 1)]));

    const payload = await payloadFrom(await GET());

    expect(payload.unavailable).not.toContain('gdp');
    expect(payload.unavailable).toContain('homicideRate');
  });

  it('includes a key for every catalogued metric', async () => {
    vi.stubGlobal('fetch', serve([observation(URBAN, 'USA', '2025', 80)]));

    const payload = await payloadFrom(await GET());

    for (const metric of rankingMetrics) {
      expect(payload.metrics[metric.id], metric.id).toBeDefined();
    }
  });

  it('returns 502 when the World Bank cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline');
    }));

    const response = await GET();

    expect(response.status).toBe(502);
  });

  it('sends a compact payload rather than raw upstream rows', async () => {
    vi.stubGlobal('fetch', serve([observation(GDP, 'USA', '2025', 1)]));

    const payload = await payloadFrom(await GET());

    // Only code/value/year, so the browser is not shipped the full response.
    expect(Object.keys(payload.metrics.gdp[0]).sort()).toEqual(['code', 'value', 'year']);
  });
});
