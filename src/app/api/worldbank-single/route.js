import { NextResponse } from 'next/server';
import { dateWindow, fetchWorldBank } from '../../../lib/worldBankQuery';

// Reference data changes at most a few times a year; cache for a day and serve
// stale for a week while revalidating, so upstream outages stay invisible.
export const revalidate = 86400;

// Map 2-letter ISO codes to 3-letter codes for World Bank API
// World Bank indicators
const worldBankIndicators = {
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
  co2PerCapita: 'EN.ATM.CO2E.PC',
  energyUsePerCapita: 'EG.USE.PCAP.KG.OE',
  homicideRate: 'VC.IHR.PSRC.P5',
  area: 'AG.SRF.TOTL.K2',
  populationDensity: 'EN.POP.DNST' // Population density (people per sq. km of land area)
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const metric = searchParams.get('metric');
  const country = searchParams.get('country'); // optional, for single country
  
  try {
    if (!metric) {
      return NextResponse.json({ error: 'Missing metric parameter' }, { status: 400 });
    }

    const indicatorCode = worldBankIndicators[metric];
    if (!indicatorCode) {
      return NextResponse.json({ error: `Unknown metric: ${metric}` }, { status: 400 });
    }

    // Determine URL based on whether we want all countries or single country
    // The World Bank API accepts ISO 3166-1 alpha-2 codes directly, so the request
    // can pass the code straight through. `dateWindow()` keeps the range rolling
    // instead of frozen at a hardcoded year.
    const url = country
      ? `https://api.worldbank.org/v2/country/${country.toUpperCase()}/indicator/${indicatorCode}?format=json&per_page=100&date=${dateWindow()}`
      : `https://api.worldbank.org/v2/country/all/indicator/${indicatorCode}?format=json&per_page=20000&date=${dateWindow()}`;

    const payload = await fetchWorldBank(url);

    if (!payload) {
      return NextResponse.json(
        {
          error: 'The World Bank API is not responding. Try again in a moment.',
          metric,
          indicator: indicatorCode,
        },
        { status: 502 }
      );
    }

    const dataArray = payload[1];

    if (country) {
      // Single country request
      for (const entry of dataArray) {
        if (entry.value !== null && entry.value !== undefined) {
          // Round financial values to nearest whole number for consistent formatting
          const shouldRound = ['gdp', 'gdpPerCapita', 'gniPerCapita', 'healthSpendPerCapita', 'area'].includes(metric);
          const roundedValue = shouldRound ? Math.round(entry.value) : entry.value;
          
          return NextResponse.json({
            country: country.toUpperCase(),
            metric: metric,
            value: roundedValue,
            year: entry.date,
            source: 'World Bank',
            indicator: indicatorCode
          });
        }
      }
      
      return NextResponse.json({
        country: country.toUpperCase(),
        metric: metric,
        value: null,
        year: null,
        source: 'World Bank',
        indicator: indicatorCode,
        note: 'No data available'
      });
    } else {
      // All countries request - return processed data
      const countryDataMap = new Map();
      
      dataArray.forEach(entry => {
        if (entry.value !== null && entry.value !== undefined && entry.country?.id) {
          // Filter out World Bank regional aggregates at the API level too
          const isRegionalAggregate = entry.country?.value && (
            entry.country.value.includes('income') ||
            entry.country.value.includes('IDA & IBRD') ||
            entry.country.value.includes('OECD') ||
            entry.country.value.includes('World') ||
            entry.country.value.includes('demographic dividend') ||
            entry.country.value.includes('Arab World') ||
            entry.country.value.includes('Sub-Saharan Africa') ||
            entry.country.value.includes('Latin America') ||
            entry.country.value.includes('South Asia') ||
            entry.country.value.includes('East Asia') ||
            entry.country.value.includes('Europe & Central Asia') ||
            entry.country.value.includes('Middle East, North Africa') ||
            entry.country.value.includes('Caribbean') ||
            entry.country.value.includes('Pacific') ||
            entry.country.value.includes('excluding') ||
            entry.country.value.includes('total') ||
            entry.country.value.includes(', ') && entry.country.value.includes(' & ') ||
            entry.country.id.length > 3
          );
          
          if (isRegionalAggregate) {
            // Skip regional aggregates
            return;
          }
          
          const countryCode = entry.country.id;
          const existingEntry = countryDataMap.get(countryCode);
          
          // Round financial values to nearest whole number for consistent formatting
          const shouldRound = ['gdp', 'gdpPerCapita', 'gniPerCapita', 'healthSpendPerCapita', 'area'].includes(metric);
          const roundedValue = shouldRound ? Math.round(entry.value) : entry.value;
          
          // Keep the most recent year's data
          if (!existingEntry || parseInt(entry.date) > parseInt(existingEntry.year)) {
            countryDataMap.set(countryCode, {
              countryId: entry.country.id,
              countryName: entry.country.value,
              value: roundedValue,
              year: entry.date
            });
          }
        }
      });

      const results = Array.from(countryDataMap.values())
        .filter(item => item.value !== null)
        .slice(0, 1000); // Get more results without sorting - let frontend handle sorting

      return NextResponse.json({
        metric: metric,
        indicator: indicatorCode,
        source: 'World Bank',
        count: results.length,
        data: results
      });
    }

  } catch (error) {
    console.error('Error in worldbank-single API:', error);
    return NextResponse.json({
      error: 'Failed to fetch World Bank data',
      details: error.message,
      metric: metric
    }, { status: 500 });
  }
} 