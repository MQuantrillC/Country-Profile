// Shared query helpers for the World Bank Open Data API (api.worldbank.org/v2).
//
// The API accepts ISO 3166-1 alpha-2 codes directly, so no ISO2 -> ISO3 mapping is
// needed. It also accepts semicolon-separated indicator and country lists, which is
// what lets a whole country profile be fetched in a single request.

/**
 * How many years back to look for the most recent observation of an indicator.
 *
 * Slow-moving series (literacy, R&D spend, homicide rate) are published years
 * behind the fast ones, so a short window drops them entirely. Ten years raises
 * coverage from ~29/31 to ~31/31 for well-reported countries and from 22 to 24
 * for small ones. The observation year is shown next to the value so an older
 * figure is never mistaken for a current one.
 */
const LOOKBACK_YEARS = 10;

/**
 * A rolling `date=` window ending at the current year.
 *
 * This used to be hardcoded as `2020:2024`, which silently hid every observation
 * published after 2024. Deriving it from the clock means the app keeps working
 * without an annual edit.
 */
export function dateWindow(lookbackYears: number = LOOKBACK_YEARS): string {
  const currentYear = new Date().getFullYear();
  return `${currentYear - lookbackYears}:${currentYear}`;
}

/**
 * Maximum indicators per request.
 *
 * Measured against the live API: 26 indicators succeed, 28 are rejected with
 * "Invalid value". 20 leaves headroom in case the real constraint is URL length
 * rather than a count, since indicator codes vary in length.
 */
export const MAX_INDICATORS_PER_REQUEST = 20;

/** Split a list into chunks of at most `size`. */
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Build a batched indicator URL.
 *
 * Passing more than one indicator requires `source=2` (World Development
 * Indicators); the API rejects multi-indicator queries without it.
 */
export function indicatorUrl(
  countries: string | string[],
  indicators: string | string[],
  options: { perPage?: number; lookbackYears?: number } = {}
): string {
  const countryPath = Array.isArray(countries) ? countries.join(';') : countries;
  const indicatorList = Array.isArray(indicators) ? indicators : [indicators];
  const indicatorPath = indicatorList.join(';');

  const params = new URLSearchParams({
    format: 'json',
    per_page: String(options.perPage ?? 1000),
    date: dateWindow(options.lookbackYears),
  });

  // `source=2` is required for multi-indicator queries and harmless for single ones.
  if (indicatorList.length > 1) params.set('source', '2');

  return `https://api.worldbank.org/v2/country/${countryPath}/indicator/${indicatorPath}?${params}`;
}

/**
 * Fetch a World Bank URL, retrying when the API rate-limits.
 *
 * The API signals rate limiting with HTTP 200 and a body of
 * `[{message: [...]}]` rather than a 429, so a plain `response.ok` check treats
 * throttling as success and the caller sees a malformed payload. This detects that
 * shape and backs off. Firing a dozen bulk queries at once - which the rankings
 * page does - reliably triggers it.
 */
export async function fetchWorldBank(
  url: string,
  options: { attempts?: number; timeoutMs?: number } = {}
): Promise<unknown | null> {
  const attempts = options.attempts ?? 3;
  const timeoutMs = options.timeoutMs ?? 20_000;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      // 400ms, 800ms - the API recovers quickly once the burst clears.
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** (attempt - 1)));
    }

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Country-Profile-App/1.0' },
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) continue;

      const payload = await response.json();

      // A well-formed response is [metadata, rows]. Anything else is an error or
      // a throttle notice worth retrying.
      if (Array.isArray(payload) && payload.length >= 2 && Array.isArray(payload[1])) {
        return payload;
      }
    } catch {
      // Timed out or the connection failed - fall through to the next attempt.
    }
  }

  return null;
}

/** Shape of a single observation row in a World Bank v2 response. */
export interface WorldBankObservation {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
}

/**
 * Narrow an unknown World Bank response to its observation array.
 *
 * The API returns `[metadata, rows]` on success and `[{message: [...]}]` on error,
 * so the shape has to be checked rather than assumed.
 */
export function observationsFrom(payload: unknown): WorldBankObservation[] {
  if (!Array.isArray(payload) || payload.length < 2) return [];
  const rows = payload[1];
  return Array.isArray(rows) ? (rows as WorldBankObservation[]) : [];
}

/**
 * Whether a response is the API's error envelope.
 *
 * An unrecognised indicator code is not reported as an HTTP error: the API returns
 * 200 with `[{message: [...]}]` and no row array, which means one retired code
 * blanks out every indicator batched alongside it. This has to be told apart from a
 * legitimately empty result, or a country with no data would trigger a pointless
 * retry of every indicator individually.
 */
export function isErrorEnvelope(payload: unknown): boolean {
  if (!Array.isArray(payload) || payload.length === 0) return true;
  const head = payload[0] as { message?: unknown } | null;
  if (head && typeof head === 'object' && 'message' in head) return true;
  // A well-formed response always carries a row array in second position.
  return payload.length < 2 || !Array.isArray(payload[1]);
}

/**
 * Pick the most recent non-null observation per indicator.
 *
 * Rows come back newest-first per indicator, but that is not guaranteed when several
 * indicators are batched, so compare years explicitly.
 */
export function latestByIndicator(
  rows: WorldBankObservation[]
): Map<string, WorldBankObservation> {
  const latest = new Map<string, WorldBankObservation>();

  for (const row of rows) {
    if (row?.value == null) continue;
    const id = row.indicator?.id;
    if (!id) continue;

    const held = latest.get(id);
    if (!held || Number(row.date) > Number(held.date)) {
      latest.set(id, row);
    }
  }

  return latest;
}
