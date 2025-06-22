import { NextResponse } from 'next/server';

// Mapping from ISO codes (used in our app) to GEC codes (used by factbook)
const isoToGecMapping = {
  'US': 'us', 'CN': 'ch', 'JP': 'ja', 'DE': 'gm', 'IN': 'in', 'GB': 'uk', 'FR': 'fr', 'IT': 'it',
  'BR': 'br', 'CA': 'ca', 'RU': 'rs', 'KR': 'ks', 'AU': 'as', 'ES': 'sp', 'MX': 'mx', 'ID': 'id',
  'NL': 'nl', 'SA': 'sa', 'TR': 'tu', 'CH': 'sz', 'NG': 'ni', 'ZA': 'sf', 'EG': 'eg', 'KE': 'ke',
  'MA': 'mo', 'ET': 'et', 'GH': 'gh', 'TH': 'th', 'VN': 'vm', 'PH': 'rp', 'MY': 'my', 'SG': 'sn',
  'BD': 'bg', 'PK': 'pk', 'LK': 'ce', 'AR': 'ar', 'CL': 'ci', 'CO': 'co', 'PE': 'pe', 'VE': 've',
  'EC': 'ec', 'UY': 'uy', 'BO': 'bl', 'PY': 'pa', 'PL': 'pl', 'BE': 'be', 'SE': 'sw', 'AT': 'au',
  'NO': 'no', 'DK': 'da', 'FI': 'fi', 'IE': 'ei', 'PT': 'po', 'GR': 'gr', 'IL': 'is', 'AE': 'ae',
  'IR': 'ir', 'IQ': 'iz', 'JO': 'jo', 'LB': 'le', 'NZ': 'nz', 'UA': 'up', 'KZ': 'kz', 'UZ': 'uz',
  'AF': 'af', 'MM': 'bm', 'KH': 'cb', 'LA': 'la', 'NP': 'np', 'BT': 'bt'
};

// Region mapping for factbook URL construction
const regionMapping = {
  'us': 'north-america', 'ch': 'east-n-southeast-asia', 'ja': 'east-n-southeast-asia', 'gm': 'europe',
  'in': 'south-asia', 'uk': 'europe', 'fr': 'europe', 'it': 'europe', 'br': 'south-america',
  'ca': 'north-america', 'rs': 'central-asia', 'ks': 'east-n-southeast-asia', 'as': 'australia-oceania',
  'sp': 'europe', 'mx': 'north-america', 'id': 'east-n-southeast-asia', 'nl': 'europe', 'sa': 'middle-east',
  'tu': 'middle-east', 'sz': 'europe', 'ni': 'africa', 'sf': 'africa', 'eg': 'africa', 'ke': 'africa',
  'mo': 'africa', 'et': 'africa', 'gh': 'africa', 'th': 'east-n-southeast-asia', 'vm': 'east-n-southeast-asia',
  'rp': 'east-n-southeast-asia', 'my': 'east-n-southeast-asia', 'sn': 'east-n-southeast-asia',
  'bg': 'south-asia', 'pk': 'south-asia', 'ce': 'south-asia', 'ar': 'south-america', 'ci': 'south-america',
  'co': 'south-america', 'pe': 'south-america', 've': 'south-america', 'ec': 'south-america',
  'uy': 'south-america', 'bl': 'south-america', 'pa': 'south-america', 'pl': 'europe', 'be': 'europe',
  'sw': 'europe', 'au': 'europe', 'no': 'europe', 'da': 'europe', 'fi': 'europe', 'ei': 'europe',
  'po': 'europe', 'gr': 'europe', 'is': 'middle-east', 'ae': 'middle-east', 'ir': 'middle-east',
  'iz': 'middle-east', 'jo': 'middle-east', 'le': 'middle-east', 'nz': 'australia-oceania',
  'up': 'europe', 'kz': 'central-asia', 'uz': 'central-asia', 'af': 'south-asia', 'bm': 'east-n-southeast-asia',
  'cb': 'east-n-southeast-asia', 'la': 'east-n-southeast-asia', 'np': 'south-asia', 'bt': 'south-asia'
};

function extractValue(obj, path, defaultValue = null) {
  if (!obj || !path) return defaultValue;
  
  try {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    // Handle text property
    if (current && typeof current === 'object' && 'text' in current) {
      return current.text;
    }
    
    // Special handling for Area data - it might be structured as total/land/water
    if (path.includes('Area') && current && typeof current === 'object') {
      // Try different area properties
      const totalArea = current.total || current.land || current['total area'] || current.value;
      if (totalArea) {
        if (typeof totalArea === 'object' && totalArea.text) {
          return totalArea.text;
        }
        return totalArea;
      }
    }
    
    // Handle complex objects (like age structure) by converting to readable string
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      // Special handling for age structure data
      if (path.includes('Age structure')) {
        const ageGroups = [];
        Object.entries(current).forEach(([ageRange, data]) => {
          if (data && typeof data === 'object' && data.text) {
            ageGroups.push(`${ageRange}: ${data.text}`);
          } else if (typeof data === 'string') {
            ageGroups.push(`${ageRange}: ${data}`);
          }
        });
        return ageGroups.length > 0 ? ageGroups.join('; ') : defaultValue;
      }
      
      // For other objects, try to extract meaningful text
      const entries = Object.entries(current);
      if (entries.length > 0) {
        const textEntries = entries
          .map(([key, value]) => {
            if (value && typeof value === 'object' && value.text) {
              return `${key}: ${value.text}`;
            } else if (typeof value === 'string') {
              return `${key}: ${value}`;
            }
            return null;
          })
          .filter(Boolean);
        
        return textEntries.length > 0 ? textEntries.join('; ') : defaultValue;
      }
    }
    
    return current || defaultValue;
  } catch (error) {
    console.error('Error extracting value:', error);
    return defaultValue;
  }
}

function parseNumber(value) {
  if (!value) return null;
  
  // Convert to string and extract the first number
  const str = value.toString().toLowerCase();
  
  // Special handling for military expenditure percentage
  if (str.includes('% of gdp') || str.includes('percent of gdp') || str.includes('%')) {
    const percentMatch = str.match(/([0-9,\.]+)\s*%/);
    if (percentMatch) {
      const num = parseFloat(percentMatch[1].replace(/,/g, ''));
      return isNaN(num) ? null : num;
    }
  }
  
  // Handle special cases for large numbers
  if (str.includes('million')) {
    const match = str.match(/([0-9,\.]+)\s*million/);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      return isNaN(num) ? null : num * 1000000;
    }
  }
  
  if (str.includes('billion')) {
    const match = str.match(/([0-9,\.]+)\s*billion/);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      return isNaN(num) ? null : num * 1000000000;
    }
  }
  
  if (str.includes('trillion')) {
    const match = str.match(/([0-9,\.]+)\s*trillion/);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      return isNaN(num) ? null : num * 1000000000000;
    }
  }
  
  // Extract the first number from the string
  const match = str.match(/([0-9,]+\.?[0-9]*)/);
  if (match) {
    const cleaned = match[1].replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  
  return null;
}

function parsePopulationByGender(data) {
  if (!data || typeof data !== 'object') return { male: null, female: null };
  
  let male = null, female = null;
  
  // Try to get total population first
  const populationData = extractValue(data, 'People and Society.Population');
  
  let totalPopulation = null;
  if (populationData) {
    // Handle population data that might include text descriptions
    if (typeof populationData === 'string') {
      // Extract just the number, handling formats like "342,229,200 (2023 est.)"
      const match = populationData.match(/([0-9,]+)/);
      if (match) {
        totalPopulation = parseFloat(match[1].replace(/,/g, ''));
      }
    } else if (typeof populationData === 'number') {
      totalPopulation = populationData;
    }
  }
  
  if (totalPopulation && totalPopulation > 0) {
    // Use approximate gender ratio (typically around 50/50 with slight male majority at birth)
    // This is a rough approximation since exact gender breakdown isn't always available
    male = Math.round(totalPopulation * 0.51);
    female = Math.round(totalPopulation * 0.49);
  }
  
  // Try to find more specific data in demographic breakdown
  try {
    // Look for demographic breakdown with male/female percentages
    const ageStructure = data['People and Society'] && data['People and Society']['Age structure'];
    if (ageStructure && typeof ageStructure === 'object') {
      let totalMalePercentage = 0;
      let totalFemalePercentage = 0;
      let groupCount = 0;
      
      Object.values(ageStructure).forEach(ageGroup => {
        if (typeof ageGroup === 'object' && ageGroup.text) {
          const text = ageGroup.text;
          // Look for patterns like "male: 51.2%, female: 48.8%"
          const maleMatch = text.match(/male[:\s]*([0-9.]+)%/i);
          const femaleMatch = text.match(/female[:\s]*([0-9.]+)%/i);
          if (maleMatch && femaleMatch) {
            totalMalePercentage += parseFloat(maleMatch[1]);
            totalFemalePercentage += parseFloat(femaleMatch[1]);
            groupCount++;
          }
        }
      });
      
      if (groupCount > 0 && totalPopulation) {
        const avgMalePercentage = totalMalePercentage / groupCount;
        const avgFemalePercentage = totalFemalePercentage / groupCount;
        if (avgMalePercentage > 0 && avgFemalePercentage > 0) {
          male = Math.round(totalPopulation * (avgMalePercentage / 100));
          female = Math.round(totalPopulation * (avgFemalePercentage / 100));
        }
      }
    }
  } catch (error) {
    console.error('Error parsing gender breakdown:', error);
    // Fall back to estimated values if already calculated
  }
  
  return { male, female };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const isoCode = searchParams.get('country');
  
  if (!isoCode) {
    return NextResponse.json({ error: 'Country parameter is required' }, { status: 400 });
  }
  
  const gecCode = isoToGecMapping[isoCode];
  const region = regionMapping[gecCode];
  
  if (!gecCode || !region) {
    return NextResponse.json({ error: `Country ${isoCode} not supported in factbook` }, { status: 404 });
  }
  
  try {
    const factbookUrl = `https://github.com/factbook/factbook.json/raw/master/${region}/${gecCode}.json`;
    console.log(`Fetching factbook data from: ${factbookUrl}`);
    
    const response = await fetch(factbookUrl);
    
    if (!response.ok) {
      console.error(`Factbook API error: ${response.status}`);
      return NextResponse.json({ error: 'Failed to fetch factbook data' }, { status: response.status });
    }
    
    const data = await response.json();
    console.log(`Factbook data keys for ${isoCode}:`, Object.keys(data));
    
    // Extract population gender data
    const populationGender = parsePopulationByGender(data);
    
    // Debug: Log geography section to understand area structure
    if (data.Geography) {
      console.log(`Geography section for ${isoCode}:`, JSON.stringify(data.Geography, null, 2));
    }
    
    // Helper function to ensure string values
    const ensureString = (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'string') return value;
      if (typeof value === 'object') {
        console.warn('Object found where string expected:', value);
        return JSON.stringify(value);
      }
      return String(value);
    };

    // Parse and structure the comprehensive data
    const factbookData = {
      // Demographics
      malePopulation: populationGender.male,
      femalePopulation: populationGender.female,
      ethnicGroups: ensureString(extractValue(data, 'People and Society.Ethnic groups')),
      religions: ensureString(extractValue(data, 'People and Society.Religions')),
      ageStructure: ensureString(extractValue(data, 'People and Society.Age structure')),
      medianAge: ensureString(extractValue(data, 'People and Society.Median age')),
      birthRate: parseNumber(extractValue(data, 'People and Society.Birth rate')),
      deathRate: parseNumber(extractValue(data, 'People and Society.Death rate')),
      netMigrationRate: parseNumber(extractValue(data, 'People and Society.Net migration rate')),
      lifeExpectancy: parseNumber(extractValue(data, 'People and Society.Life expectancy at birth')),
      
      // Health & Social
      alcoholConsumption: ensureString(extractValue(data, 'People and Society.Alcohol consumption per capita')),
      tobaccoUse: ensureString(extractValue(data, 'People and Society.Tobacco use')),
      literacyRate: parseNumber(extractValue(data, 'People and Society.Literacy')),
      educationExpenditure: parseNumber(extractValue(data, 'People and Society.Education expenditures')),
      urbanization: ensureString(extractValue(data, 'People and Society.Urbanization')),
      
      // Government & Politics
      etymology: ensureString(extractValue(data, 'Government.Country name.etymology')),
      suffrage: ensureString(extractValue(data, 'Government.Suffrage')),
      
      // Economic Data
      creditRatings: ensureString(extractValue(data, 'Economy.Credit ratings')),
      agriculturalProducts: ensureString(extractValue(data, 'Economy.Agricultural products')),
      industries: ensureString(extractValue(data, 'Economy.Industries')),
      giniIndex: parseNumber(extractValue(data, 'Economy.Gini Index coefficient - distribution of family income')),
      averageHouseholdExpenditure: ensureString(extractValue(data, 'Economy.Household income or consumption by percentage share')),
      
      // Trade Data
      exports: parseNumber(extractValue(data, 'Economy.Exports')),
      exportPartners: ensureString(extractValue(data, 'Economy.Exports - partners')),
      exportCommodities: ensureString(extractValue(data, 'Economy.Exports - commodities')),
      imports: parseNumber(extractValue(data, 'Economy.Imports')),
      importCommodities: ensureString(extractValue(data, 'Economy.Imports - commodities')),
      exchangeRates: ensureString(extractValue(data, 'Economy.Exchange rates')),
      
      // Military & Security
      militaryExpenditure: parseNumber(extractValue(data, 'Military and Security.Military expenditures')),
      refugees: ensureString(extractValue(data, 'Transnational Issues.Refugees and internally displaced persons')),
      
      // Geography (additional data)
      location: ensureString(extractValue(data, 'Geography.Location')),
      area: (() => {
        // Try multiple area extraction paths
        const areaExtracted = extractValue(data, 'Geography.Area.total') || 
                              extractValue(data, 'Geography.Area') ||
                              extractValue(data, 'Geography.Area.land') ||
                              extractValue(data, 'Geography.total area');
        console.log(`Area extraction for ${isoCode}:`, areaExtracted);
        return parseNumber(areaExtracted);
      })(),
      climate: ensureString(extractValue(data, 'Geography.Climate')),
      naturalResources: ensureString(extractValue(data, 'Geography.Natural resources')),
      landUse: ensureString(extractValue(data, 'Geography.Land use')),
      
      // Raw data for debugging
      source: 'CIA World Factbook',
      year: '2024',
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`Processed factbook data for ${isoCode}:`, Object.keys(factbookData));
    return NextResponse.json(factbookData);
    
  } catch (error) {
    console.error('Factbook API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch or process factbook data',
      details: error.message 
    }, { status: 500 });
  }
} 