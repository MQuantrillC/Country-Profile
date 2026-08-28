import { NextResponse } from 'next/server';
import { getCountry } from '../../../lib/countries';

// Reference data changes at most a few times a year; cache for a day and serve
// stale for a week while revalidating, so upstream outages stay invisible.
export const revalidate = 86400;

/**
 * Climatology from the World Bank Climate Change Knowledge Portal.
 *
 * The CCKP v1 path encodes eleven parameters. The combination this route used to
 * ask for - the `cru-x0.5` and `era5-x0.25` collections over 1991-2020 - still
 * parses, so the Portal answers HTTP 200 with `status: "success"` and an empty
 * data array. Measured against the live API, only the CMIP6 collection on its
 * 1995-2014 historical baseline returns values, so that is what is requested here.
 *
 * The previous version read that empty response as a rate limit and substituted a
 * hardcoded table of approximate temperatures. Every country in the table was
 * served invented numbers, and every country outside it was served nulls and
 * zeroes under the Portal's name - Iceland reported zero frost days a year.
 * Nothing is fabricated now: a variable with no coverage comes back null.
 */

const COLLECTION = 'cmip6-x0.25';

/** CMIP6's historical reference period. The Portal has no data for 1991-2020. */
const PERIOD = '1995-2014';

const DEFAULT_VARIABLES = ['tas', 'hd30', 'hd35', 'fd'];

const climatologyUrl = (variable, iso3) =>
  `https://cckpapi.worldbank.org/cckp/v1/${COLLECTION}_climatology_${variable}` +
  `_climatology_annual_${PERIOD}_median_historical_ensemble_all_mean/${iso3}?_format=json`;

async function fetchVariable(variable, iso3) {
  try {
    const response = await fetch(climatologyUrl(variable, iso3), {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return [variable, null];
    return [variable, await response.json()];
  } catch {
    return [variable, null];
  }
}

/**
 * Pull the number out of a CCKP response.
 *
 * The payload is keyed by geography and then by period start:
 * `{"data": {"PER": {"1995-07": 19.42}}}`. An empty `data` is how the Portal says
 * "no coverage", and it uses `[]` rather than `{}` for that, so both shapes have
 * to be handled.
 */
function extractClimateValue(payload, iso3) {
  const data = payload?.data;
  if (!data || Array.isArray(data)) return null;

  const forCountry = data[iso3] ?? Object.values(data)[0];
  if (!forCountry || typeof forCountry !== 'object') return null;

  const values = Object.values(forCountry).filter((v) => typeof v === 'number');
  return values.length > 0 ? values[values.length - 1] : null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('country');
  const variable = searchParams.get('variable'); // tas, hd30, hd35, fd, ...

  if (!code) {
    return NextResponse.json({ error: 'Missing country parameter' }, { status: 400 });
  }

  const country = getCountry(code);
  if (!country) {
    return NextResponse.json(
      { error: `Unknown country code: ${code.toUpperCase()}` },
      { status: 404 }
    );
  }

  const iso3 = country.iso3;
  const variables = variable ? [variable] : DEFAULT_VARIABLES;

  // The variables are independent, so fetch them together rather than in series.
  const settled = await Promise.all(variables.map((v) => fetchVariable(v, iso3)));
  const results = Object.fromEntries(settled);

  const headers = { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' };

  if (variable) {
    return NextResponse.json(
      {
        country: country.code,
        iso3,
        variable,
        value: extractClimateValue(results[variable], iso3),
        source: 'World Bank Climate Change Knowledge Portal',
        year: PERIOD,
      },
      { headers }
    );
  }

  const value = (v) => extractClimateValue(results[v], iso3);

  return NextResponse.json(
    {
      country: country.code,
      iso3,
      source: 'World Bank Climate Change Knowledge Portal',
      collection: COLLECTION,
      // A null here means the Portal publishes nothing, not zero. Zero is a real
      // answer for hot days in Iceland and for frost days in Nigeria, and the two
      // must stay distinguishable.
      year: PERIOD,
      averageTemperature: value('tas'),
      hotDays30: value('hd30'),
      hotDays35: value('hd35'),
      coldDays: value('fd'),
    },
    { headers }
  );
}
