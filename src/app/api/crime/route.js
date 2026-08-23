import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { toIso3 } from '../../../lib/countries';

// UNODC figures are published annually; nothing here changes between requests.
export const revalidate = 86400;

// Per-country files are written by scripts/convert-crime-data.js.
const CRIME_DIR = path.join(process.cwd(), 'src/data/crime');

// Parsed country files, kept for the life of the process. Each is a few hundred kB
// at most, and the data is static, so there is nothing to expire. The previous
// version parsed a single 31 MB file into memory and re-read it every 5 minutes.
const countryCache = new Map();
let indexCache = null;

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

async function loadIndex() {
  if (!indexCache) {
    indexCache = await readJson(path.join(CRIME_DIR, 'index.json'));
  }
  return indexCache;
}

async function loadCountry(iso3) {
  if (countryCache.has(iso3)) return countryCache.get(iso3);

  // Guard against path traversal: only ever read a three-letter uppercase code.
  if (!/^[A-Z]{3}$/.test(iso3)) return null;

  const data = await readJson(path.join(CRIME_DIR, `${iso3}.json`));
  countryCache.set(iso3, data);
  return data;
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
    // `rawData: data` used to be returned here - every observation for the country,
    // up to half a megabyte per response, which nothing in the UI ever read.
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  // No country: report what the dataset covers, straight from the index.
  if (!country) {
    const index = await loadIndex();
    if (!index) {
      return NextResponse.json(
        { error: 'Crime dataset has not been generated. Run: npm run convert-crime-data' },
        { status: 503 }
      );
    }
    return NextResponse.json({
      totalCountries: index.countries.length,
      totalRecords: index.totalRecords,
      yearRange: index.yearRange,
      availableCountries: index.countries,
    });
  }

  // The shared table knows every ISO2 -> ISO3 pair, so the dataset's full
  // 170-country coverage is reachable instead of the 71 the old hand-written
  // map happened to list.
  const iso3 = toIso3(country) ?? country.toUpperCase();
  const countryData = await loadCountry(iso3);

  if (!countryData) {
    return NextResponse.json(
      { error: `No UNODC crime data is published for ${country.toUpperCase()}`, code: iso3 },
      { status: 404 }
    );
  }

  return NextResponse.json(processCountryCrimeData(countryData), {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  });
}
