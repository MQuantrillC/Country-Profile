import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

function request(query: string): Request {
  return new Request(`http://localhost/api/climate${query}`);
}

/** A CCKP response in the shape the live API returns: keyed by geography, then period. */
function cckp(iso3: string, value: number) {
  return {
    ok: true,
    json: async () => ({
      metadata: { apiVersion: 'v1', status: 'success', messages: [] },
      data: { [iso3]: { '1995-07': value } },
    }),
  };
}

/** How the Portal says "no coverage": HTTP 200, status success, an empty array. */
const empty = {
  ok: true,
  json: async () => ({
    metadata: { apiVersion: 'v1', status: 'success', messages: [] },
    data: [],
  }),
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /api/climate', () => {
  it('reads the value out of the geography-keyed payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('_tas_')) return cckp('ISL', 1.14);
        if (url.includes('_fd_')) return cckp('ISL', 194.8);
        return cckp('ISL', 0);
      })
    );

    const data = await (await GET(request('?country=IS'))).json();
    expect(data.averageTemperature).toBe(1.14);
    expect(data.coldDays).toBe(194.8);
    // Zero hot days is Iceland's real answer, not a missing one.
    expect(data.hotDays30).toBe(0);
  });

  it('asks for the only collection and period the Portal actually serves', async () => {
    // cru-x0.5 and era5-x0.25 over 1991-2020 still parse, so the Portal answers
    // 200 with status "success" and no data. The route used to read that as a rate
    // limit and substitute a hardcoded table of approximate temperatures.
    const fetchMock = vi.fn(async () => cckp('PER', 19.42));
    vi.stubGlobal('fetch', fetchMock);

    await GET(request('?country=PE'));
    for (const [url] of fetchMock.mock.calls as unknown as string[][]) {
      expect(url).toContain('cmip6-x0.25');
      expect(url).toContain('1995-2014');
      expect(url).toMatch(/\/PER\?/);
    }
  });

  it('returns null rather than a number when the Portal has no coverage', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => empty));

    const data = await (await GET(request('?country=IS'))).json();
    expect(data.averageTemperature).toBeNull();
    // Distinguishable from a genuine zero.
    expect(data.coldDays).toBeNull();
    expect(data.source).toBe('World Bank Climate Change Knowledge Portal');
  });

  it('survives one variable failing without losing the others', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('_hd35_') ? Promise.reject(new Error('timeout')) : cckp('USA', 10.23)
      )
    );

    const data = await (await GET(request('?country=US'))).json();
    expect(data.averageTemperature).toBe(10.23);
    expect(data.hotDays35).toBeNull();
  });

  it('accepts a single variable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => cckp('JPN', 12.23)));

    const data = await (await GET(request('?country=JP&variable=tas'))).json();
    expect(data.value).toBe(12.23);
    expect(data.variable).toBe('tas');
  });

  it('rejects a missing or unknown country instead of inventing one', async () => {
    expect((await GET(request(''))).status).toBe(400);
    expect((await GET(request('?country=ZZ'))).status).toBe(404);
  });
});
