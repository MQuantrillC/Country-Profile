import { NextResponse } from 'next/server';
import { getCountry } from '../../../lib/countries';

// Served from the bundled country table, so there is nothing upstream to revalidate.
export const revalidate = false;

/**
 * Country reference data: capital, currency, languages, timezones, region.
 *
 * This used to proxy restcountries.com/v3.1. That API was deprecated and now
 * answers every request with HTTP 200 and an error body, which this route happily
 * forwarded - so the whole Country Information panel had silently gone blank while
 * still looking like a successful response. v5 requires an API key.
 *
 * The data is reference material that changes about once a decade, so it is now
 * generated into src/data/countries.json at build time (see
 * scripts/generate-countries.js) and served from memory.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('country');

  if (!code) {
    return NextResponse.json({ error: 'Country code is required' }, { status: 400 });
  }

  const country = getCountry(code);

  if (!country) {
    return NextResponse.json(
      { error: `Unknown country code: ${code.toUpperCase()}` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    capital: country.capital,
    currencies: country.currencies,
    languages: country.languages,
    continents: country.region ? [country.region] : [],
    googleMaps: country.googleMaps,
    region: country.region,
    subregion: country.subregion,
    timezones: country.timezones,
    flag: country.flag,
  });
}
