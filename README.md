# Country Profile

Compare up to five countries side by side across economy, demographics, social and
environmental indicators, trade, safety and climate — with every figure attributed
to its source and dated.

Built with Next.js (App Router), React 19 and Tailwind CSS 4.

## Getting started

```bash
npm install
```

The crime dataset is generated from a spreadsheet rather than committed (it
expands to ~22 MB), so build it once before the first run:

```bash
npm run convert-crime-data
```

`npm run build` does this for you via `prebuild`; only a fresh `npm run dev` needs
it run by hand.

Then start the dev server:

```bash
npm run dev
```

The app runs at http://localhost:3000.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build (runs `convert-crime-data` first) |
| `npm start` | Serve a production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Run the test suite (vitest) |
| `npm run test:watch` | Tests in watch mode |
| `npm run convert-crime-data` | Rebuild `src/data/crime/` from the UNODC spreadsheet |
| `npm run generate-countries` | Rebuild the country table from upstream reference data |
| `npm run generate-map` | Rebuild the pre-projected map outlines |

## Data sources

| Source | Provides | How it is reached |
| --- | --- | --- |
| World Bank Open Data | 31 development indicators (profile), 15 (rankings) | Live API, batched, cached 24h |
| World Bank Climate Knowledge Portal | Temperature and hot/cold day counts | Live API, cached 24h |
| CIA World Factbook | Demographics, trade, infrastructure, military | Live JSON mirror, cached 24h |
| Our World in Data | Poverty, schooling, tourism, migration, regime type | Live API, cached 24h |
| UNODC | Homicide, arrests, convictions, prison deaths | Bundled, generated from spreadsheet |
| mledoze/countries + dr5hn | Capital, currency, language, timezone | Bundled, generated at build time |
| Wikipedia | One-paragraph country description | Live API, cached 24h |
| Open-Meteo | Monthly temperature and rainfall at the capital | Live API, cached 24h |
| open.er-api.com | Exchange rate against the US dollar | Live API, cached 24h |
| Nager.Date | Upcoming public holidays | Live API, cached 24h |
| IMF DataMapper | Real GDP growth, actual and projected | Live API, cached 24h |
| USGS | Magnitude 6+ earthquakes near the capital | Live API, cached 24h |
| UN Comtrade | Real bilateral export partners | Live API (public preview), cached 24h |
| world-atlas | Country boundaries for the map | Bundled, pre-projected at build time |

### Sources considered and rejected

**Ember** (electricity generation) now requires an API key. The World Bank's
`EG.ELC.*` indicators carry the same generation shares with no key, so the energy
mix comes from there instead - slightly older vintage, no signup.

**OpenAQ** (air quality) requires an API key and its v2 endpoints are retired, so
air quality is not included. Adding it means creating an OpenAQ account and
supplying `OPENAQ_API_KEY`.

**UN Comtrade's** public preview endpoint caps responses at 500 rows. For large
reporters such as Germany the aggregate rows fall outside that cap, and some
reporters (France) are absent entirely, so the trade block appears for roughly two
thirds of countries and is omitted for the rest rather than shown wrong.

## Charts

All charts are hand-written SVG rather than a charting library. Six simple forms did
not justify roughly 100 kB of bundle on a page that has to work on a phone; the six
together cost about 6 kB.

| Chart | Where | Fed by |
| --- | --- | --- |
| Sparkline | Every metric cell | The World Bank series already fetched |
| Trend lines | Expanded metric row | The same series, per country |
| Distribution strip | Expanded metric row | `/api/rankings` |
| Scatter | Rankings page | `/api/rankings` |
| Choropleth | Rankings page | `/api/rankings` + bundled outlines |
| Population pyramid | Country information | CIA Factbook age structure |

Colour is validated rather than chosen. Five categorical slots pass the
colour-vision checks on adjacent pairs but fail on all-pairs, so the all-pairs forms
(scatter, choropleth) do not encode identity in colour at all - the scatter
highlights in one accent with direct labels, and the choropleth uses a sequential
single-hue ramp. See the comment at the top of `src/lib/chartTheme.ts`.

### Why some data is bundled

Country reference data (capital, currency, languages, timezones) used to come from
`restcountries.com`. That API's v3.1 was deprecated and now answers every request
with HTTP 200 and an error body — so the app kept "succeeding" while showing
nothing. v5 requires an API key. Since this is reference data that changes about
once a decade, it is now generated into `src/data/countries.json` at build time from
the same public datasets REST Countries itself is built on. No key, no runtime
dependency, no outage.

## Project layout

```
src/
  app/
    page.tsx              Comparison view (composition + country info panel)
    top10/page.tsx        Global rankings
    api/                  Route handlers, one per upstream source
  components/
    CountryPicker         Search and multi-select, with coverage notes
    MetricSection         One collapsible table of metrics by country
    CollapsibleInfoSection
  hooks/
    useCountryData.ts     Fetches and caches per country
  lib/
    countries.ts          Full country table (server)
    countryList.ts        Slim country list (client bundle)
    metricCatalog.tsx     Sections, icons, tooltips, value formatting
    rankingMetrics.ts     Metric definitions shared by page and route
    factbook.js           Factbook parsing, callable without HTTP
    factbookParsers.ts    Pulls numbers out of Factbook prose
    worldBankQuery.ts     URL building, batching, response narrowing
  types/country.ts        Shapes returned by the API routes
  data/                   countries.json committed; crime/ generated
scripts/                  Data generation
data-sources/             Raw inputs for the generators
```

Tests live next to what they cover (`*.test.ts`) and run in Node — they cover the
query building, the country table, value formatting, the Factbook parsers, and the
World Bank batching and rankings routes against mocked upstream responses.

## Sharing a comparison

The selection lives in the query string, so any comparison can be linked:

```
/?countries=US,BR,JP
```

## Adding a metric

1. Add the indicator code to `indicators` in `src/utils/worldBank.ts` (World Bank
   metrics) or extend the relevant route.
2. Add the metric title to `sectionMetrics` in `src/app/page.tsx`.
3. Add a case to `resolveMetric` in `src/components/MetricSection.tsx`.
4. Add the icon, tooltip and value formatting in `src/lib/metricCatalog.tsx`.

For a metric on the rankings page, add one entry to `src/lib/rankingMetrics.ts` —
the route and the page both read from it.
