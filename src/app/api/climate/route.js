import { NextResponse } from 'next/server';

// Map 2-letter ISO codes to 3-letter codes for World Bank Climate API
const climateCountryCodeMap = {
  // North America
  'US': 'USA',
  'CA': 'CAN',
  'MX': 'MEX',
  
  // Europe
  'GB': 'GBR',
  'DE': 'DEU',
  'FR': 'FRA',
  'IT': 'ITA',
  'ES': 'ESP',
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
  'LU': 'LUX',
  'MT': 'MLT',
  'CY': 'CYP',
  
  // Asia
  'JP': 'JPN',
  'CN': 'CHN',
  'IN': 'IND',
  'KR': 'KOR',
  'TH': 'THA',
  'VN': 'VNM',
  'MY': 'MYS',
  'SG': 'SGP',
  'PH': 'PHL',
  'ID': 'IDN',
  'TR': 'TUR',
  'IL': 'ISR',
  'SA': 'SAU',
  'AE': 'ARE',
  'QA': 'QAT',
  'KW': 'KWT',
  'BH': 'BHR',
  'OM': 'OMN',
  'JO': 'JOR',
  'LB': 'LBN',
  'SY': 'SYR',
  'IQ': 'IRQ',
  'IR': 'IRN',
  'AF': 'AFG',
  'PK': 'PAK',
  'BD': 'BGD',
  'LK': 'LKA',
  'NP': 'NPL',
  'BT': 'BTN',
  'MM': 'MMR',
  'KH': 'KHM',
  'LA': 'LAO',
  'MN': 'MNG',
  'KP': 'PRK',
  'KZ': 'KAZ',
  'UZ': 'UZB',
  'TM': 'TKM',
  'TJ': 'TJK',
  'KG': 'KGZ',
  'AM': 'ARM',
  'AZ': 'AZE',
  'GE': 'GEO',
  
  // South America
  'BR': 'BRA',
  'AR': 'ARG',
  'CL': 'CHL',
  'PE': 'PER',
  'CO': 'COL',
  'VE': 'VEN',
  'EC': 'ECU',
  'BO': 'BOL',
  'PY': 'PRY',
  'UY': 'URY',
  'GY': 'GUY',
  'SR': 'SUR',
  
  // Africa
  'ZA': 'ZAF',
  'EG': 'EGY',
  'NG': 'NGA',
  'KE': 'KEN',
  'ET': 'ETH',
  'GH': 'GHA',
  'TZ': 'TZA',
  'UG': 'UGA',
  'DZ': 'DZA',
  'MA': 'MAR',
  'TN': 'TUN',
  'LY': 'LBY',
  'SD': 'SDN',
  'AO': 'AGO',
  'MZ': 'MOZ',
  'MG': 'MDG',
  'ZW': 'ZWE',
  'ZM': 'ZMB',
  'MW': 'MWI',
  'BW': 'BWA',
  'NA': 'NAM',
  'SZ': 'SWZ',
  'LS': 'LSO',
  
  // Oceania
  'AU': 'AUS',
  'NZ': 'NZL',
  'FJ': 'FJI',
  'PG': 'PNG',
  'SB': 'SLB',
  'VU': 'VUT',
  'NC': 'NCL',
  'PF': 'PYF',
  
  // Eastern Europe & Former Soviet
  'RU': 'RUS',
  'UA': 'UKR',
  'BY': 'BLR',
  'MD': 'MDA',
  'AL': 'ALB',
  'BA': 'BIH',
  'MK': 'MKD',
  'ME': 'MNE',
  'RS': 'SRB',
  'XK': 'XKX', // Kosovo
  
  // Caribbean & Central America
  'GT': 'GTM',
  'BZ': 'BLZ',
  'SV': 'SLV',
  'HN': 'HND',
  'NI': 'NIC',
  'CR': 'CRI',
  'PA': 'PAN',
  'CU': 'CUB',
  'DO': 'DOM',
  'HT': 'HTI',
  'JM': 'JAM',
  'TT': 'TTO',
  'BB': 'BRB',
  'GD': 'GRD',
  'LC': 'LCA',
  'VC': 'VCT',
  'AG': 'ATG',
  'DM': 'DMA',
  'KN': 'KNA'
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const variable = searchParams.get('variable'); // tas, tasmax, tasmin, hd30, hd35, fd, etc.

  if (!country) {
    return NextResponse.json({ error: 'Missing country parameter' }, { status: 400 });
  }

  try {
    // Convert 2-letter country code to 3-letter for World Bank Climate API
    const worldBankCountryCode = climateCountryCodeMap[country.toUpperCase()] || country;
    
    // If no variable specified, fetch multiple key climate variables
    const variables = variable ? [variable] : ['tas', 'hd30', 'hd35', 'fd'];
    const results = {};
    
    console.log(`Fetching climate data for ${country} (${worldBankCountryCode}): ${variables.join(', ')}`);
    
    for (const var_name of variables) {
      try {
        // World Bank Climate API endpoint
        // Using historical climatology data from CRU (Climate Research Unit)
        const climateUrl = `https://cckpapi.worldbank.org/cckp/v1/cru-x0.5_climatology_${var_name}_climatology_annual_1991-2020_median_historical_cru-ensemble_all_mean/${worldBankCountryCode}?_format=json`;
        
        console.log(`Fetching from Climate API: ${climateUrl}`);
        
        const response = await fetch(climateUrl);
        
        if (response.ok) {
          const data = await response.json();
          results[var_name] = data;
        } else {
          console.error(`Climate API error for ${var_name}: ${response.status} ${response.statusText}`);
          // Try alternative format if first request fails
          const alternativeUrl = `https://cckpapi.worldbank.org/cckp/v1/era5-x0.25_climatology_${var_name}_climatology_annual_1991-2020_median_historical_era5-ensemble_all_mean/${worldBankCountryCode}?_format=json`;
          console.log(`Trying alternative URL: ${alternativeUrl}`);
          
          const altResponse = await fetch(alternativeUrl);
          if (altResponse.ok) {
            const altData = await altResponse.json();
            results[var_name] = altData;
          } else {
            console.warn(`Both climate API endpoints failed for ${var_name}`);
            results[var_name] = { error: `Failed to fetch ${var_name} data` };
          }
        }
      } catch (error) {
        console.error(`Error fetching ${var_name}:`, error);
        results[var_name] = { error: error.message };
      }
    }
    
    // If only one variable was requested, return just that data
    if (variable && variables.length === 1) {
      return NextResponse.json(results[variable] || { error: 'No data found' });
    }
    
    // Process and structure the multi-variable response
    const processedData = {
      country: country,
      source: 'World Bank Climate Change Knowledge Portal',
      year: '1991-2020',
      averageTemperature: extractClimateValue(results.tas),
      hotDays30: extractClimateValue(results.hd30) ?? 0, // Default to 0 if null
      hotDays35: extractClimateValue(results.hd35) ?? 0, // Default to 0 if null
      coldDays: extractClimateValue(results.fd) ?? 0, // Default to 0 if null
      rawData: results
    };
    
    // Check if we're hitting rate limits or have no data and provide fallback
    const hasAnyRealData = processedData.averageTemperature !== null;
    
    // Check if we're hitting rate limits (429 errors, empty data arrays, or errors)
    const hasRateLimitErrors = Object.values(results).some(result => 
      (result.error && (result.error.includes('429') || result.error.includes('Failed to fetch'))) ||
      (result.data && Array.isArray(result.data) && result.data.length === 0) ||
      (result.metadata && result.metadata.status === 'success' && result.data && result.data.length === 0)
    );
    
    if (!hasAnyRealData || hasRateLimitErrors) {
      console.log('No climate data found or rate limited, using fallback for', country);
      console.log('Rate limit errors detected:', hasRateLimitErrors);
      
      // Use fallback data when API is unavailable
      const fallbackData = getFallbackClimateData(country);
      if (fallbackData) {
        return NextResponse.json(fallbackData);
      }
    }
    
    console.log('Processed Climate Data:', JSON.stringify(processedData, null, 2));
    
    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Error fetching from Climate API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data from Climate API',
      details: error.message,
      country: country
    }, { status: 500 });
  }
}

// Helper function to extract climate values from API response
function extractClimateValue(apiResponse) {
  if (!apiResponse || apiResponse.error) {
    return null;
  }
  
  try {
    // The World Bank Climate API typically returns data in this structure
    if (apiResponse.data && Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
      // Get the most recent value or average
      const values = apiResponse.data.map(item => item.value).filter(v => v !== null && v !== undefined);
      if (values.length > 0) {
        const value = values[values.length - 1]; // Get latest value
        // For hot days metrics, return 0 instead of null if the value is 0
        return value;
      }
    }
    
    // Alternative structure
    if (typeof apiResponse === 'number') {
      return apiResponse;
    }
    
    // If it's an object with a value property
    if (apiResponse.value !== undefined) {
      return apiResponse.value;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting climate value:', error);
    return null;
  }
}

// Fallback climate data when API is unavailable (rate limited)
function getFallbackClimateData(countryCode) {
  const fallbackData = {
    // North America
    'US': { averageTemperature: 11.3, hotDays30: 85, hotDays35: 35, coldDays: 12 },
    'CA': { averageTemperature: 1.4, hotDays30: 15, hotDays35: 3, coldDays: 120 },
    'MX': { averageTemperature: 21.0, hotDays30: 150, hotDays35: 85, coldDays: 1 },
    
    // Europe - Western
    'DE': { averageTemperature: 9.6, hotDays30: 8, hotDays35: 2, coldDays: 45 },
    'FR': { averageTemperature: 11.8, hotDays30: 15, hotDays35: 3, coldDays: 25 },
    'GB': { averageTemperature: 9.8, hotDays30: 2, hotDays35: 0, coldDays: 20 },
    'IT': { averageTemperature: 13.2, hotDays30: 25, hotDays35: 8, coldDays: 15 },
    'ES': { averageTemperature: 14.1, hotDays30: 45, hotDays35: 15, coldDays: 8 },
    'NL': { averageTemperature: 10.2, hotDays30: 3, hotDays35: 0, coldDays: 25 },
    'BE': { averageTemperature: 10.5, hotDays30: 4, hotDays35: 1, coldDays: 22 },
    'CH': { averageTemperature: 7.5, hotDays30: 12, hotDays35: 3, coldDays: 65 },
    'AT': { averageTemperature: 7.8, hotDays30: 15, hotDays35: 4, coldDays: 55 },
    'GR': { averageTemperature: 16.4, hotDays30: 65, hotDays35: 25, coldDays: 5 },
    'PT': { averageTemperature: 15.9, hotDays30: 35, hotDays35: 12, coldDays: 3 },
    'IE': { averageTemperature: 9.8, hotDays30: 1, hotDays35: 0, coldDays: 15 },
    'LU': { averageTemperature: 9.3, hotDays30: 5, hotDays35: 1, coldDays: 35 },
    
    // Europe - Northern
    'SE': { averageTemperature: 2.1, hotDays30: 2, hotDays35: 0, coldDays: 95 },
    'NO': { averageTemperature: 1.5, hotDays30: 1, hotDays35: 0, coldDays: 110 },
    'DK': { averageTemperature: 8.9, hotDays30: 2, hotDays35: 0, coldDays: 35 },
    'FI': { averageTemperature: 1.7, hotDays30: 3, hotDays35: 0, coldDays: 125 },
    
    // Europe - Central/Eastern
    'PL': { averageTemperature: 8.5, hotDays30: 8, hotDays35: 2, coldDays: 65 },
    'CZ': { averageTemperature: 8.9, hotDays30: 12, hotDays35: 3, coldDays: 55 },
    'HU': { averageTemperature: 10.7, hotDays30: 18, hotDays35: 5, coldDays: 45 },
    'SK': { averageTemperature: 9.1, hotDays30: 12, hotDays35: 3, coldDays: 58 },
    'SI': { averageTemperature: 9.8, hotDays30: 18, hotDays35: 5, coldDays: 48 },
    'HR': { averageTemperature: 12.1, hotDays30: 28, hotDays35: 8, coldDays: 25 },
    'RO': { averageTemperature: 9.6, hotDays30: 22, hotDays35: 8, coldDays: 55 },
    'BG': { averageTemperature: 11.4, hotDays30: 35, hotDays35: 12, coldDays: 35 },
    
    // Europe - Baltic States
    'LT': { averageTemperature: 6.8, hotDays30: 8, hotDays35: 1, coldDays: 85 },
    'LV': { averageTemperature: 6.2, hotDays30: 6, hotDays35: 1, coldDays: 90 },
    'EE': { averageTemperature: 6.0, hotDays30: 5, hotDays35: 0, coldDays: 95 },
    
    // Asia - Major Powers
    'JP': { averageTemperature: 14.9, hotDays30: 55, hotDays35: 20, coldDays: 35 },
    'CN': { averageTemperature: 8.1, hotDays30: 25, hotDays35: 8, coldDays: 85 },
    'IN': { averageTemperature: 24.7, hotDays30: 180, hotDays35: 120, coldDays: 0 },
    'KR': { averageTemperature: 12.5, hotDays30: 35, hotDays35: 12, coldDays: 55 },
    'RU': { averageTemperature: -5.1, hotDays30: 8, hotDays35: 2, coldDays: 180 },
    
    // Asia - Southeast Asia
    'TH': { averageTemperature: 28.5, hotDays30: 340, hotDays35: 180, coldDays: 0 },
    'VN': { averageTemperature: 25.2, hotDays30: 280, hotDays35: 120, coldDays: 0 },
    'MY': { averageTemperature: 27.0, hotDays30: 365, hotDays35: 220, coldDays: 0 },
    'SG': { averageTemperature: 27.8, hotDays30: 365, hotDays35: 250, coldDays: 0 },
    'PH': { averageTemperature: 26.6, hotDays30: 365, hotDays35: 180, coldDays: 0 },
    'ID': { averageTemperature: 26.2, hotDays30: 365, hotDays35: 160, coldDays: 0 },
    'MM': { averageTemperature: 26.1, hotDays30: 320, hotDays35: 140, coldDays: 0 },
    'KH': { averageTemperature: 27.7, hotDays30: 340, hotDays35: 200, coldDays: 0 },
    'LA': { averageTemperature: 25.9, hotDays30: 300, hotDays35: 120, coldDays: 0 },
    
    // Asia - Middle East
    'TR': { averageTemperature: 13.5, hotDays30: 45, hotDays35: 20, coldDays: 25 },
    'IL': { averageTemperature: 20.1, hotDays30: 140, hotDays35: 65, coldDays: 0 },
    'SA': { averageTemperature: 26.0, hotDays30: 280, hotDays35: 200, coldDays: 0 },
    'AE': { averageTemperature: 28.2, hotDays30: 320, hotDays35: 220, coldDays: 0 },
    'QA': { averageTemperature: 28.5, hotDays30: 330, hotDays35: 230, coldDays: 0 },
    'KW': { averageTemperature: 26.6, hotDays30: 290, hotDays35: 180, coldDays: 0 },
    'BH': { averageTemperature: 27.2, hotDays30: 300, hotDays35: 190, coldDays: 0 },
    'OM': { averageTemperature: 28.0, hotDays30: 320, hotDays35: 210, coldDays: 0 },
    'JO': { averageTemperature: 17.1, hotDays30: 90, hotDays35: 35, coldDays: 5 },
    'LB': { averageTemperature: 16.8, hotDays30: 85, hotDays35: 30, coldDays: 8 },
    'SY': { averageTemperature: 18.8, hotDays30: 120, hotDays35: 55, coldDays: 12 },
    'IQ': { averageTemperature: 22.1, hotDays30: 180, hotDays35: 120, coldDays: 3 },
    'IR': { averageTemperature: 17.0, hotDays30: 85, hotDays35: 40, coldDays: 25 },
    
    // South America
    'BR': { averageTemperature: 25.2, hotDays30: 220, hotDays35: 150, coldDays: 0 },
    'AR': { averageTemperature: 14.4, hotDays30: 45, hotDays35: 18, coldDays: 8 },
    'CL': { averageTemperature: 8.9, hotDays30: 5, hotDays35: 1, coldDays: 25 },
    'PE': { averageTemperature: 19.0, hotDays30: 65, hotDays35: 15, coldDays: 0 },
    'CO': { averageTemperature: 24.0, hotDays30: 200, hotDays35: 80, coldDays: 0 },
    'VE': { averageTemperature: 26.1, hotDays30: 320, hotDays35: 180, coldDays: 0 },
    'EC': { averageTemperature: 22.5, hotDays30: 180, hotDays35: 60, coldDays: 0 },
    'BO': { averageTemperature: 21.2, hotDays30: 140, hotDays35: 45, coldDays: 2 },
    'PY': { averageTemperature: 23.2, hotDays30: 180, hotDays35: 85, coldDays: 0 },
    'UY': { averageTemperature: 16.5, hotDays30: 55, hotDays35: 18, coldDays: 5 },
    'GY': { averageTemperature: 26.9, hotDays30: 340, hotDays35: 200, coldDays: 0 },
    'SR': { averageTemperature: 27.0, hotDays30: 350, hotDays35: 220, coldDays: 0 },
    
    // Africa
    'ZA': { averageTemperature: 17.4, hotDays30: 85, hotDays35: 25, coldDays: 8 },
    'EG': { averageTemperature: 22.1, hotDays30: 160, hotDays35: 90, coldDays: 0 },
    'NG': { averageTemperature: 27.0, hotDays30: 320, hotDays35: 180, coldDays: 0 },
    'KE': { averageTemperature: 20.4, hotDays30: 120, hotDays35: 35, coldDays: 0 },
    'ET': { averageTemperature: 22.2, hotDays30: 140, hotDays35: 45, coldDays: 0 },
    'GH': { averageTemperature: 26.8, hotDays30: 310, hotDays35: 165, coldDays: 0 },
    'TZ': { averageTemperature: 21.1, hotDays30: 130, hotDays35: 40, coldDays: 0 },
    'UG': { averageTemperature: 21.8, hotDays30: 140, hotDays35: 45, coldDays: 0 },
    'DZ': { averageTemperature: 17.7, hotDays30: 95, hotDays35: 45, coldDays: 5 },
    'SR': { averageTemperature: 27.0, hotDays30: 365, hotDays35: 200, coldDays: 0 },
    'MN': { averageTemperature: -0.4, hotDays30: 15, hotDays35: 2, coldDays: 180 },
    'MA': { averageTemperature: 17.8, hotDays30: 85, hotDays35: 30, coldDays: 8 },
    'TN': { averageTemperature: 19.8, hotDays30: 110, hotDays35: 50, coldDays: 2 },
    
    // Oceania
    'AU': { averageTemperature: 21.9, hotDays30: 95, hotDays35: 55, coldDays: 2 },
    'NZ': { averageTemperature: 12.2, hotDays30: 15, hotDays35: 2, coldDays: 25 },
    'FJ': { averageTemperature: 25.6, hotDays30: 300, hotDays35: 120, coldDays: 0 },
    'PG': { averageTemperature: 25.9, hotDays30: 320, hotDays35: 140, coldDays: 0 },
    
    // Eastern Europe & Former Soviet
    'UA': { averageTemperature: 7.8, hotDays30: 15, hotDays35: 4, coldDays: 75 },
    'BY': { averageTemperature: 6.8, hotDays30: 8, hotDays35: 2, coldDays: 95 },
    'MD': { averageTemperature: 9.6, hotDays30: 18, hotDays35: 6, coldDays: 55 },
    'AL': { averageTemperature: 15.2, hotDays30: 55, hotDays35: 20, coldDays: 12 },
    'BA': { averageTemperature: 10.0, hotDays30: 20, hotDays35: 6, coldDays: 45 },
    'MK': { averageTemperature: 11.8, hotDays30: 28, hotDays35: 10, coldDays: 35 },
    'ME': { averageTemperature: 11.2, hotDays30: 25, hotDays35: 8, coldDays: 40 },
    'RS': { averageTemperature: 10.9, hotDays30: 22, hotDays35: 7, coldDays: 42 },
    
    // Central Asia
    'KZ': { averageTemperature: 6.7, hotDays30: 45, hotDays35: 18, coldDays: 120 },
    'UZ': { averageTemperature: 14.2, hotDays30: 85, hotDays35: 45, coldDays: 25 },
    'TM': { averageTemperature: 16.1, hotDays30: 120, hotDays35: 70, coldDays: 15 },
    'TJ': { averageTemperature: 11.8, hotDays30: 55, hotDays35: 25, coldDays: 45 },
    'KG': { averageTemperature: 6.5, hotDays30: 35, hotDays35: 12, coldDays: 85 },
    'AM': { averageTemperature: 7.5, hotDays30: 22, hotDays35: 8, coldDays: 65 },
    'AZ': { averageTemperature: 12.8, hotDays30: 45, hotDays35: 20, coldDays: 25 },
    'GE': { averageTemperature: 9.2, hotDays30: 25, hotDays35: 8, coldDays: 35 },
    
    // Caribbean & Central America
    'GT': { averageTemperature: 22.4, hotDays30: 180, hotDays35: 65, coldDays: 0 },
    'BZ': { averageTemperature: 26.0, hotDays30: 320, hotDays35: 180, coldDays: 0 },
    'SV': { averageTemperature: 24.0, hotDays30: 240, hotDays35: 120, coldDays: 0 },
    'HN': { averageTemperature: 23.1, hotDays30: 200, hotDays35: 85, coldDays: 0 },
    'NI': { averageTemperature: 25.2, hotDays30: 280, hotDays35: 140, coldDays: 0 },
    'CR': { averageTemperature: 21.8, hotDays30: 160, hotDays35: 55, coldDays: 0 },
    'PA': { averageTemperature: 26.1, hotDays30: 320, hotDays35: 180, coldDays: 0 },
    'CU': { averageTemperature: 25.5, hotDays30: 290, hotDays35: 160, coldDays: 0 },
    'DO': { averageTemperature: 25.9, hotDays30: 310, hotDays35: 180, coldDays: 0 },
    'HT': { averageTemperature: 25.4, hotDays30: 300, hotDays35: 170, coldDays: 0 },
    'JM': { averageTemperature: 26.1, hotDays30: 320, hotDays35: 185, coldDays: 0 }
  };
  
  const data = fallbackData[countryCode.toUpperCase()];
  if (data) {
    return {
      country: countryCode,
      source: 'Approximate Climate Data (World Bank API temporarily unavailable)',
      year: '1991-2020 (estimated)',
      averageTemperature: data.averageTemperature,
      hotDays30: data.hotDays30,
      hotDays35: data.hotDays35,
      coldDays: data.coldDays,
      note: 'This is fallback data due to API rate limits. Actual values may vary.'
    };
  }
  
  return null;
} 