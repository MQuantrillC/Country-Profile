import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// In-memory cache for crime data
let crimeDataCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function loadCrimeData() {
  try {
    const dataPath = path.join(process.cwd(), 'src/data/crime-data-grouped.json');
    
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return data;
    }
    
    // Fallback to sample data if JSON file doesn't exist
    return getSampleCrimeData();
    
  } catch (error) {
    console.error('Error loading crime data:', error);
    return getSampleCrimeData();
  }
}

function getSampleCrimeData() {
  // Sample data based on the structure you showed
  return {
    "ARM": {
      "country": "Armenia",
      "region": "Asia",
      "subregion": "Western Asia",
      "data": [
        {
          "indicator": "Persons arrested by citizenship",
          "dimension": "National citizens",
          "category": "",
          "sex": "Male",
          "age": "Total",
          "year": 2013,
          "unit": "Counts",
          "value": 35,
          "source": "CTS"
        }
      ]
    },
    "CHE": {
      "country": "Switzerland",
      "region": "Europe",
      "subregion": "Western Europe",
      "data": [
        {
          "indicator": "Persons arrested by citizenship",
          "dimension": "National citizens",
          "category": "",
          "sex": "Male",
          "age": "Total",
          "year": 2013,
          "unit": "Counts",
          "value": 28,
          "source": "CTS"
        }
      ]
    },
    "COL": {
      "country": "Colombia",
      "region": "Americas",
      "subregion": "Latin America",
      "data": [
        {
          "indicator": "Persons arrested by citizenship",
          "dimension": "National citizens",
          "category": "",
          "sex": "Male",
          "age": "Total",
          "year": 2013,
          "unit": "Counts",
          "value": 15053,
          "source": "CTS"
        }
      ]
    },
    "CZE": {
      "country": "Czechia",
      "region": "Europe",
      "subregion": "Eastern Europe",
      "data": [
        {
          "indicator": "Persons arrested by citizenship",
          "dimension": "National citizens",
          "category": "",
          "sex": "Male",
          "age": "Total",
          "year": 2013,
          "unit": "Counts",
          "value": 69,
          "source": "CTS"
        }
      ]
    },
    "DEU": {
      "country": "Germany",
      "region": "Europe",
      "subregion": "Western Europe",
      "data": [
        {
          "indicator": "Persons arrested by citizenship",
          "dimension": "National citizens",
          "category": "",
          "sex": "Male",
          "age": "Total",
          "year": 2013,
          "unit": "Counts",
          "value": 455,
          "source": "CTS"
        }
      ]
    },
    "FIN": {
      "country": "Finland",
      "region": "Europe",
      "subregion": "Northern Europe",
      "data": [
        {
          "indicator": "Persons arrested by citizenship",
          "dimension": "National citizens",
          "category": "",
          "sex": "Male",
          "age": "Total",
          "year": 2013,
          "unit": "Counts",
          "value": 70,
          "source": "CTS"
        }
      ]
    }
  };
}

function getCachedCrimeData() {
  const now = Date.now();
  
  if (crimeDataCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return crimeDataCache;
  }
  
  crimeDataCache = loadCrimeData();
  cacheTimestamp = now;
  
  return crimeDataCache;
}

function processCountryCrimeData(countryData) {
  if (!countryData || !countryData.data) {
    return null;
  }
  
  const data = countryData.data;
  
  // Get the most recent year's data overall for reference
  const latestYear = Math.max(...data.map(d => d.year));
  
  // Process different indicators with exact matches - get most recent data for each indicator
  const arrestDataAll = data.filter(d => 
    d.indicator === 'Persons arrested/suspected for intentional homicide'
  );
  const arrestLatestYear = arrestDataAll.length > 0 ? Math.max(...arrestDataAll.map(d => d.year)) : null;
  const arrestData = arrestDataAll.filter(d => d.year === arrestLatestYear);
  
  const victimDataAll = data.filter(d => 
    d.indicator === 'Victims of intentional homicide' || 
    d.indicator === 'Victims of intentional homicide – City-level data'
  );
  const victimLatestYear = victimDataAll.length > 0 ? Math.max(...victimDataAll.map(d => d.year)) : null;
  const victimData = victimDataAll.filter(d => d.year === victimLatestYear);
  
  const convictionDataAll = data.filter(d => 
    d.indicator === 'Persons convicted for intentional homicide'
  );
  const convictionLatestYear = convictionDataAll.length > 0 ? Math.max(...convictionDataAll.map(d => d.year)) : null;
  const convictionData = convictionDataAll.filter(d => d.year === convictionLatestYear);
  
  const prisonDeathDataAll = data.filter(d => 
    d.indicator === 'Death due to intentional homicide in prison'
  );
  const prisonDeathLatestYear = prisonDeathDataAll.length > 0 ? Math.max(...prisonDeathDataAll.map(d => d.year)) : null;
  const prisonDeathData = prisonDeathDataAll.filter(d => d.year === prisonDeathLatestYear);
  
  // Calculate totals by summing across all age groups/categories within the latest year
  // For arrests: sum all age groups and sexes, but only for the same unit of measurement
  const arrestCountsData = arrestData.filter(d => d.dimension === 'Total' && d.unit === 'Counts');
  const arrestRatesData = arrestData.filter(d => d.dimension === 'Total' && d.unit === 'Rate per 100,000 population');
  
  // Prefer counts over rates for totals (more meaningful for absolute numbers)
  let totalArrests = arrestCountsData.length > 0 
    ? arrestCountsData.reduce((sum, item) => sum + (item.value || 0), 0)
    : (arrestRatesData.length > 0 ? arrestRatesData.reduce((sum, item) => sum + (item.value || 0), 0) : 0);
  
  // If no direct total found, calculate from citizenship data
  if (totalArrests === 0) {
    const allCitizenshipData = arrestData.filter(d => d.unit === 'Counts' && d.age === 'Total');
    totalArrests = allCitizenshipData.reduce((sum, item) => sum + (item.value || 0), 0);
  }
  
  // For victims: sum all age groups, sexes, and dimensions for the latest year  
  const victimCountsData = victimData.filter(d => d.dimension === 'Total' && d.sex === 'Total' && d.age === 'Total' && d.unit === 'Counts');
  const victimRatesData = victimData.filter(d => d.dimension === 'Total' && d.sex === 'Total' && d.age === 'Total' && d.unit === 'Rate per 100,000 population');
  
  // Prefer counts over rates for totals
  let totalVictims = victimCountsData.length > 0 
    ? victimCountsData.reduce((sum, item) => sum + (item.value || 0), 0)
    : (victimRatesData.length > 0 ? victimRatesData.reduce((sum, item) => sum + (item.value || 0), 0) : 0);
  
  // If no direct total found, try to sum all available victim data
  if (totalVictims === 0) {
    const allVictimData = victimData.filter(d => d.unit === 'Counts' && d.age === 'Total');
    totalVictims = allVictimData.reduce((sum, item) => sum + (item.value || 0), 0);
  }
  
  // For convictions: sum all age groups, sexes, and dimensions for the latest year
  const convictionCountsData = convictionData.filter(d => d.dimension === 'Total' && d.sex === 'Total' && d.age === 'Total' && d.unit === 'Counts');
  const convictionRatesData = convictionData.filter(d => d.dimension === 'Total' && d.sex === 'Total' && d.age === 'Total' && d.unit === 'Rate per 100,000 population');
  
  // Prefer counts over rates for totals
  let totalConvictions = convictionCountsData.length > 0 
    ? convictionCountsData.reduce((sum, item) => sum + (item.value || 0), 0)
    : (convictionRatesData.length > 0 ? convictionRatesData.reduce((sum, item) => sum + (item.value || 0), 0) : 0);
  
  // If no direct total found, try to sum all available conviction data
  if (totalConvictions === 0) {
    const allConvictionData = convictionData.filter(d => d.unit === 'Counts' && d.age === 'Total');
    totalConvictions = allConvictionData.reduce((sum, item) => sum + (item.value || 0), 0);
  }
  
  // For prison deaths: sum all age groups, sexes, and dimensions for the latest year
  const prisonDeathCountsData = prisonDeathData.filter(d => d.dimension === 'Total' && d.sex === 'Total' && d.age === 'Total' && d.unit === 'Counts');
  const prisonDeathRatesData = prisonDeathData.filter(d => d.dimension === 'Total' && d.sex === 'Total' && d.age === 'Total' && d.unit === 'Rate per 100,000 population');
  
  // Prefer counts over rates for totals
  let totalPrisonDeaths = prisonDeathCountsData.length > 0 
    ? prisonDeathCountsData.reduce((sum, item) => sum + (item.value || 0), 0)
    : (prisonDeathRatesData.length > 0 ? prisonDeathRatesData.reduce((sum, item) => sum + (item.value || 0), 0) : 0);
  
  // If no direct total found, try to sum all available prison death data
  if (totalPrisonDeaths === 0) {
    const allPrisonDeathData = prisonDeathData.filter(d => d.unit === 'Counts' && d.age === 'Total');
    totalPrisonDeaths = allPrisonDeathData.reduce((sum, item) => sum + (item.value || 0), 0);
  }
  
  // Get arrests by citizenship (sum all ages and sexes for each citizenship category)
  const nationalCitizensArrestsData = arrestData
    .filter(d => d.dimension && (d.dimension.toLowerCase().includes('national') || d.dimension.toLowerCase().includes('citizen')) && d.age === 'Total' && d.unit === 'Counts');
  const nationalCitizensArrests = nationalCitizensArrestsData.length > 0 
    ? nationalCitizensArrestsData.reduce((sum, item) => sum + (item.value || 0), 0)
    : 0;
  
  const foreignCitizensArrestsData = arrestData
    .filter(d => d.dimension && d.dimension.toLowerCase().includes('foreign') && d.age === 'Total' && d.unit === 'Counts');
  const foreignCitizensArrests = foreignCitizensArrestsData.length > 0
    ? foreignCitizensArrestsData.reduce((sum, item) => sum + (item.value || 0), 0)
    : 0;
  
  // Get arrests by sex (sum all ages for each sex)
  const maleArrestsData = arrestData
    .filter(d => d.sex && d.sex.toLowerCase() === 'male' && d.dimension === 'Total' && d.unit === 'Counts');
  const maleArrestsTotal = maleArrestsData.length > 0 
    ? maleArrestsData.reduce((sum, item) => sum + (item.value || 0), 0)
    : 0;
  
  const femaleArrestsData = arrestData
    .filter(d => d.sex && d.sex.toLowerCase() === 'female' && d.dimension === 'Total' && d.unit === 'Counts');
  const femaleArrestsTotal = femaleArrestsData.length > 0
    ? femaleArrestsData.reduce((sum, item) => sum + (item.value || 0), 0)
    : 0;
  
  // Get victim data by sex (sum all ages and dimensions for each sex)
  const maleVictimsData = victimData
    .filter(d => d.sex && d.sex.toLowerCase() === 'male' && d.dimension === 'Total' && d.age === 'Total' && d.unit === 'Counts');
  const maleVictimsTotal = maleVictimsData.length > 0 
    ? maleVictimsData.reduce((sum, item) => sum + (item.value || 0), 0)
    : 0;
  
  const femaleVictimsData = victimData
    .filter(d => d.sex && d.sex.toLowerCase() === 'female' && d.dimension === 'Total' && d.age === 'Total' && d.unit === 'Counts');
  const femaleVictimsTotal = femaleVictimsData.length > 0
    ? femaleVictimsData.reduce((sum, item) => sum + (item.value || 0), 0)
    : 0;
  
  return {
    country: countryData.country,
    region: countryData.region,
    subregion: countryData.subregion,
    year: latestYear,
    totalArrests: totalArrests >= 0 ? totalArrests : null,
    arrestYear: arrestLatestYear,
    arrestsByCitizenship: {
      national: nationalCitizensArrests >= 0 ? nationalCitizensArrests : null,
      foreign: foreignCitizensArrests >= 0 ? foreignCitizensArrests : null
    },
    arrestsBySex: {
      male: maleArrestsTotal >= 0 ? maleArrestsTotal : null,
      female: femaleArrestsTotal >= 0 ? femaleArrestsTotal : null
    },
    victimData: {
      totalVictims: totalVictims >= 0 ? totalVictims : null,
      maleVictims: maleVictimsTotal >= 0 ? maleVictimsTotal : null,
      femaleVictims: femaleVictimsTotal >= 0 ? femaleVictimsTotal : null,
      homicideRate: null, // Can be calculated if population data is available
      year: victimLatestYear
    },
    convictionData: {
      totalConvictions: totalConvictions >= 0 ? totalConvictions : null,
      year: convictionLatestYear
    },
    prisonDeaths: totalPrisonDeaths >= 0 ? totalPrisonDeaths : null,
    prisonDeathsYear: prisonDeathLatestYear,
    source: (arrestData[0] || victimData[0] || convictionData[0] || prisonDeathData[0])?.source || 'CTS',
    unit: (arrestData[0] || victimData[0] || convictionData[0] || prisonDeathData[0])?.unit || 'Counts',
    rawData: data
  };
}

// Country code mapping for crime data
const COUNTRY_CODE_MAPPING = {
  'US': 'USA',
  'GB': 'GBR_E_W', // UK data is split by region, use England & Wales as primary
  'JP': 'JPN',
  'DE': 'DEU',
  'FR': 'FRA',
  'IT': 'ITA',
  'ES': 'ESP',
  'CN': 'CHN',
  'IN': 'IND',
  'BR': 'BRA',
  'CA': 'CAN',
  'AU': 'AUS',
  'RU': 'RUS',
  'MX': 'MEX',
  'KR': 'KOR',
  'NL': 'NLD',
  'BE': 'BEL',
  'CH': 'CHE',
  'AT': 'AUT',
  'SE': 'SWE',
  'NO': 'NOR',
  'DK': 'DNK',
  'FI': 'FIN',
  'PL': 'POL',
  'CZ': 'CZE',
  'HU': 'HUN',
  'GR': 'GRC',
  'PT': 'PRT',
  'IE': 'IRL',
  'SK': 'SVK',
  'SI': 'SVN',
  'HR': 'HRV',
  'BG': 'BGR',
  'RO': 'ROU',
  'LT': 'LTU',
  'LV': 'LVA',
  'EE': 'EST',
  // Additional countries
  'LU': 'LUX',
  'AL': 'ALB',
  'BH': 'BHR',
  'IS': 'ISL',
  'MT': 'MLT',
  'CY': 'CYP',
  'MK': 'MKD',
  'ME': 'MNE',
  'RS': 'SRB',
  'BA': 'BIH',
  'MD': 'MDA',
  'BY': 'BLR',
  'UA': 'UKR',
  // Latin America
  'AR': 'ARG',
  'CL': 'CHL',
  'PE': 'PER',
  'CO': 'COL',
  'VE': 'VEN',
  'EC': 'ECU',
  'BO': 'BOL',
  'PY': 'PRY',
  'UY': 'URY',
  // Asia-Pacific
  'TH': 'THA',
  'VN': 'VNM',
  'MY': 'MYS',
  'SG': 'SGP',
  'PH': 'PHL',
  'ID': 'IDN',
  'TR': 'TUR',
  // Middle East
  'QA': 'QAT'
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    
    const crimeData = getCachedCrimeData();
    
    if (country) {
      let countryCode = country.toUpperCase();
      
      // Check if we need to map the country code
      if (COUNTRY_CODE_MAPPING[countryCode]) {
        countryCode = COUNTRY_CODE_MAPPING[countryCode];
      }
      
      const countryData = crimeData[countryCode];
      
      if (!countryData) {
        return NextResponse.json({
          error: 'Country not found',
          country: countryCode,
          originalCode: country.toUpperCase(),
          availableCountries: Object.keys(crimeData).slice(0, 20), // Show first 20 for debugging
          suggestion: `Try one of: ${Object.keys(crimeData).filter(c => c.includes(country.toUpperCase())).join(', ')}`
        }, { status: 404 });
      }
      
      const processedData = processCountryCrimeData(countryData);
      
      return NextResponse.json(processedData);
    }
    
    // Return summary of all available countries
    const summary = {
      totalCountries: Object.keys(crimeData).length,
      availableCountries: Object.keys(crimeData).map(code => ({
        code: code,
        name: crimeData[code].country,
        region: crimeData[code].region
      })),
      dataStructure: {
        endpoints: [
          'GET /api/crime - Get all countries summary',
          'GET /api/crime?country=US - Get specific country data'
        ]
      }
    };
    
    return NextResponse.json(summary);
    
  } catch (error) {
    console.error('Crime API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ 
    error: 'Method not allowed',
    message: 'Use GET to retrieve crime data' 
  }, { status: 405 });
} 