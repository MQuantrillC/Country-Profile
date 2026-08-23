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
| `npm run convert-crime-data` | Rebuild `src/data/crime/` from the UNODC spreadsheet |
| `npm run generate-countries` | Rebuild the country table from upstream reference data |

## Data sources

| Source | Provides | How it is reached |
| --- | --- | --- |
| World Bank Open Data | 31 development indicators | Live API, batched, cached 24h |
| World Bank Climate Knowledge Portal | Temperature and hot/cold day counts | Live API, cached 24h |
| CIA World Factbook | Demographics, trade, infrastructure, military | Live JSON mirror, cached 24h |
| Our World in Data | Poverty, schooling, tourism, migration, regime type | Live API, cached 24h |
| UNODC | Homicide, arrests, convictions, prison deaths | Bundled, generated from spreadsheet |
| mledoze/countries + dr5hn | Capital, currency, language, timezone | Bundled, generated at build time |

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
    page.tsx            Comparison view
    top10/page.tsx      Global rankings
    api/                Route handlers, one per upstream source
  lib/
    countries.ts        Full country table (server)
    countryList.ts      Slim country list (client bundle)
    factbook.js         Factbook parsing, callable without HTTP
    worldBankQuery.ts   URL building and response narrowing
  data/                 countries.json committed; crime/ generated
scripts/                Data generation
data-sources/           Raw inputs for the generators
```

## Sharing a comparison

The selection lives in the query string, so any comparison can be linked:

```
/?countries=US,BR,JP
```

## Adding a metric

1. Add the indicator code to `indicators` in `src/utils/worldBank.ts` (World Bank
   metrics) or extend the relevant route.
2. Add the metric title to `sectionMetrics` in `src/app/page.tsx`.
3. Add a case to `resolveMetric` and to `formatMetricValue`.
4. Add an icon in `getMetricIcon` and a description in `getMetricTooltip`.
