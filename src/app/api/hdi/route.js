import { NextResponse } from 'next/server';

// HDI data mapping from country names to 2-letter codes
const countryNameToCode = {
  'United Kingdom': 'GB',
  'United States': 'US',
  'South Korea': 'KR',
  'India': 'IN',
  'China': 'CN',
  'Brazil': 'BR',
  'Democratic Republic of Congo': 'CD',
  'Chile': 'CL',
  'Switzerland': 'CH',
  'Central African Republic': 'CF',
  'Cameroon': 'CM',
  'Pakistan': 'PK',
  'Cambodia': 'KH',
  'Albania': 'AL',
  'Egypt': 'EG',
  'Bolivia': 'BO',
  'Greece': 'GR',
  'Bosnia and Herzegovina': 'BA',
  'Hungary': 'HU',
  'Germany': 'DE',
  'France': 'FR',
  'Italy': 'IT',
  'Spain': 'ES',
  'Japan': 'JP',
  'Canada': 'CA',
  'Australia': 'AU',
  'Russia': 'RU',
  'Mexico': 'MX',
  'Turkey': 'TR',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Austria': 'AT',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Poland': 'PL',
  'Czech Republic': 'CZ',
  'Czechia': 'CZ',
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
  'Serbia': 'RS',
  'Montenegro': 'ME',
  'North Macedonia': 'MK',
  'Moldova': 'MD',
  'Belarus': 'BY',
  'Ukraine': 'UA',
  'Iceland': 'IS',
  'Argentina': 'AR',
  'Qatar': 'QA',
  'Colombia': 'CO',
  'Peru': 'PE',
  'Dominican Republic': 'DO',
  'Algeria': 'DZ',
  'Suriname': 'SR'
};

// Sample HDI values for the countries (2023 UNDP data)
const hdiValues = {
  'United Kingdom': 0.929,
  'United States': 0.921,
  'South Korea': 0.925,
  'India': 0.633,
  'China': 0.768,
  'Brazil': 0.754,
  'Democratic Republic of Congo': 0.479,
  'Chile': 0.855,
  'Switzerland': 0.962,
  'Central African Republic': 0.387,
  'Cameroon': 0.563,
  'Pakistan': 0.544,
  'Cambodia': 0.593,
  'Albania': 0.796,
  'Egypt': 0.731,
  'Bolivia': 0.692,
  'Greece': 0.887,
  'Bosnia and Herzegovina': 0.780,
  'Hungary': 0.851,
  'Germany': 0.942,
  'France': 0.910,
  'Italy': 0.895,
  'Spain': 0.905,
  'Japan': 0.925,
  'Canada': 0.929,
  'Australia': 0.946,
  'Russia': 0.821,
  'Mexico': 0.758,
  'Turkey': 0.838,
  'Netherlands': 0.941,
  'Belgium': 0.937,
  'Austria': 0.926,
  'Sweden': 0.952,
  'Norway': 0.966,
  'Denmark': 0.948,
  'Finland': 0.942,
  'Poland': 0.876,
  'Czech Republic': 0.895,
  'Czechia': 0.895,
  'Portugal': 0.874,
  'Ireland': 0.945,
  'Slovakia': 0.848,
  'Slovenia': 0.918,
  'Croatia': 0.858,
  'Bulgaria': 0.795,
  'Romania': 0.821,
  'Lithuania': 0.875,
  'Latvia': 0.863,
  'Estonia': 0.890,
  'Luxembourg': 0.930,
  'Malta': 0.918,
  'Cyprus': 0.896,
  'Serbia': 0.802,
  'Montenegro': 0.832,
  'North Macedonia': 0.770,
  'Moldova': 0.767,
  'Belarus': 0.808,
  'Ukraine': 0.734,
  'Iceland': 0.959,
  'Argentina': 0.849,
  'Qatar': 0.855,
  'Colombia': 0.752,
  'Peru': 0.762,
  'Dominican Republic': 0.767,
  'Algeria': 0.745,
  'Suriname': 0.730
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  try {
    if (country) {
      // Return data for specific country
      const countryName = Object.keys(countryNameToCode).find(
        name => countryNameToCode[name].toLowerCase() === country.toLowerCase()
      );
      
      if (countryName && hdiValues[countryName]) {
        return NextResponse.json({
          country: country.toUpperCase(),
          countryName: countryName,
          hdi: hdiValues[countryName],
          source: 'UNDP, Human Development Report (2025)',
          year: '2023',
          sourceOrganization: 'United Nations Development Programme',
          description: 'The Human Development Index (HDI) is a summary measure of key dimensions of human development: a long and healthy life, a good education, and a decent standard of living.',
          scale: '0-1 (higher values indicate higher human development)'
        });
      } else {
        // Return null for countries not in our dataset
        return NextResponse.json({
          country: country.toUpperCase(),
          hdi: null,
          source: 'UNDP, Human Development Report (2025)',
          year: '2023',
          sourceOrganization: 'United Nations Development Programme',
          note: 'HDI data not available for this country in the current dataset'
        });
      }
    } else {
      // Return all available data
      const allCountries = Object.keys(countryNameToCode).map(countryName => ({
        code: countryNameToCode[countryName],
        name: countryName,
        hdi: hdiValues[countryName]
      }));

      return NextResponse.json({
        countries: allCountries,
        source: 'UNDP, Human Development Report (2025)',
        year: '2023',
        sourceOrganization: 'United Nations Development Programme',
        totalCountries: allCountries.length,
        description: 'The Human Development Index (HDI) is a summary measure of key dimensions of human development: a long and healthy life, a good education, and a decent standard of living.'
      });
    }
  } catch (error) {
    console.error('Error in HDI API:', error);
    return NextResponse.json({
      error: 'Failed to fetch HDI data',
      details: error.message,
      country: country
    }, { status: 500 });
  }
} 