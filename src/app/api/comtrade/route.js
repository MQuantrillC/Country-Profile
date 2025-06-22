import { NextResponse } from 'next/server';

// UN Comtrade API configuration
const COMTRADE_BASE_URL = 'https://comtrade.un.org/api/get';
const PRIMARY_KEY = 'c22b2717bd254d3590168c68d9d22730';
const SECONDARY_KEY = 'a314e247c34544c3a633db7686153a7b';

// Country code mapping for UN Comtrade (ISO3 to UN Comtrade codes)
const COUNTRY_CODE_MAPPING = {
  'USA': '840', 'US': '840',
  'CHN': '156', 'CN': '156',
  'JPN': '392', 'JP': '392',
  'DEU': '276', 'DE': '276',
  'IND': '356', 'IN': '356',
  'GBR': '826', 'GB': '826',
  'FRA': '250', 'FR': '250',
  'ITA': '380', 'IT': '380',
  'BRA': '076', 'BR': '076',
  'CAN': '124', 'CA': '124',
  'RUS': '643', 'RU': '643',
  'KOR': '410', 'KR': '410',
  'AUS': '036', 'AU': '036',
  'ESP': '724', 'ES': '724',
  'MEX': '484', 'MX': '484',
  'IDN': '360', 'ID': '360',
  'NLD': '528', 'NL': '528',
  'SAU': '682', 'SA': '682',
  'TUR': '792', 'TR': '792',
  'CHE': '756', 'CH': '756',
  'TWN': '158', 'TW': '158',
  'BEL': '056', 'BE': '056',
  'IRE': '372', 'IE': '372',
  'ISR': '376', 'IL': '376',
  'ARE': '784', 'AE': '784',
  'NOR': '578', 'NO': '578',
  'AUT': '040', 'AT': '040',
  'NGA': '566', 'NG': '566',
  'EGY': '818', 'EG': '818',
  'ZAF': '710', 'ZA': '710',
  'BGD': '050', 'BD': '050',
  'VNM': '704', 'VN': '704',
  'CHL': '152', 'CL': '152',
  'FIN': '246', 'FI': '246',
  'MYS': '458', 'MY': '458',
  'PHL': '608', 'PH': '608',
  'SGP': '702', 'SG': '702',
  'DNK': '208', 'DK': '208',
  'PER': '604', 'PE': '604',
  'VEN': '862', 'VE': '862',
  'ARG': '032', 'AR': '032',
  'COL': '170', 'CO': '170',
  'ECU': '218', 'EC': '218',
  'URY': '858', 'UY': '858',
  'PRY': '600', 'PY': '600',
  'BOL': '068', 'BO': '068',
  'GUY': '328', 'GY': '328',
  'SUR': '740', 'SR': '740'
};

// Helper function to get UN Comtrade country code
function getComtradeCountryCode(countryCode) {
  return COUNTRY_CODE_MAPPING[countryCode.toUpperCase()] || null;
}

// Helper function to make API request with retry logic
async function makeComtradeRequest(url, retryCount = 0) {
  const maxRetries = 2;
  
  try {
    console.log(`Making Comtrade request: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Comtrade API error (attempt ${retryCount + 1}):`, error);
    
    if (retryCount < maxRetries) {
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return makeComtradeRequest(url, retryCount + 1);
    }
    
    throw error;
  }
}

// Helper function to format trade value
function formatTradeValue(value) {
  if (!value) return null;
  
  // Convert to billions for easier reading
  if (value >= 1000000000) {
    return {
      value: value / 1000000000,
      formatted: `$${(value / 1000000000).toFixed(1)}B`,
      unit: 'billions'
    };
  } else if (value >= 1000000) {
    return {
      value: value / 1000000,
      formatted: `$${(value / 1000000).toFixed(1)}M`,
      unit: 'millions'
    };
  } else {
    return {
      value: value,
      formatted: `$${value.toLocaleString()}`,
      unit: 'dollars'
    };
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country');
    
    if (!countryCode) {
      return NextResponse.json(
        { error: 'Country code is required' },
        { status: 400 }
      );
    }

    const comtradeCountryCode = getComtradeCountryCode(countryCode);
    if (!comtradeCountryCode) {
      return NextResponse.json(
        { error: `Country code ${countryCode} not supported` },
        { status: 400 }
      );
    }

    console.log(`Fetching UN Comtrade data for ${countryCode} (${comtradeCountryCode})`);

    // Get current year and previous year for comparison
    const currentYear = new Date().getFullYear() - 1; // Use previous year as current year data might not be complete
    const previousYear = currentYear - 1;

    // Construct API URLs for exports and imports using the correct UN Comtrade format
    const exportsUrl = `${COMTRADE_BASE_URL}?type=C&freq=A&px=HS&ps=${currentYear}&r=${comtradeCountryCode}&p=all&rg=2&cc=TOTAL&fmt=json&subscription-key=${PRIMARY_KEY}`;
    
    const importsUrl = `${COMTRADE_BASE_URL}?type=C&freq=A&px=HS&ps=${currentYear}&r=${comtradeCountryCode}&p=all&rg=1&cc=TOTAL&fmt=json&subscription-key=${PRIMARY_KEY}`;

    console.log('Exports URL:', exportsUrl);
    console.log('Imports URL:', importsUrl);

    // Fetch both exports and imports data with error handling
    let exportsData = null;
    let importsData = null;
    
    try {
      [exportsData, importsData] = await Promise.all([
        makeComtradeRequest(exportsUrl),
        makeComtradeRequest(importsUrl)
      ]);
    } catch (apiError) {
      console.warn('UN Comtrade API failed, using fallback data:', apiError.message);
      
              // Sample trade data for major countries (in USD) - 2023 data
        const sampleTradeData = {
          'US': {
            exports: 1645000000000, // $1.645 trillion
            imports: 2407000000000, // $2.407 trillion
            exportPartners: [
              { country: 'Canada', value: 307000000000, percentage: '18.7' },
              { country: 'Mexico', value: 276000000000, percentage: '16.8' },
              { country: 'China', value: 151000000000, percentage: '9.2' },
              { country: 'Japan', value: 75000000000, percentage: '4.6' },
              { country: 'United Kingdom', value: 69000000000, percentage: '4.2' }
            ],
            importPartners: [
              { country: 'China', value: 427000000000, percentage: '17.7' },
              { country: 'Canada', value: 429000000000, percentage: '17.8' },
              { country: 'Mexico', value: 405000000000, percentage: '16.8' },
              { country: 'Japan', value: 148000000000, percentage: '6.1' },
              { country: 'Germany', value: 146000000000, percentage: '6.1' }
            ]
          },
          'CN': {
            exports: 3364000000000, // $3.364 trillion
            imports: 2714000000000, // $2.714 trillion
            exportPartners: [
              { country: 'United States', value: 427000000000, percentage: '12.7' },
              { country: 'Hong Kong', value: 273000000000, percentage: '8.1' },
              { country: 'Japan', value: 166000000000, percentage: '4.9' },
              { country: 'Germany', value: 106000000000, percentage: '3.2' },
              { country: 'South Korea', value: 101000000000, percentage: '3.0' }
            ],
            importPartners: [
              { country: 'South Korea', value: 213000000000, percentage: '7.8' },
              { country: 'Japan', value: 170000000000, percentage: '6.3' },
              { country: 'United States', value: 151000000000, percentage: '5.6' },
              { country: 'Germany', value: 107000000000, percentage: '3.9' },
              { country: 'Australia', value: 104000000000, percentage: '3.8' }
            ]
          },
          'DE': {
            exports: 1560000000000, // $1.56 trillion
            imports: 1340000000000, // $1.34 trillion
            exportPartners: [
              { country: 'United States', value: 156000000000, percentage: '10.0' },
              { country: 'France', value: 109000000000, percentage: '7.0' },
              { country: 'China', value: 106000000000, percentage: '6.8' },
              { country: 'Netherlands', value: 98000000000, percentage: '6.3' },
              { country: 'United Kingdom', value: 78000000000, percentage: '5.0' }
            ],
            importPartners: [
              { country: 'China', value: 191000000000, percentage: '14.3' },
              { country: 'Netherlands', value: 107000000000, percentage: '8.0' },
              { country: 'United States', value: 85000000000, percentage: '6.3' },
              { country: 'France', value: 67000000000, percentage: '5.0' },
              { country: 'Italy', value: 60000000000, percentage: '4.5' }
            ]
          },
          'PE': {
            exports: 63000000000, // $63 billion
            imports: 48000000000, // $48 billion
            exportPartners: [
              { country: 'China', value: 18900000000, percentage: '30.0' },
              { country: 'United States', value: 7560000000, percentage: '12.0' },
              { country: 'Canada', value: 3780000000, percentage: '6.0' },
              { country: 'South Korea', value: 3150000000, percentage: '5.0' },
              { country: 'Japan', value: 2520000000, percentage: '4.0' }
            ],
            importPartners: [
              { country: 'China', value: 9600000000, percentage: '20.0' },
              { country: 'United States', value: 7200000000, percentage: '15.0' },
              { country: 'Brazil', value: 2880000000, percentage: '6.0' },
              { country: 'Argentina', value: 2400000000, percentage: '5.0' },
              { country: 'Chile', value: 1920000000, percentage: '4.0' }
            ]
          }
        };
      
      const countryData = sampleTradeData[countryCode.toUpperCase()];
      
      if (countryData) {
        const tradeBalance = countryData.exports - countryData.imports;
        
        const fallbackData = {
          country: countryCode,
          year: currentYear,
          totalExports: {
            value: countryData.exports,
            formatted: formatTradeValue(countryData.exports)
          },
          totalImports: {
            value: countryData.imports,
            formatted: formatTradeValue(countryData.imports)
          },
          tradeBalance: {
            value: tradeBalance,
            formatted: formatTradeValue(Math.abs(tradeBalance)),
            status: tradeBalance >= 0 ? 'surplus' : 'deficit'
          },
          topExportPartners: countryData.exportPartners.map(partner => ({
            ...partner,
            formatted: formatTradeValue(partner.value)
          })),
          topImportPartners: countryData.importPartners.map(partner => ({
            ...partner,
            formatted: formatTradeValue(partner.value)
          })),
          source: 'UN Comtrade (sample data)',
          sourceOrganization: 'United Nations Statistics Division',
          lastUpdated: new Date().toISOString(),
          note: 'Using sample data - API temporarily unavailable'
        };
        
        return NextResponse.json(fallbackData);
      } else {
        // Return null data structure for unsupported countries
        const fallbackData = {
          country: countryCode,
          year: currentYear,
          totalExports: {
            value: null,
            formatted: null
          },
          totalImports: {
            value: null,
            formatted: null
          },
          tradeBalance: {
            value: null,
            formatted: null,
            status: 'unknown'
          },
          topExportPartners: [],
          topImportPartners: [],
          source: 'UN Comtrade (unavailable)',
          sourceOrganization: 'United Nations Statistics Division',
          lastUpdated: new Date().toISOString(),
          error: 'API temporarily unavailable'
        };
        
        return NextResponse.json(fallbackData);
      }
    }

    // Process exports data
    let totalExports = 0;
    let topExportPartners = [];
    
    if (exportsData?.dataset && Array.isArray(exportsData.dataset)) {
      // Find the total exports value
      const totalExportRecord = exportsData.dataset.find(item => 
        item.cmdCode === 'TOTAL' || item.ptCode === '0'
      );
      totalExports = totalExportRecord ? totalExportRecord.TradeValue : 0;
      
      // Get top export partners (excluding total/world)
      topExportPartners = exportsData.dataset
        .filter(item => 
          item.cmdCode !== 'TOTAL' && 
          item.ptCode !== '0' && 
          item.ptTitle !== 'World' &&
          item.TradeValue > 0
        )
        .sort((a, b) => (b.TradeValue || 0) - (a.TradeValue || 0))
        .slice(0, 5)
        .map(item => ({
          country: item.ptTitle,
          value: item.TradeValue,
          formatted: formatTradeValue(item.TradeValue),
          percentage: totalExports > 0 ? ((item.TradeValue / totalExports) * 100).toFixed(1) : 0
        }));
    }

    // Process imports data
    let totalImports = 0;
    let topImportPartners = [];
    
    if (importsData?.dataset && Array.isArray(importsData.dataset)) {
      // Find the total imports value
      const totalImportRecord = importsData.dataset.find(item => 
        item.cmdCode === 'TOTAL' || item.ptCode === '0'
      );
      totalImports = totalImportRecord ? totalImportRecord.TradeValue : 0;
      
      // Get top import partners (excluding total/world)
      topImportPartners = importsData.dataset
        .filter(item => 
          item.cmdCode !== 'TOTAL' && 
          item.ptCode !== '0' && 
          item.ptTitle !== 'World' &&
          item.TradeValue > 0
        )
        .sort((a, b) => (b.TradeValue || 0) - (a.TradeValue || 0))
        .slice(0, 5)
        .map(item => ({
          country: item.ptTitle,
          value: item.TradeValue,
          formatted: formatTradeValue(item.TradeValue),
          percentage: totalImports > 0 ? ((item.TradeValue / totalImports) * 100).toFixed(1) : 0
        }));
    }

    // Calculate trade balance
    const tradeBalance = totalExports - totalImports;
    const tradeBalanceFormatted = formatTradeValue(Math.abs(tradeBalance));

    const result = {
      country: countryCode,
      year: currentYear,
      totalExports: {
        value: totalExports,
        formatted: formatTradeValue(totalExports)
      },
      totalImports: {
        value: totalImports,
        formatted: formatTradeValue(totalImports)
      },
      tradeBalance: {
        value: tradeBalance,
        formatted: tradeBalanceFormatted,
        status: tradeBalance >= 0 ? 'surplus' : 'deficit'
      },
      topExportPartners,
      topImportPartners,
      source: 'UN Comtrade',
      sourceOrganization: 'United Nations Statistics Division',
      lastUpdated: new Date().toISOString()
    };

    console.log(`Successfully processed UN Comtrade data for ${countryCode}:`, {
      totalExports: result.totalExports.formatted,
      totalImports: result.totalImports.formatted,
      tradeBalance: result.tradeBalance.formatted,
      topExportPartners: result.topExportPartners.length,
      topImportPartners: result.topImportPartners.length
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('UN Comtrade API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch trade data',
        details: error.message,
        source: 'UN Comtrade API'
      },
      { status: 500 }
    );
  }
} 