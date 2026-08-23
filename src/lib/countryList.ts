// The country list the browser gets: enough to render the picker, nothing more.
//
// Kept separate from lib/countries.ts on purpose. That module carries capital,
// currency, language and timezone data for every country - useful on the server,
// but ~75 kB of dead weight in the client bundle, since the picker only ever shows
// a flag and a name.

import listData from '../data/country-list.json';

export interface CountryCoverage {
  /** World Bank Open Data - accepts ISO2 directly, so this is always true. */
  worldBank: boolean;
  /** CIA World Factbook mirror - needs a GEC code, which not every country has. */
  factbook: boolean;
  /** UNODC crime statistics - published for roughly 170 countries. */
  crime: boolean;
}

export interface Country {
  /** ISO 3166-1 alpha-2. The app's primary key for a country. */
  code: string;
  /** ISO 3166-1 alpha-3, which is how World Bank rows identify a country. */
  iso3: string;
  name: string;
  flag: string;
  coverage: CountryCoverage;
}

export const countries: Country[] = listData as Country[];

const byCode = new Map(countries.map((c) => [c.code, c]));
const byIso3 = new Map(countries.map((c) => [c.iso3, c]));

/** Look up a country by ISO2 code (case-insensitive). */
export function getCountry(code: string | null | undefined): Country | undefined {
  if (!code) return undefined;
  return byCode.get(code.toUpperCase());
}

/**
 * Which of the app's datasets have no figures for this country.
 *
 * Used to tell the reader up front that, say, the Factbook does not cover Nauru -
 * rather than letting a whole section render as N/A with no explanation.
 */
export function missingCoverage(code: string): (keyof CountryCoverage)[] {
  const country = getCountry(code);
  if (!country) return [];
  return (Object.keys(country.coverage) as (keyof CountryCoverage)[]).filter(
    (dataset) => !country.coverage[dataset]
  );
}

/**
 * Resolve an ISO3 code to its country.
 *
 * World Bank responses identify countries by ISO3, so the rankings page needs this
 * to match a row back to a flag and a name.
 */
export function fromIso3(iso3: string | null | undefined): Country | undefined {
  if (!iso3) return undefined;
  return byIso3.get(iso3.toUpperCase());
}
