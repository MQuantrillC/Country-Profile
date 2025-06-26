import { NextResponse } from 'next/server';

// OWID HDI endpoint
const OWID_HDI_ENDPOINT = 'https://api.ourworldindata.org/v1/indicators/1032439.data.json';

// Country name to 2-letter code mapping for Our World in Data
const OWID_COUNTRY_MAPPING = {
  // Major countries
  'United States': 'US',
  'United Kingdom': 'GB', 
  'Germany': 'DE',
  'France': 'FR',
  'Italy': 'IT',
  'Spain': 'ES',
  'Japan': 'JP',
  'China': 'CN',
  'India': 'IN',
  'Brazil': 'BR',
  'Canada': 'CA',
  'Australia': 'AU',
  'Russia': 'RU',
  'Mexico': 'MX',
  'Turkey': 'TR',
  'South Korea': 'KR',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Poland': 'PL',
  'Czech Republic': 'CZ',
  'Czechia': 'CZ',
  'Hungary': 'HU',
  'Greece': 'GR',
  'Portugal': 'PT',
  'Ireland': 'IE',
  'Slovakia': 'SK',
  'Slovenia': 'SI',
  'Croatia': 'HR',
  'Bulgaria': 'BG',
  'Romania': 'RO',
  'Lithuania': 'LT',
  'Latvia': 'LV',
  'Estonia': 'EE',
  'Luxembourg': 'LU',
  'Malta': 'MT',
  'Cyprus': 'CY',
  'Bosnia and Herzegovina': 'BA',
  'Serbia': 'RS',
  'Montenegro': 'ME',
  'North Macedonia': 'MK',
  'Moldova': 'MD',
  'Belarus': 'BY',
  'Ukraine': 'UA',
  'Iceland': 'IS',
  'Chile': 'CL',
  'Peru': 'PE',
  'Argentina': 'AR',
  'Colombia': 'CO',
  'Venezuela': 'VE',
  'Ecuador': 'EC',
  'Uruguay': 'UY',
  'Paraguay': 'PY',
  'Bolivia': 'BO',
  'Thailand': 'TH',
  'Vietnam': 'VN',
  'Malaysia': 'MY',
  'Singapore': 'SG',
  'Philippines': 'PH',
  'Indonesia': 'ID',
  'South Africa': 'ZA',
  'Egypt': 'EG',
  'Morocco': 'MA',
  'Tunisia': 'TN',
  'Algeria': 'DZ',
  'Nigeria': 'NG',
  'Kenya': 'KE',
  'Ghana': 'GH',
  'Ethiopia': 'ET',
  'Tanzania': 'TZ',
  'Uganda': 'UG',
  'Rwanda': 'RW',
  'Senegal': 'SN',
  'Ivory Coast': 'CI',
  'Cameroon': 'CM',
  'Madagascar': 'MG',
  'Mozambique': 'MZ',
  'Zambia': 'ZM',
  'Zimbabwe': 'ZW',
  'Botswana': 'BW',
  'Namibia': 'NA',
  'Pakistan': 'PK',
  'Bangladesh': 'BD',
  'Sri Lanka': 'LK',
  'Nepal': 'NP',
  'Afghanistan': 'AF',
  'Iran': 'IR',
  'Iraq': 'IQ',
  'Saudi Arabia': 'SA',
  'United Arab Emirates': 'AE',
  'Qatar': 'QA',
  'Kuwait': 'KW',
  'Oman': 'OM',
  'Bahrain': 'BH',
  'Jordan': 'JO',
  'Lebanon': 'LB',
  'Syria': 'SY',
  'Israel': 'IL',
  'Palestine': 'PS',
  'Cambodia': 'KH',
  'Albania': 'AL',
  'Mongolia': 'MN',
  'Suriname': 'SR',
  // Caribbean and Central America
  'Dominican Republic': 'DO',
  'Jamaica': 'JM',
  'Trinidad and Tobago': 'TT',
  'Barbados': 'BB',
  'Bahamas': 'BS',
  'Belize': 'BZ',
  'Costa Rica': 'CR',
  'El Salvador': 'SV',
  'Guatemala': 'GT',
  'Honduras': 'HN',
  'Nicaragua': 'NI',
  'Panama': 'PA',
  // Additional countries
  'Democratic Republic of Congo': 'CD',
  'Central African Republic': 'CF'
};

// Reverse mapping: 2-letter code to country name
const CODE_TO_COUNTRY = Object.fromEntries(
  Object.entries(OWID_COUNTRY_MAPPING).map(([country, code]) => [code, country])
);

async function fetchOWIDHDIData(countryCode) {
  try {
    console.log(`Fetching HDI data from ${OWID_HDI_ENDPOINT}`);
    
    // Fetch both data and metadata (same pattern as working OWID APIs)
    const [dataResponse, metadataResponse] = await Promise.all([
      fetch(OWID_HDI_ENDPOINT),
      fetch(OWID_HDI_ENDPOINT.replace('.data.json', '.metadata.json'))
    ]);

    if (!dataResponse.ok) {
      throw new Error(`OWID API error: ${dataResponse.status} ${dataResponse.statusText}`);
    }

    const data = await dataResponse.json();
    const metadata = await metadataResponse.json();

    console.log(`OWID HDI API response structure:`, Object.keys(data));

    // The OWID API returns flat arrays where each index corresponds to one data point
    if (!data.entities || !data.years || !data.values) {
      throw new Error('Invalid OWID API response structure');
    }

    // Find the country name from the 2-letter code
    const countryName = CODE_TO_COUNTRY[countryCode.toUpperCase()];
    if (!countryName) {
      console.warn(`No country mapping found for code: ${countryCode}`);
      return null;
    }

    // Find the entity in metadata
    let targetEntity = null;
    if (metadata.dimensions && metadata.dimensions.entities) {
      targetEntity = metadata.dimensions.entities.values.find(entity => 
        entity.name === countryName || 
        entity.code === countryCode.toUpperCase() ||
        entity.name.toLowerCase() === countryName.toLowerCase()
      );
    }

    if (!targetEntity) {
      console.warn(`Country not found in OWID HDI metadata: ${countryName} (${countryCode})`);
      return null;
    }

    console.log(`Found entity: ${targetEntity.name} (ID: ${targetEntity.id})`);

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

    console.log(`Found data for ${countryName}: ${latestValue} (${latestYear})`);

    return {
      value: latestValue,
      year: latestYear ? latestYear.toString() : null,
      country: countryName,
      entityId: targetEntity.id
    };

  } catch (error) {
    console.error('Error fetching OWID HDI data:', error);
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  try {
    if (country) {
      // Return data for specific country
      const hdiData = await fetchOWIDHDIData(country);
      
      if (hdiData && hdiData.value !== null) {
        return NextResponse.json({
          country: country.toUpperCase(),
          countryName: hdiData.country,
          hdi: hdiData.value,
          source: 'UNDP, Human Development Report',
          year: hdiData.year,
          sourceOrganization: 'United Nations Development Programme',
          description: 'The Human Development Index (HDI) is a summary measure of key dimensions of human development: a long and healthy life, a good education, and a decent standard of living.',
          scale: '0-1 (higher values indicate higher human development)',
          dataSource: 'Our World in Data API'
        });
      } else {
        // Return null for countries not in OWID dataset
        return NextResponse.json({
          country: country.toUpperCase(),
          hdi: null,
          source: 'UNDP, Human Development Report',
          year: null,
          sourceOrganization: 'United Nations Development Programme',
          note: 'HDI data not available for this country',
          dataSource: 'Our World in Data API'
        });
      }
    } else {
      // Return error for bulk requests since OWID doesn't support that efficiently
      return NextResponse.json({
        error: 'Country parameter required',
        message: 'Please specify a country code (e.g., ?country=US)',
        source: 'UNDP, Human Development Report',
        sourceOrganization: 'United Nations Development Programme',
        dataSource: 'Our World in Data API'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in HDI API:', error);
    return NextResponse.json({
      error: 'Failed to fetch HDI data',
      details: error.message,
      country: country,
      dataSource: 'Our World in Data API'
    }, { status: 500 });
  }
} 