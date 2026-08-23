// Kept as a re-export so existing imports keep working. The country table itself
// now lives in src/lib/countries.ts and is generated rather than hand-maintained.
//
// This file used to hold 152 hand-written entries, each carrying a `data` block of
// GDP, population, crime index and trading partners frozen around 2020. Nothing in
// the app ever read those fields - all figures come from the live APIs - so they
// were 25 kB of stale numbers waiting to be mistaken for real ones.

// The browser-facing list only. Server code that needs capital / currency /
// language / timezone data imports from lib/countries instead.
export { countries, getCountry, fromIso3, missingCoverage } from '../lib/countryList';
export type { Country, CountryCoverage } from '../lib/countryList';
