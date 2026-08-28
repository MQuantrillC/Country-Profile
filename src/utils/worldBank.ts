// src/utils/worldBank.ts
//
// Fetches a country's World Development Indicators in a single batched request.
//
// This previously issued two requests per indicator (metadata + data) for each of
// 32 indicators - 64 round trips per country. The World Bank API accepts a
// semicolon-separated indicator list, so the whole profile is now one request, and
// the source label is known statically because `source=2` *is* World Development
// Indicators.

import {
  chunk,
  fetchWorldBank,
  indicatorUrl,
  isErrorEnvelope,
  latestByIndicator,
  observationsFrom,
  seriesByIndicator,
  MAX_INDICATORS_PER_REQUEST,
  type SeriesPoint,
  type WorldBankObservation,
} from '../lib/worldBankQuery';

/** Metric key -> World Development Indicators series code. */
const indicators = {
  gdp: 'NY.GDP.MKTP.CD',
  gdpPerCapita: 'NY.GDP.PCAP.CD',
  gniPerCapita: 'NY.GNP.PCAP.CD',
  tradeGDP: 'NE.TRD.GNFS.ZS',
  unemploymentRate: 'SL.UEM.TOTL.ZS',
  publicDebtGDP: 'GC.DOD.TOTL.GD.ZS',
  inflation: 'FP.CPI.TOTL.ZG',
  fdiNetInflows: 'BX.KLT.DINV.WD.GD.ZS',
  population: 'SP.POP.TOTL',
  lifeExpectancy: 'SP.DYN.LE00.IN',
  fertilityRate: 'SP.DYN.TFRT.IN',
  urbanPopPct: 'SP.URB.TOTL.IN.ZS',
  ruralPopPct: 'SP.RUR.TOTL.ZS',
  populationGrowth: 'SP.POP.GROW',
  literacyRate: 'SE.ADT.LITR.ZS',
  educationSpendPctGDP: 'SE.XPD.TOTL.GD.ZS',
  schoolEnrollment: 'SE.SEC.NENR',
  healthSpendPerCapita: 'SH.XPD.CHEX.PC.CD',
  internetUsers: 'IT.NET.USER.ZS',
  electricityAccess: 'EG.ELC.ACCS.ZS',
  mobileSubscriptions: 'IT.CEL.SETS.P2',
  improvedWaterAccess: 'SH.H2O.BASW.ZS',
  improvedSanitationAccess: 'SH.STA.BASS.ZS',
  researchDevelopmentGDP: 'GB.XPD.RSDV.GD.ZS',
  forestPct: 'AG.LND.FRST.ZS',
  agriculturalLandPct: 'AG.LND.AGRI.ZS',
  // `EN.ATM.CO2E.PC` was retired and is now rejected outright by the API, which
  // silently broke this metric. `EN.GHG.CO2.PC.CE.AR5` is its replacement:
  // CO2 emissions excluding LULUCF, in tonnes per capita.
  co2PerCapita: 'EN.GHG.CO2.PC.CE.AR5',
  energyUsePerCapita: 'EG.USE.PCAP.KG.OE',
  homicideRate: 'VC.IHR.PSRC.P5',
  area: 'AG.SRF.TOTL.K2',
  populationDensity: 'EN.POP.DNST',
} as const;

type MetricKey = keyof typeof indicators;

/** Every indicator here is served from `source=2`, so the label is fixed. */
const WDI_SOURCE = 'World Development Indicators';
const WDI_ORGANIZATION = 'World Bank';

export interface DataWithSource {
  value: number | null;
  year: string | null;
  source: string;
  sourceOrganization: string;
  /**
   * Distinguishes "the World Bank has no observation for this country" from
   * "the request failed". Without it both render as N/A and the UI cannot say why.
   */
  status: 'ok' | 'no-data' | 'failed';
  /**
   * Every observation in the requested window, oldest first.
   *
   * The multi-year window is fetched regardless, so keeping the series costs
   * nothing over the wire. It is what feeds the sparklines and trend charts
   * without a second round trip.
   */
  series: SeriesPoint[];
}

export type CountryStats = Record<MetricKey, DataWithSource>;

function emptyMetric(status: 'no-data' | 'failed'): DataWithSource {
  return {
    value: null,
    year: null,
    source: WDI_SOURCE,
    sourceOrganization: WDI_ORGANIZATION,
    status,
    series: [],
  };
}

/** Build a full stats object where every metric carries the same failure status. */
function allMetrics(status: 'no-data' | 'failed'): CountryStats {
  const stats = {} as CountryStats;
  for (const key of Object.keys(indicators) as MetricKey[]) {
    stats[key] = emptyMetric(status);
  }
  return stats;
}

/**
 * Fetch one batch of indicators.
 *
 * Returns `null` when the request could not be completed at all, which the caller
 * uses to tell a transport failure apart from a country simply having no data.
 */
async function fetchBatch(
  countryCode: string,
  batch: string[]
): Promise<WorldBankObservation[] | null> {
  // fetchWorldBank retries through rate limiting, which answers with HTTP 200 and
  // an error body rather than a 429.
  const payload = await fetchWorldBank(indicatorUrl(countryCode, batch), {
    timeoutMs: 15_000,
  });

  if (!payload) return null;

  // The API answers an unrecognised indicator code by rejecting the whole query
  // with `{message: [...]}` rather than omitting that series, so a single retired
  // code would otherwise blank out every indicator batched alongside it.
  //
  // Detecting that envelope specifically - rather than treating any empty result
  // as suspect - matters: a country that genuinely has no data for a batch would
  // otherwise trigger a pointless retry of every indicator on its own.
  if (isErrorEnvelope(payload)) return null;

  return observationsFrom(payload);
}

/**
 * Fetch every indicator for one country.
 *
 * Returns a metric for every key regardless of outcome, so callers never have to
 * check for missing properties - only for `status`.
 */
export async function fetchCountryStats(countryCode: string): Promise<CountryStats> {
  const allIndicators = Object.values(indicators) as string[];
  const batches = chunk(allIndicators, MAX_INDICATORS_PER_REQUEST);

  const results = await Promise.all(
    batches.map(async (batch) => {
      const rows = await fetchBatch(countryCode, batch);
      if (rows) return rows;

      // Fall back to one request per indicator so a single bad code costs one
      // metric instead of twenty. This path is rare, so the extra calls are fine.
      console.warn(
        `World Bank batch failed for ${countryCode}; retrying ${batch.length} indicators individually`
      );
      const individual = await Promise.all(
        batch.map((code) => fetchBatch(countryCode, [code]))
      );

      const recovered = individual.filter((r): r is WorldBankObservation[] => r !== null);
      return recovered.length ? recovered.flat() : null;
    })
  );

  // Only report a hard failure if nothing at all came back; a partial response
  // should still fill in the metrics it covered.
  if (results.every((rows) => rows === null)) {
    return allMetrics('failed');
  }

  const rows = results.flatMap((r) => r ?? []);
  const latest = latestByIndicator(rows);
  const series = seriesByIndicator(rows);

  const stats = {} as CountryStats;
  for (const [key, code] of Object.entries(indicators) as [MetricKey, string][]) {
    const row = latest.get(code);
    stats[key] = row
      ? {
          value: row.value,
          year: row.date,
          source: WDI_SOURCE,
          sourceOrganization: WDI_ORGANIZATION,
          status: 'ok',
          series: series.get(code) ?? [],
        }
      : emptyMetric('no-data');
  }

  return stats;
}
