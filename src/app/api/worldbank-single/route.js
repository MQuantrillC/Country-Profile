import { NextResponse } from 'next/server';
import axios from 'axios';

// Map 2-letter ISO codes to 3-letter codes for World Bank API
const countryCodeMap = {
  US: 'USA', CN: 'CHN', JP: 'JPN', DE: 'DEU', IN: 'IND', 
  GB: 'GBR', FR: 'FRA', IT: 'ITA', BR: 'BRA', CA: 'CAN',
  RU: 'RUS', KR: 'KOR', AU: 'AUS', ES: 'ESP', MX: 'MEX',
  ID: 'IDN', NL: 'NLD', SA: 'SAU', CH: 'CHE', TR: 'TUR',
  DK: 'DNK', FI: 'FIN', BE: 'BEL', AT: 'AUT', IE: 'IRL',
  PT: 'PRT', GR: 'GRC', PL: 'POL', CZ: 'CZE', HU: 'HUN',
  SK: 'SVK', SI: 'SVN', HR: 'HRV', BG: 'BGR', RO: 'ROU',
  LT: 'LTU', LV: 'LVA', EE: 'EST', LU: 'LUX', MT: 'MLT',
  CY: 'CYP', IS: 'ISL', SE: 'SWE', NO: 'NOR', UA: 'UKR',
  BY: 'BLR', RS: 'SRB', BA: 'BIH', ME: 'MNE', MK: 'MKD',
  AL: 'ALB', MD: 'MDA', GE: 'GEO', AM: 'ARM', AZ: 'AZE',
  SG: 'SGP', TH: 'THA', MY: 'MYS', VN: 'VNM', PH: 'PHL',
  AE: 'ARE', QA: 'QAT', KW: 'KWT', OM: 'OMN', BH: 'BHR',
  JO: 'JOR', LB: 'LBN', IL: 'ISR', EG: 'EGY', MA: 'MAR',
  TN: 'TUN', DZ: 'DZA', NG: 'NGA', KE: 'KEN', GH: 'GHA',
  ET: 'ETH', TZ: 'TZA', UG: 'UGA', RW: 'RWA', SN: 'SEN',
  CI: 'CIV', CM: 'CMR', MG: 'MDG', MZ: 'MOZ', ZM: 'ZMB',
  ZW: 'ZWE', BW: 'BWA', NA: 'NAM', ZA: 'ZAF', PK: 'PAK',
  BD: 'BGD', LK: 'LKA', NP: 'NPL', AF: 'AFG', IR: 'IRN',
  IQ: 'IRQ', CL: 'CHL', PE: 'PER', AR: 'ARG', CO: 'COL',
  VE: 'VEN', EC: 'ECU', UY: 'URY', PY: 'PRY', BO: 'BOL',
  // Caribbean and Central America
  DO: 'DOM', JM: 'JAM', TT: 'TTO', BB: 'BRB', BS: 'BHS',
  BZ: 'BLZ', CR: 'CRI', SV: 'SLV', GT: 'GTM', HN: 'HND',
  NI: 'NIC', PA: 'PAN'
};

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
    let url;
    if (country) {
      const worldBankCode = countryCodeMap[country.toUpperCase()] || country;
      url = `https://api.worldbank.org/v2/country/${worldBankCode}/indicator/${indicatorCode}?format=json&per_page=5&date=2020:2024`;
    } else {
      url = `https://api.worldbank.org/v2/country/all/indicator/${indicatorCode}?format=json&per_page=20000&date=2020:2024`;
    }

    console.log(`Fetching World Bank data: ${url}`);

    const response = await axios.get(url, {
      timeout: 15000, // 15 second timeout for bulk requests
      headers: {
        'User-Agent': 'Country-Profile-App/1.0'
      }
    });

    if (!response.data || !Array.isArray(response.data) || response.data.length < 2) {
      return NextResponse.json({ 
        error: 'Invalid World Bank API response',
        metric: metric,
        indicator: indicatorCode
      }, { status: 500 });
    }

    // Debug for GDP metric
    if (metric === 'gdp') {
      console.log('🔍 World Bank API Response for GDP (first 15 entries):');
      if (response.data[1] && Array.isArray(response.data[1])) {
        const topEntries = response.data[1]
          .filter(entry => entry.value !== null && entry.value > 100000000000) // > $100B
          .sort((a, b) => b.value - a.value)
          .slice(0, 15);
        
        topEntries.forEach((entry, index) => {
          const gdpTrillions = (entry.value / 1000000000000).toFixed(2);
          console.log(`${index + 1}. ${entry.country?.value} (${entry.country?.id}): $${gdpTrillions}T`);
        });
      }
    }

    const dataArray = response.data[1];
    if (!Array.isArray(dataArray)) {
      return NextResponse.json({ 
        error: 'No data array in World Bank response',
        metric: metric,
        indicator: indicatorCode
      }, { status: 500 });
    }

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