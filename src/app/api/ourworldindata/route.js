import { NextResponse } from 'next/server';
import { findOwidEntity, owidCountryName } from '../../../lib/owidEntity';
import fs from 'fs';
import path from 'path';

// Reference data changes at most a few times a year; cache for a day and serve
// stale for a week while revalidating, so upstream outages stay invisible.
export const revalidate = 86400;

// Our World in Data Chart Data API endpoints for each metric
const OWID_CHART_ENDPOINTS = {
  tourists: 'https://api.ourworldindata.org/v1/indicators/985060.data.json',
  schoolingYears: 'https://api.ourworldindata.org/v1/indicators/809139.data.json', 
  taxRevenue: 'https://api.ourworldindata.org/v1/indicators/816284.data.json',
  extremePoverty: 'https://api.ourworldindata.org/v1/indicators/1035136.data.json',
  migrants: 'https://api.ourworldindata.org/v1/indicators/1015599.data.json',
  caloricSupply: 'https://api.ourworldindata.org/v1/indicators/1024467.data.json',
  incomeGroup: 'https://api.ourworldindata.org/v1/indicators/960074.data.json',
  // Updated with real IDs provided by user
  incomeShareRichest1: 'https://api.ourworldindata.org/v1/indicators/1016232.data.json',
  armedForcesPersonnel: 'https://api.ourworldindata.org/v1/indicators/1009156.data.json',
  terrorismDeaths: 'https://api.ourworldindata.org/v1/indicators/738647.data.json',
  politicalRegime: 'https://api.ourworldindata.org/v1/indicators/1026089.data.json'
  // Note: incomeSharePoorest50 will be handled via CSV file
};


// Reverse mapping: 2-letter code to country name

// Function to parse CSV data for Income Share Of The Poorest 50%
function parseCSVForCountry(countryCode) {
  try {
    const csvPath = path.join(process.cwd(), 'public', 'Income Share Of The Poorest 50%.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const lines = csvContent.split('\n');
    
    // The CSV is keyed by OWID's common English name, which is the name the
    // bundled country table carries.
    const countryName = owidCountryName(countryCode);
    if (!countryName) {
      console.warn(`Unknown country code: ${countryCode}`);
      return null;
    }
    
    // Find the row for this country
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [csvCountry, year, value] = line.split(',');
      
      // Check if this row matches our country (case-insensitive)
      if (csvCountry && csvCountry.toLowerCase().trim() === countryName.toLowerCase()) {
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
          return {
            value: numericValue,
            year: year || '2023',
            country: csvCountry,
            source: 'CSV'
          };
        }
      }
    }
    
    console.warn(`Country not found in CSV: ${countryName} (${countryCode})`);
    return null;
  } catch (error) {
    console.error('Error parsing CSV for Income Share Of The Poorest 50%:', error);
    return null;
  }
}

async function fetchOWIDData(metric, countryCode) {
  try {
    const endpoint = OWID_CHART_ENDPOINTS[metric];
    if (!endpoint) {
      throw new Error(`Unknown metric: ${metric}`);
    }

    
    // Fetch both data and metadata
    const [dataResponse, metadataResponse] = await Promise.all([
      // Without an explicit revalidate these are uncached in Next 15, so every
      // request re-downloaded the whole indicator file.
      fetch(endpoint, { next: { revalidate: 86400 } }),
      fetch(endpoint.replace('.data.json', '.metadata.json'), {
        next: { revalidate: 86400 },
      })
    ]);

    if (!dataResponse.ok) {
      throw new Error(`OWID API error: ${dataResponse.status} ${dataResponse.statusText}`);
    }

    const data = await dataResponse.json();
    const metadata = await metadataResponse.json();


    // The OWID API returns flat arrays where each index corresponds to one data point
    if (!data.entities || !data.years || !data.values) {
      throw new Error('Invalid OWID API response structure');
    }

    // Matched on ISO3 against OWID's own entity list rather than through a
    // hand-maintained name table - see src/lib/owidEntity.ts.
    const targetEntity = findOwidEntity(metadata, countryCode);
    const countryName = targetEntity?.name ?? owidCountryName(countryCode);

    if (!targetEntity) {
      console.warn(`Country not found in OWID metadata: ${countryCode}`);
      return null;
    }


    // Find all data points for this entity and get the latest
    let latestValue = null;
    let latestYear = null;

    // Go through all data points to find matches for this entity
    for (let i = data.entities.length - 1; i >= 0; i--) {
      if (data.entities[i] === targetEntity.id) {
        const value = data.values[i];
        const year = data.years[i];
        
        if (value !== null && value !== undefined) {
          // If this is the first valid value we found, or it's from a more recent year
          if (latestValue === null || year > latestYear) {
            latestValue = value;
            latestYear = year;
          }
        }
      }
    }


    return {
      value: latestValue,
      year: latestYear ? latestYear.toString() : null,
      country: countryName,
      entityId: targetEntity.id
    };

  } catch (error) {
    console.error(`Error fetching OWID data for ${metric}:`, error);
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const metric = searchParams.get('metric');

  try {
    if (!country || !metric) {
      return NextResponse.json({ error: 'Missing country or metric parameter' }, { status: 400 });
    }

    // Handle special case for Income Share of Poorest 50% (CSV data)
    let owidData = null;
    if (metric === 'incomeSharePoorest50') {
      owidData = parseCSVForCountry(country);
    } else {
      // Fetch real data from Our World in Data API
      owidData = await fetchOWIDData(metric, country);
    }
    
    // Get metadata from the appropriate JSON file
    let metadata = {};
    let source = '';
    let sourceOrganization = '';
    let unit = '';
    let description = '';
    
    try {
      let filePath = '';
      switch (metric) {
        case 'tourists':
          filePath = path.join(process.cwd(), 'public', 'International Turists.json');
          source = 'UNWTO (2024)';
          sourceOrganization = 'UN World Tourism Organization';
          unit = 'million arrivals';
          description = 'Trips by people who arrive from abroad and stay overnight';
          break;
        case 'schoolingYears':
          filePath = path.join(process.cwd(), 'public', 'Mean Years Of Schooling.json');
          source = 'Barro and Lee (2015); Lee and Lee (2016)';
          sourceOrganization = 'Barro and Lee Educational Attainment Dataset';
          unit = 'years';
          description = 'Average years of formal education for individuals aged 15-64';
          break;
        case 'taxRevenue':
          filePath = path.join(process.cwd(), 'public', 'Tax Revenue As A Share Of GDP.json');
          source = 'UNU-WIDER Government Revenue Dataset (2023)';
          sourceOrganization = 'UNU-WIDER';
          unit = '% of GDP';
          description = 'Direct and indirect taxes as well as social contributions included';
          break;
        case 'extremePoverty':
          filePath = path.join(process.cwd(), 'public', 'Share Of Population Living In Extreme Poverty.json');
          source = 'World Bank Poverty and Inequality Platform (2024)';
          sourceOrganization = 'World Bank';
          unit = '%';
          description = 'Share of population living below $2.15 per day (2017 PPP)';
          break;
        case 'migrants':
          filePath = path.join(process.cwd(), 'public', 'Total Number Of International Migrants.json');
          source = 'United Nations Department of Economic and Social Affairs (2024)';
          sourceOrganization = 'UN DESA';
          unit = 'millions';
          description = 'People living in a given country who were born in another country';
          break;
        case 'caloricSupply':
          source = 'Food and Agriculture Organization of the United Nations (2024)';
          sourceOrganization = 'FAO';
          unit = 'kilocalories per day';
          description = 'Daily per capita caloric supply available for human consumption';
          break;
        case 'incomeGroup':
          source = 'World Bank (2024)';
          sourceOrganization = 'World Bank';
          unit = 'classification';
          description = 'World Bank income group classification based on GNI per capita';
          break;
        case 'incomeShareRichest1':
          source = 'World Inequality Database (2024)';
          sourceOrganization = 'World Inequality Lab';
          unit = '%';
          description = 'Share of total income received by the richest 1% of the population (before taxes and transfers)';
          break;
        case 'incomeSharePoorest50':
          source = 'World Inequality Database (2024)';
          sourceOrganization = 'World Inequality Lab';
          unit = '%';
          description = 'Share of total income received by the poorest 50% of the population (before taxes and transfers)';
          break;
        case 'armedForcesPersonnel':
          source = 'International Institute for Strategic Studies, via World Bank (2025)';
          sourceOrganization = 'IISS/World Bank';
          unit = '%';
          description = 'Armed forces personnel as a share of total population, including active duty military and paramilitary forces';
          break;
        case 'terrorismDeaths':
          source = 'Global Terrorism Database (2024)';
          sourceOrganization = 'National Consortium for the Study of Terrorism and Responses to Terrorism (START)';
          unit = 'deaths';
          description = 'Number of deaths from terrorist attacks';
          break;
        case 'politicalRegime':
          source = 'V-Dem (2025)';
          sourceOrganization = 'Varieties of Democracy Project';
          unit = 'category';
          description = 'Political regime classification: Closed autocracy, Electoral autocracy, Electoral democracy, or Liberal democracy';
          break;
      }
      
      if (filePath) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        metadata = JSON.parse(fileContent);
      }
    } catch (error) {
      console.warn(`Could not read metadata file for ${metric}:`, error);
    }

    if (owidData && owidData.value !== null) {
      return NextResponse.json({
        country: country.toUpperCase(),
        metric: metric,
        value: owidData.value,
        year: owidData.year,
        source: source,
        sourceOrganization: sourceOrganization,
        unit: unit,
        description: description,
        metadata: metadata,
        dataSource: owidData.source === 'CSV' ? 'CSV File (World Inequality Database)' : 'Our World in Data API'
      });
    } else {
      return NextResponse.json({
        country: country.toUpperCase(),
        metric: metric,
        value: null,
        year: null,
        source: source,
        sourceOrganization: sourceOrganization,
        unit: unit,
        description: description,
        note: 'Data not available for this country',
        dataSource: metric === 'incomeSharePoorest50' ? 'CSV File (World Inequality Database)' : 'Our World in Data API'
      });
    }
  } catch (error) {
    console.error('Error fetching Our World in Data metrics:', error);
    return NextResponse.json({
      error: 'Failed to fetch Our World in Data metrics',
      details: error.message,
      country: country,
      metric: metric
    }, { status: 500 });
  }
} 