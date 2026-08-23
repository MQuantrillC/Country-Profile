import { describe, expect, it } from 'vitest';
import { GET } from './route';

/** Call the route the way Next does, with a real Request. */
function request(query: string): Request {
  return new Request(`http://localhost/api/crime${query}`);
}

describe('GET /api/crime', () => {
  it('returns processed figures for a covered country', async () => {
    const response = await GET(request('?country=BR'));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.country).toBe('Brazil');
    expect(typeof data.year).toBe('number');
  });

  it('accepts an ISO2 code, which is what the app holds', async () => {
    const iso2 = await (await GET(request('?country=CO'))).json();
    const iso3 = await (await GET(request('?country=COL'))).json();
    expect(iso2.country).toBe(iso3.country);
  });

  it('is case-insensitive', async () => {
    const response = await GET(request('?country=br'));
    expect(response.status).toBe(200);
  });

  it('reaches countries the old hand-written map left out', async () => {
    // The previous ISO2->ISO3 map listed 71 countries while the dataset holds 206,
    // so most of it was unreachable. Nigeria was one of the missing ones.
    const response = await GET(request('?country=NG'));
    expect(response.status).toBe(200);
    expect((await response.json()).country).toBeTruthy();
  });

  it('omits the raw observation dump', async () => {
    // rawData was up to 508 kB per response and nothing rendered it.
    const data = await (await GET(request('?country=CO'))).json();
    expect(data.rawData).toBeUndefined();
    expect(JSON.stringify(data).length).toBeLessThan(4000);
  });

  it('404s for a country the dataset does not cover', async () => {
    // Chad is one of the 24 UN members UNODC publishes nothing for; the country
    // table's coverage flag says so up front.
    const response = await GET(request('?country=TD'));
    expect(response.status).toBe(404);
    expect((await response.json()).error).toMatch(/no unodc crime data/i);
  });

  it('404s for a code that is not a country at all', async () => {
    expect((await GET(request('?country=ZZ'))).status).toBe(404);
  });

  it('refuses a path-traversal attempt instead of reading outside the data directory', async () => {
    const response = await GET(request('?country=..%2F..%2Fpackage'));
    expect(response.status).toBe(404);
  });

  it('reports dataset coverage when no country is given', async () => {
    const data = await (await GET(request(''))).json();
    expect(data.totalCountries).toBeGreaterThan(150);
    expect(Array.isArray(data.availableCountries)).toBe(true);
    expect(data.yearRange.min).toBeLessThan(data.yearRange.max);
  });

  it('sets a cache header so repeat requests do not re-read from disk', async () => {
    const response = await GET(request('?country=BR'));
    expect(response.headers.get('Cache-Control')).toContain('s-maxage');
  });
});
