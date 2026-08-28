// Regenerates src/data/countries.json - the single country table the whole app uses.
//
// Two problems this solves.
//
// 1. The app carried four hand-maintained country lists that had drifted apart
//    (152 in the dropdown; 105 / 147 / 119 / 71 in the various route maps), so a
//    country could appear in the picker and then silently return nothing from half
//    its sources.
//
// 2. restcountries.com v3.1 was deprecated and now answers every request with HTTP
//    200 and an error body, so /api/restcountries had quietly stopped returning
//    real data. v5 requires an API key. Since capital / currency / language /
//    timezone are reference data that change once in a decade, they are baked in at
//    build time instead - no key, no runtime dependency, no outage.
//
// Sources (both public, key-less, and the upstreams REST Countries itself is built
// from):
//   mledoze/countries                        - languages, ISO codes, UN membership
//   dr5hn/countries-states-cities-database   - timezones, capital, currency, coords
//
// Run with: npm run generate-countries

const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '../src/data/countries.json');
const LIST_OUTPUT = path.join(__dirname, '../src/data/country-list.json');
const CRIME_INDEX = path.join(__dirname, '../src/data/crime/index.json');
const GEC_MAP = path.join(__dirname, 'gec-codes.json');

const MLEDOZE_URL =
  'https://raw.githubusercontent.com/mledoze/countries/master/countries.json';
const DR5HN_URL =
  'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries.json';

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return response.json();
}

/**
 * Collapse a country's IANA zones into the distinct "UTC±HH:MM" offsets the UI
 * shows, matching the shape the old REST Countries response used.
 */
function toUtcOffsets(timezones) {
  if (!Array.isArray(timezones)) return [];

  const offsets = new Set();
  for (const zone of timezones) {
    const seconds = zone?.gmtOffset;
    if (typeof seconds !== 'number') continue;

    const sign = seconds < 0 ? '-' : '+';
    const abs = Math.abs(seconds);
    const hours = String(Math.floor(abs / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((abs % 3600) / 60)).padStart(2, '0');
    offsets.add(`UTC${sign}${hours}:${minutes}`);
  }

  return [...offsets].sort();
}

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/**
 * Resolve a capital city to coordinates.
 *
 * Climate has to be sampled where the people are. Sampling the country centroid
 * instead puts Peru high in the Andes (5 C in January, when Lima is about 22 C),
 * Japan in the mountains of central Honshu and Iceland on an interior glacier -
 * technically the middle of the country, and wrong about the country.
 *
 * Resolved once at build time, so no geocoding happens on a request.
 */
async function geocodeCapital(capital, iso2) {
  if (!capital) return null;

  try {
    const url = `${GEOCODE_URL}?name=${encodeURIComponent(capital)}&count=10&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const { results } = await response.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    // Capital names are not unique across countries, so prefer the hit in the
    // right country before falling back to the most prominent one.
    const match = results.find((r) => r.country_code === iso2) ?? results[0];
    return typeof match.latitude === 'number' ? [match.latitude, match.longitude] : null;
  } catch {
    return null;
  }
}

/** Resolve capitals a few at a time, to stay friendly to a free endpoint. */
async function geocodeAll(entries) {
  const coords = new Map();
  const BATCH = 8;

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const resolved = await Promise.all(batch.map((e) => geocodeCapital(e.capital, e.code)));
    batch.forEach((e, j) => {
      if (resolved[j]) coords.set(e.code, resolved[j]);
    });
    process.stdout.write(`\r  geocoding capitals ${Math.min(i + BATCH, entries.length)}/${entries.length}`);
  }

  process.stdout.write('\n');
  return coords;
}

async function main() {
  console.log('Fetching reference datasets...');
  const [mledoze, dr5hn] = await Promise.all([
    fetchJson(MLEDOZE_URL),
    fetchJson(DR5HN_URL),
  ]);

  const byIso2 = new Map(dr5hn.map((c) => [c.iso2, c]));
  const gec = JSON.parse(fs.readFileSync(GEC_MAP, 'utf8'));

  // Which ISO3 codes the generated crime dataset actually contains.
  let crimeCodes = new Set();
  if (fs.existsSync(CRIME_INDEX)) {
    const index = JSON.parse(fs.readFileSync(CRIME_INDEX, 'utf8'));
    crimeCodes = new Set(index.countries.map((c) => c.code));
  } else {
    console.warn('No crime index found - run convert-crime-data first for accurate coverage.');
  }

  const countries = mledoze
    // Sovereign UN members only. Territories skew every per-capita comparison and
    // are inconsistently covered by the statistical sources.
    .filter((c) => c.unMember && c.cca2 && c.cca3 && c.name?.common)
    .map((c) => {
      const extra = byIso2.get(c.cca2);

      const currencies = {};
      for (const [code, info] of Object.entries(c.currencies ?? {})) {
        currencies[code] = { name: info.name, symbol: info.symbol ?? '' };
      }

      const [lat, lng] = c.latlng ?? [];

      return {
        code: c.cca2,
        iso3: c.cca3,
        // ISO 3166-1 numeric (M49), which is how world-atlas keys its boundaries.
        ccn3: c.ccn3 ?? null,
        name: c.name.common,
        officialName: c.name.official ?? c.name.common,
        flag: c.flag,
        region: c.region ?? extra?.region ?? null,
        subregion: c.subregion ?? extra?.subregion ?? null,
        capital: c.capital ?? (extra?.capital ? [extra.capital] : []),
        currencies,
        languages: c.languages ?? {},
        timezones: toUtcOffsets(extra?.timezones),
        // Built from coordinates rather than stored, so it can never go stale.
        googleMaps:
          lat != null && lng != null
            ? `https://www.google.com/maps/@${lat},${lng},5z`
            : null,
        // CIA World Factbook uses its own two-letter GEC codes, unrelated to ISO.
        gec: gec[c.cca2] ?? null,
        coverage: {
          // The World Bank API accepts ISO2 directly for every country here.
          worldBank: true,
          factbook: Boolean(gec[c.cca2]),
          crime: crimeCodes.has(c.cca3),
        },
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const capitalCoords = await geocodeAll(
    countries.map((c) => ({ code: c.code, capital: c.capital[0] }))
  );
  for (const country of countries) {
    country.capitalCoords = capitalCoords.get(country.code) ?? null;
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(countries, null, 2) + '\n');

  // The picker only needs a name, a flag and the coverage flags. Shipping the full
  // table to the browser would add ~75 kB of capital/currency/language/timezone
  // data that no client-side code reads.
  const slim = countries.map((c) => ({
    code: c.code,
    // Needed client-side to resolve World Bank rows, which are keyed by ISO3.
    iso3: c.iso3,
    // Joins a country to its map outline in the choropleth.
    ccn3: c.ccn3,
    name: c.name,
    flag: c.flag,
    coverage: c.coverage,
  }));
  fs.writeFileSync(LIST_OUTPUT, JSON.stringify(slim, null, 2) + '\n');

  const count = (predicate) => countries.filter(predicate).length;
  console.log(`Wrote ${countries.length} countries to ${OUTPUT}`);
  console.log(`  client list: ${LIST_OUTPUT} (${(JSON.stringify(slim).length / 1024).toFixed(0)} kB)`);
  console.log(`  with timezones: ${count((c) => c.timezones.length)}`);
  console.log(`  with languages: ${count((c) => Object.keys(c.languages).length)}`);
  console.log(`  Factbook coverage: ${count((c) => c.coverage.factbook)}`);
  console.log(`  Crime coverage:    ${count((c) => c.coverage.crime)}`);
  console.log(`  capital coordinates: ${count((c) => c.capitalCoords)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
