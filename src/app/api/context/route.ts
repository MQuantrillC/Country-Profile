import { NextResponse } from 'next/server';
import { fromCcn3, getCountry } from '../../../lib/countries';
import {
  fetchWorldBank,
  indicatorUrl,
  isErrorEnvelope,
  latestByIndicator,
  observationsFrom,
} from '../../../lib/worldBankQuery';

// Context that rounds out a country profile: what the place is, what its money is
// worth, when it stops for holidays, what its weather is actually like, and where
// its economy is heading.
//
// One route rather than five, because the sources are independent and small: the
// browser makes a single request and the server fans out in parallel. Each block is
// optional, so one slow or broken upstream degrades that block alone.

export const revalidate = 86400;

interface Summary {
  extract: string;
  url: string;
}

interface Money {
  code: string;
  name: string;
  symbol: string;
  /** Units of this currency per 1 USD. */
  perUsd: number;
  asOf: string;
}

interface Holiday {
  date: string;
  localName: string;
  name: string;
}

interface Climate {
  /** Which place these readings describe. */
  place: string;
  /** Mean temperature per calendar month, January first, in Celsius. */
  monthlyMeanC: (number | null)[];
  /** Total precipitation per calendar month, in millimetres. */
  monthlyRainMm: (number | null)[];
  years: string;
}

interface EnergyMix {
  year: string;
  /** Share of electricity generation by source, summing to about 100. */
  sources: Array<{ label: string; percent: number }>;
}

interface Hazards {
  /** Significant earthquakes near the country over the lookback window. */
  quakes: Array<{ date: string; magnitude: number; place: string }>;
  windowYears: number;
}

interface TradePartners {
  year: string;
  totalExportsUsd: number;
  partners: Array<{ code: string | null; name: string; valueUsd: number; share: number }>;
}

interface Outlook {
  indicator: string;
  unit: string;
  points: Array<{ year: number; value: number; projected: boolean }>;
}

/** Fetch JSON, returning null rather than throwing so one failure cannot sink the rest. */
async function tryJson<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Country-Profile-App/1.0' },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(timeoutMs),
    });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

/** A one-paragraph description of the country. */
async function fetchSummary(name: string): Promise<Summary | null> {
  const data = await tryJson<{ extract?: string; content_urls?: { desktop?: { page?: string } } }>(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
  );
  if (!data?.extract) return null;
  return {
    extract: data.extract,
    url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`,
  };
}

/**
 * The country's currency against the dollar.
 *
 * Uses open.er-api.com rather than Frankfurter: Frankfurter republishes ECB
 * reference rates, which cover about 30 currencies, so most countries in the table
 * would have no rate at all.
 */
async function fetchMoney(
  currencies: Record<string, { name: string; symbol: string }>
): Promise<Money | null> {
  const [code, meta] = Object.entries(currencies)[0] ?? [];
  if (!code) return null;

  const data = await tryJson<{ rates?: Record<string, number>; time_last_update_utc?: string }>(
    'https://open.er-api.com/v6/latest/USD'
  );
  const rate = data?.rates?.[code];
  if (typeof rate !== 'number') return null;

  return {
    code,
    name: meta?.name ?? code,
    symbol: meta?.symbol ?? '',
    perUsd: rate,
    asOf: data?.time_last_update_utc ?? '',
  };
}

/** The next few public holidays, so the profile reflects the calendar people keep. */
async function fetchHolidays(iso2: string): Promise<Holiday[] | null> {
  const year = new Date().getFullYear();
  const [thisYear, nextYear] = await Promise.all([
    tryJson<Holiday[]>(`https://date.nager.at/api/v3/PublicHolidays/${year}/${iso2}`),
    tryJson<Holiday[]>(`https://date.nager.at/api/v3/PublicHolidays/${year + 1}/${iso2}`),
  ]);

  const all = [...(thisYear ?? []), ...(nextYear ?? [])];
  if (all.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);
  const seen = new Set<string>();

  return all
    .filter((h) => h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    // The two year queries should not overlap, but a repeated date would render
    // as a duplicate row.
    .filter((h) => {
      const key = `${h.date}|${h.localName}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5)
    .map((h) => ({ date: h.date, localName: h.localName, name: h.name }));
}

/**
 * Monthly climate normals for the capital.
 *
 * Open-Meteo's archive is a reanalysis dataset with global coverage, which the
 * World Bank's Climate Knowledge Portal is not - that source needed a hardcoded
 * fallback table for a handful of countries.
 */
async function fetchClimate(lat: number, lon: number, place: string): Promise<Climate | null> {
  // A recent decade, averaged: long enough to be a normal, short enough to be current.
  const end = new Date().getFullYear() - 1;
  const start = end - 9;

  const data = await tryJson<{
    daily?: { time?: string[]; temperature_2m_mean?: (number | null)[]; precipitation_sum?: (number | null)[] };
  }>(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
      `&start_date=${start}-01-01&end_date=${end}-12-31` +
      `&daily=temperature_2m_mean,precipitation_sum&timezone=UTC`,
    20000
  );

  const days = data?.daily?.time;
  if (!days?.length) return null;

  const tempSum = Array(12).fill(0);
  const tempCount = Array(12).fill(0);
  const rainSum = Array(12).fill(0);
  const rainYears = new Set<string>();

  days.forEach((day, i) => {
    const month = Number(day.slice(5, 7)) - 1;
    const temp = data?.daily?.temperature_2m_mean?.[i];
    const rain = data?.daily?.precipitation_sum?.[i];
    if (typeof temp === 'number') {
      tempSum[month] += temp;
      tempCount[month] += 1;
    }
    if (typeof rain === 'number') rainSum[month] += rain;
    rainYears.add(day.slice(0, 4));
  });

  const years = rainYears.size || 1;

  return {
    place,
    monthlyMeanC: tempSum.map((sum, m) => (tempCount[m] ? Number((sum / tempCount[m]).toFixed(1)) : null)),
    // Divided by the number of years to give a per-year monthly total.
    monthlyRainMm: rainSum.map((sum) => Number((sum / years).toFixed(0))),
    years: `${start}-${end}`,
  };
}

/**
 * IMF real GDP growth, including the projection years.
 *
 * Everything else in the app looks backwards. The IMF publishes past and forecast
 * observations in one series, so the split is marked rather than blurred.
 */
async function fetchOutlook(iso3: string): Promise<Outlook | null> {
  const data = await tryJson<{ values?: Record<string, Record<string, Record<string, number>>> }>(
    `https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/${iso3}`,
    12000
  );

  const byYear = data?.values?.NGDP_RPCH?.[iso3];
  if (!byYear) return null;

  const currentYear = new Date().getFullYear();
  const points = Object.entries(byYear)
    .map(([year, value]) => ({ year: Number(year), value, projected: Number(year) >= currentYear }))
    .filter((p) => Number.isFinite(p.year) && typeof p.value === 'number')
    // A decade back plus whatever the IMF projects forward.
    .filter((p) => p.year >= currentYear - 10)
    .sort((a, b) => a.year - b.year);

  return points.length ? { indicator: 'Real GDP growth', unit: '%', points } : null;
}

/**
 * Electricity generation by source.
 *
 * Ember publishes this and would be the natural source, but its API now requires a
 * key. The World Bank carries the same shares as EG.ELC.* indicators with no key,
 * which keeps the app dependency-free at the cost of a slightly older vintage.
 */
async function fetchEnergyMix(iso2: string): Promise<EnergyMix | null> {
  const SOURCES: Array<[string, string]> = [
    ['EG.ELC.HYRO.ZS', 'Hydro'],
    ['EG.ELC.NGAS.ZS', 'Natural gas'],
    ['EG.ELC.COAL.ZS', 'Coal'],
    ['EG.ELC.NUCL.ZS', 'Nuclear'],
    ['EG.ELC.PETR.ZS', 'Oil'],
    ['EG.ELC.RNWX.ZS', 'Other renewables'],
  ];

  const payload = await fetchWorldBank(
    indicatorUrl(iso2, SOURCES.map(([code]) => code)),
    { timeoutMs: 12000 }
  );
  if (!payload || isErrorEnvelope(payload)) return null;

  const latest = latestByIndicator(observationsFrom(payload));
  const sources = SOURCES
    .map(([code, label]) => {
      const row = latest.get(code);
      return row?.value != null ? { label, percent: Number(row.value.toFixed(1)), year: row.date } : null;
    })
    .filter((s): s is { label: string; percent: number; year: string } => s !== null)
    // Zero is a real answer (no nuclear), but a zero slice cannot be drawn.
    .filter((s) => s.percent > 0)
    .sort((a, b) => b.percent - a.percent);

  if (sources.length === 0) return null;

  return {
    // Sources are published on slightly different schedules; report the oldest
    // year in the mix rather than implying they are all current.
    year: sources.map((s) => s.year).sort()[0],
    sources: sources.map(({ label, percent }) => ({ label, percent })),
  };
}

/**
 * Significant earthquakes within the country's bounding region.
 *
 * USGS is queried by circle rather than by country because the feed has no country
 * filter, so this is "near", not "inside".
 */
async function fetchHazards(lat: number, lon: number): Promise<Hazards | null> {
  const WINDOW_YEARS = 10;
  const start = new Date();
  start.setFullYear(start.getFullYear() - WINDOW_YEARS);

  const data = await tryJson<{ features?: Array<{ properties?: { time?: number; mag?: number; place?: string } }> }>(
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson` +
      `&starttime=${start.toISOString().slice(0, 10)}` +
      `&latitude=${lat}&longitude=${lon}&maxradiuskm=800&minmagnitude=6&limit=10&orderby=magnitude`,
    12000
  );

  const quakes = (data?.features ?? [])
    .map((f) => ({
      date: f.properties?.time ? new Date(f.properties.time).toISOString().slice(0, 10) : '',
      magnitude: f.properties?.mag ?? 0,
      place: f.properties?.place ?? '',
    }))
    .filter((q) => q.date && q.magnitude > 0);

  return quakes.length ? { quakes, windowYears: WINDOW_YEARS } : null;
}

/**
 * Real bilateral export flows from UN Comtrade.
 *
 * The existing /api/comtrade route is named for Comtrade but actually parses the
 * CIA Factbook's prose. This is the real thing: Comtrade's public preview endpoint
 * serves partner-level totals without a key. Partners are identified by M49
 * numeric code, which is why the country table carries ccn3.
 */
const COMTRADE_PARTNER_OVERRIDES: Record<string, string> = {
  // Comtrade mostly uses M49, but a few of its codes are its own composites.
  '842': 'US', // United States including Puerto Rico and the US Virgin Islands
  '699': 'IN', // India
  '757': 'CH', // Switzerland including Liechtenstein
  '251': 'FR', // France including Monaco
  '381': 'IT', // Italy including San Marino and the Holy See
  '058': 'BE', // Belgium-Luxembourg, reported jointly for historical series
  '490': 'TW', // "Other Asia, not elsewhere specified", in practice Taiwan
};

/** Resolve a Comtrade partner code to a country, allowing for its own composites. */
function resolvePartner(code: number) {
  const padded = String(code).padStart(3, '0');
  const override = COMTRADE_PARTNER_OVERRIDES[padded];
  return override ? getCountry(override) : fromCcn3(padded);
}

async function fetchTradePartners(ccn3: string | null): Promise<TradePartners | null> {
  if (!ccn3) return null;

  // The preview endpoint lags; ask for the most recent year likely to be final.
  const year = new Date().getFullYear() - 2;
  const data = await tryJson<{
    data?: Array<{
      partnerCode?: number;
      partner2Code?: number;
      motCode?: number;
      customsCode?: string;
      primaryValue?: number;
    }>;
  }>(
    `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${Number(ccn3)}` +
      `&period=${year}&flowCode=X&partnerCode=&cmdCode=TOTAL`,
    15000
  );

  // Recent years are broken out by mode of transport, so each partner appears
  // several times (China eight ways in 2024) and picking the first match returns
  // one freight mode rather than the country total. These three codes select the
  // fully-aggregated row: all secondary partners, all transport modes, all
  // customs procedures.
  const rows = (data?.data ?? []).filter(
    (r) => r.partner2Code === 0 && r.motCode === 0 && r.customsCode === 'C00'
  );
  if (rows.length === 0) return null;

  // Partner 0 is "World", which is the total rather than a partner.
  const total = rows.find((r) => r.partnerCode === 0)?.primaryValue ?? 0;
  if (!total) return null;

  const partners = rows
    .filter((r) => r.partnerCode !== 0 && (r.primaryValue ?? 0) > 0)
    .sort((a, b) => (b.primaryValue ?? 0) - (a.primaryValue ?? 0))
    .slice(0, 8)
    .map((r) => {
      const partner = resolvePartner(r.partnerCode ?? 0);
      return {
        code: partner?.code ?? null,
        name: partner?.name ?? `Partner ${r.partnerCode}`,
        valueUsd: r.primaryValue ?? 0,
        share: Number((((r.primaryValue ?? 0) / total) * 100).toFixed(1)),
      };
    });

  return partners.length ? { year: String(year), totalExportsUsd: total, partners } : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('country');

  if (!code) {
    return NextResponse.json({ error: 'Country parameter is required' }, { status: 400 });
  }

  const country = getCountry(code);
  if (!country) {
    return NextResponse.json(
      { error: `Unknown country code: ${code.toUpperCase()}` },
      { status: 404 }
    );
  }

  // The capital, not the country centroid. Sampling the centroid reports the
  // climate of empty interior - the Andes for Peru, a glacier for Iceland -
  // rather than the climate almost every resident actually experiences.
  const [lat, lon] = country.capitalCoords ?? [null, null];

  const [summary, money, holidays, climate, outlook, energy, hazards, trade] = await Promise.all([
    fetchSummary(country.name),
    fetchMoney(country.currencies),
    fetchHolidays(country.code),
    lat != null && lon != null
      ? fetchClimate(lat, lon, country.capital[0] ?? country.name)
      : Promise.resolve(null),
    fetchOutlook(country.iso3),
    fetchEnergyMix(country.code),
    lat != null && lon != null ? fetchHazards(lat, lon) : Promise.resolve(null),
    fetchTradePartners(country.ccn3),
  ]);

  return NextResponse.json(
    { country: country.code, summary, money, holidays, climate, outlook, energy, hazards, trade },
    { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
  );
}
