import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

function request(query: string): Request {
  return new Request(`http://localhost/api/context${query}`);
}

/** Route each upstream to a canned response by matching its host. */
function routeFetch(handlers: Record<string, unknown | null>) {
  return vi.fn(async (url: string) => {
    for (const [fragment, body] of Object.entries(handlers)) {
      if (url.includes(fragment)) {
        if (body === null) return { ok: false, status: 503, json: async () => ({}) };
        return { ok: true, json: async () => body };
      }
    }
    return { ok: false, status: 404, json: async () => ({}) };
  });
}

const WIKI = { extract: 'Peru is a country.', content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Peru' } } };
const RATES = { rates: { PEN: 3.35 }, time_last_update_utc: 'Fri, 28 Aug 2026 00:02:31 +0000' };

/** A Comtrade row with the aggregate codes the route filters on. */
function tradeRow(partnerCode: number, value: number, extra: Record<string, unknown> = {}) {
  return { partnerCode, partner2Code: 0, motCode: 0, customsCode: 'C00', primaryValue: value, ...extra };
}

describe('GET /api/context', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('rejects a request with no country', async () => {
    expect((await GET(request(''))).status).toBe(400);
  });

  it('404s for an unknown country', async () => {
    expect((await GET(request('?country=ZZ'))).status).toBe(404);
  });

  it('returns every block when the upstreams cooperate', async () => {
    vi.stubGlobal('fetch', routeFetch({
      'wikipedia.org': WIKI,
      'open.er-api.com': RATES,
      'date.nager.at': [{ date: '2099-01-01', localName: 'Año Nuevo', name: "New Year's Day" }],
      'archive-api.open-meteo.com': {
        daily: { time: ['2024-01-01', '2024-07-01'], temperature_2m_mean: [22.1, 16.5], precipitation_sum: [1, 0] },
      },
      'imf.org': { values: { NGDP_RPCH: { PER: { '2024': 3.3, '2099': 2.8 } } } },
      'api.worldbank.org': [{ page: 1 }, [
        { indicator: { id: 'EG.ELC.HYRO.ZS', value: 'Hydro' }, country: { id: 'PE', value: 'Peru' }, countryiso3code: 'PER', date: '2021', value: 47.8 },
      ]],
      'earthquake.usgs.gov': { features: [{ properties: { time: 1558828800000, mag: 8, place: 'northern Peru' } }] },
      'comtradeapi.un.org': { data: [tradeRow(0, 100), tradeRow(156, 33)] },
    }));

    const data = await (await GET(request('?country=PE'))).json();

    expect(data.summary.extract).toBe('Peru is a country.');
    expect(data.money).toMatchObject({ code: 'PEN', perUsd: 3.35 });
    expect(data.holidays[0].localName).toBe('Año Nuevo');
    expect(data.climate.place).toBe('Lima');
    expect(data.outlook.points.length).toBeGreaterThan(0);
    expect(data.energy.sources[0]).toEqual({ label: 'Hydro', percent: 47.8 });
    expect(data.hazards.quakes[0].magnitude).toBe(8);
    expect(data.trade.partners[0]).toMatchObject({ code: 'CN', share: 33 });
  });

  it('returns null for a block whose upstream fails, without failing the request', async () => {
    // One broken source must not take the others down with it.
    vi.stubGlobal('fetch', routeFetch({
      'wikipedia.org': null,
      'open.er-api.com': RATES,
    }));

    const response = await GET(request('?country=PE'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary).toBeNull();
    expect(data.money.code).toBe('PEN');
  });

  it('survives an upstream that throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline');
    }));

    const response = await GET(request('?country=PE'));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ country: 'PE', summary: null, money: null });
  });

  it('samples climate at the capital, not the country centroid', async () => {
    // Peru's centroid is high in the Andes; its capital is on the coast. Getting
    // this wrong reported 5 C for Lima in January.
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      urls.push(url);
      return { ok: false, status: 503, json: async () => ({}) };
    }));

    await GET(request('?country=PE'));

    const climateUrl = urls.find((u) => u.includes('archive-api.open-meteo.com'));
    expect(climateUrl).toBeDefined();
    // Lima is near -12.04, -77.03.
    expect(climateUrl).toMatch(/latitude=-12\./);
    expect(climateUrl).toMatch(/longitude=-77\./);
  });

  it('marks future years as projections and past years as recorded', async () => {
    const currentYear = new Date().getFullYear();
    vi.stubGlobal('fetch', routeFetch({
      'imf.org': {
        values: { NGDP_RPCH: { PER: { [String(currentYear - 1)]: 3.3, [String(currentYear + 1)]: 2.8 } } },
      },
    }));

    const { outlook } = await (await GET(request('?country=PE'))).json();

    expect(outlook.points.find((p: { year: number }) => p.year === currentYear - 1).projected).toBe(false);
    expect(outlook.points.find((p: { year: number }) => p.year === currentYear + 1).projected).toBe(true);
  });

  it('uses only fully aggregated Comtrade rows', async () => {
    // Recent years split each partner by mode of transport. Taking the first
    // matching row gave a single freight mode: Peru showed $0.3B, not $74B.
    vi.stubGlobal('fetch', routeFetch({
      'comtradeapi.un.org': {
        data: [
          { partnerCode: 0, partner2Code: 0, motCode: 2200, customsCode: 'C00', primaryValue: 0.28e9 },
          tradeRow(0, 74.05e9),
          { partnerCode: 156, partner2Code: 0, motCode: 2100, customsCode: 'C00', primaryValue: 24.81e9 },
          tradeRow(156, 24.84e9),
        ],
      },
    }));

    const { trade } = await (await GET(request('?country=PE'))).json();

    expect(trade.totalExportsUsd).toBe(74.05e9);
    // One entry for China, not one per freight mode.
    expect(trade.partners.filter((p: { code: string }) => p.code === 'CN')).toHaveLength(1);
    expect(trade.partners[0].share).toBeCloseTo(33.5, 1);
  });

  it('resolves Comtrade partner codes that are not plain M49', async () => {
    // Comtrade reports the United States as 842, not M49's 840.
    vi.stubGlobal('fetch', routeFetch({
      'comtradeapi.un.org': { data: [tradeRow(0, 100), tradeRow(842, 50)] },
    }));

    const { trade } = await (await GET(request('?country=PE'))).json();

    expect(trade.partners[0]).toMatchObject({ code: 'US', name: 'United States' });
  });

  it('drops the World row from the partner list', async () => {
    vi.stubGlobal('fetch', routeFetch({
      'comtradeapi.un.org': { data: [tradeRow(0, 100), tradeRow(156, 33)] },
    }));

    const { trade } = await (await GET(request('?country=PE'))).json();

    expect(trade.partners.every((p: { name: string }) => p.name !== 'World')).toBe(true);
    expect(trade.partners).toHaveLength(1);
  });

  it('omits energy sources reporting zero, which cannot be drawn', async () => {
    vi.stubGlobal('fetch', routeFetch({
      'api.worldbank.org': [{ page: 1 }, [
        { indicator: { id: 'EG.ELC.HYRO.ZS', value: 'Hydro' }, countryiso3code: 'PER', country: { id: 'PE', value: 'Peru' }, date: '2021', value: 47.8 },
        { indicator: { id: 'EG.ELC.NUCL.ZS', value: 'Nuclear' }, countryiso3code: 'PER', country: { id: 'PE', value: 'Peru' }, date: '2021', value: 0 },
      ]],
    }));

    const { energy } = await (await GET(request('?country=PE'))).json();

    expect(energy.sources.map((s: { label: string }) => s.label)).toEqual(['Hydro']);
  });

  it('lists only holidays that have not passed', async () => {
    const year = new Date().getFullYear();
    // The route asks for this year and next; answer them separately, as the real
    // API does, rather than returning the same list twice.
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (!url.includes('date.nager.at')) return { ok: false, status: 404, json: async () => ({}) };
      const body = url.includes(`/${year}/`)
        ? [
            { date: '1999-01-01', localName: 'Long past', name: 'Past' },
            { date: '2099-12-25', localName: 'Navidad', name: 'Christmas' },
          ]
        : [];
      return { ok: true, json: async () => body };
    }));

    const { holidays } = await (await GET(request('?country=PE'))).json();

    expect(holidays).toHaveLength(1);
    expect(holidays[0].localName).toBe('Navidad');
  });
});
