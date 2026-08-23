import { NextResponse } from 'next/server';
import { fromIso3 } from '../../../lib/countryList';
import {
  rankingMetrics,
  type RankingEntry,
  type RankingsPayload,
} from '../../../lib/rankingMetrics';
import {
  chunk,
  latestByIndicator,
  isErrorEnvelope,
  observationsFrom,
  type WorldBankObservation,
} from '../../../lib/worldBankQuery';

export const revalidate = 86400;

/**
 * Every country's most recent value for every ranking metric, in one request.
 *
 * The rankings page used to make one request per metric to /api/worldbank-single,
 * each returning the full unfiltered World Bank response (thousands of rows
 * including regional and income-group aggregates) for the browser to sift through
 * with a pile of country-name heuristics. This does the work once, on the server,
 * behind a 24-hour cache, and sends back only code/value/year.
 */

/**
 * How many years back to consider.
 *
 * `mrv` asks for the most recent N years per country-indicator pair, including
 * years where the value is null. Measured against the live API: mrv=1 leaves 5 of
 * 14 indicators completely empty because their latest year has no observations,
 * while mrv=5 covers all 14.
 */
const MOST_RECENT_YEARS = 5;

/**
 * Indicators per request.
 *
 * Deliberately smaller than the profile route's limit. These queries span every
 * country, so all 14 indicators in one request returns ~5.7 MB - over Next's 2 MB
 * fetch-cache ceiling, which made the cache silently do nothing and refetched the
 * lot on every revalidation. Five indicators per request keeps the largest
 * response near 1.5 MB, so all three are cached.
 */
const RANKINGS_BATCH_SIZE = 5;

function rankingsUrl(indicators: string[]): string {
  const params = new URLSearchParams({
    format: 'json',
    per_page: '20000',
    mrv: String(MOST_RECENT_YEARS),
    // Required whenever more than one indicator is requested.
    source: '2',
  });
  return `https://api.worldbank.org/v2/country/all/indicator/${indicators.join(';')}?${params}`;
}

async function fetchBatch(indicators: string[]): Promise<WorldBankObservation[] | null> {
  try {
    const response = await fetch(rankingsUrl(indicators), {
      headers: { 'User-Agent': 'Country-Profile-App/1.0' },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) return null;

    const payload = await response.json();

    // An unrecognised indicator code makes the API reject the whole query rather
    // than omit that series. Detect that envelope specifically: treating any empty
    // result as failure would retry all 14 indicators individually whenever the
    // upstream legitimately has nothing.
    if (isErrorEnvelope(payload)) return null;

    return observationsFrom(payload);
  } catch {
    return null;
  }
}

export async function GET() {
  const fetched = rankingMetrics.filter((m) => m.indicator);
  const batches = chunk(fetched.map((m) => m.indicator as string), RANKINGS_BATCH_SIZE);

  const results = await Promise.all(
    batches.map(async (batch) => {
      const rows = await fetchBatch(batch);
      if (rows) return rows;

      // Retry individually so one bad code costs one metric, not the whole batch.
      const individual = await Promise.all(batch.map((code) => fetchBatch([code])));
      const recovered = individual.filter((r): r is WorldBankObservation[] => r !== null);
      return recovered.length ? recovered.flat() : null;
    })
  );

  if (results.every((rows) => rows === null)) {
    return NextResponse.json(
      { error: 'The World Bank API could not be reached' },
      { status: 502 }
    );
  }

  const rows = results.flatMap((r) => r ?? []);

  // Group by country, then take each country's most recent non-null observation per
  // indicator. Rows whose ISO3 is not in our country table are dropped, which
  // removes every World Bank aggregate ("Arab World", "OECD members", income
  // groups) without needing to pattern-match their names.
  const byCountry = new Map<string, WorldBankObservation[]>();
  for (const row of rows) {
    const iso3 = row?.countryiso3code;
    if (!iso3 || !fromIso3(iso3)) continue;
    const existing = byCountry.get(iso3);
    if (existing) existing.push(row);
    else byCountry.set(iso3, [row]);
  }

  const metrics: Record<string, RankingEntry[]> = {};
  for (const metric of fetched) metrics[metric.id] = [];

  const indicatorToMetric = new Map(fetched.map((m) => [m.indicator as string, m.id]));

  for (const [iso3, countryRows] of byCountry) {
    const country = fromIso3(iso3);
    if (!country) continue;

    for (const [indicator, row] of latestByIndicator(countryRows)) {
      const metricId = indicatorToMetric.get(indicator);
      if (!metricId || row.value == null) continue;
      metrics[metricId].push({ code: country.code, value: row.value, year: row.date });
    }
  }

  // Metrics computed from another metric rather than fetched.
  for (const metric of rankingMetrics) {
    if (!metric.derivedFrom) continue;
    const base = metrics[metric.derivedFrom.metric];
    if (!base) continue;
    metrics[metric.id] = base.map((entry) => ({
      ...entry,
      // Clamped: the source percentage can exceed 100 through rounding.
      value: Math.max(0, 100 - entry.value),
    }));
  }

  // Sort once here so the client only ever reverses.
  for (const id of Object.keys(metrics)) {
    metrics[id].sort((a, b) => b.value - a.value);
  }

  const payload: RankingsPayload = {
    metrics,
    unavailable: rankingMetrics.filter((m) => !metrics[m.id]?.length).map((m) => m.id),
    source: 'World Bank Open Data',
  };

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  });
}
