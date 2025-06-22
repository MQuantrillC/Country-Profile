// Script to fetch all countries from World Bank API
import https from 'https';

function fetchCountries() {
  const url = 'https://api.worldbank.org/v2/country?format=json&per_page=300';
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const countries = parsed[1]; // Second element contains the countries array
        
        // Filter out aggregates and regions, keep only actual countries
        const actualCountries = countries.filter(country => {
          // Skip aggregates and regions - they usually have specific patterns
          const skipPatterns = [
            'World', 'income', 'Income', 'OECD', 'Euro', 'European Union', 
            'Arab World', 'Caribbean', 'Pacific', 'Sub-Saharan', 'Middle East',
            'Latin America', 'East Asia', 'South Asia', 'Central Europe',
            'Fragile', 'Least developed', 'Small states', 'Heavily indebted'
          ];
          
          return !skipPatterns.some(pattern => country.name.includes(pattern)) &&
                 country.capitalCity && // Has a capital city (good indicator of actual country)
                 country.region.value !== 'Aggregates'; // Not an aggregate
        });
        
        console.log(`Found ${actualCountries.length} countries:`);
        console.log('\nCountries array for the application:');
        console.log('const countries = [');
        
        actualCountries.forEach((country, index) => {
          // Generate flag emoji (simplified - would need proper mapping)
          const flag = getFlagEmoji(country.iso2Code);
          
          console.log(`  { 
    name: "${country.name}", 
    code: "${country.iso2Code}",
    flag: "${flag}",
    data: {
      gdp: 0,
      gdpPerCapita: 0,
      population: 0,
      area: 0,
      avgTemp: "N/A",
      topExports: [],
      topImports: [],
      tradingPartners: [],
      homicideRate: 0,
      crimeIndex: 0,
      currency: "N/A",
      continent: "${getContinent(country.region.value)}"
    }
  }${index < actualCountries.length - 1 ? ',' : ''}`);
        });
        
        console.log('];');
        
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    });
  }).on('error', (error) => {
    console.error('Error fetching data:', error);
  });
}

function getFlagEmoji(iso2Code) {
  // Simple mapping for common countries - in a real app you'd have a complete mapping
  const flagMap = {
    'US': '🇺🇸', 'CN': '🇨🇳', 'DE': '🇩🇪', 'JP': '🇯🇵', 'GB': '🇬🇧', 'IN': '🇮🇳',
    'FR': '🇫🇷', 'IT': '🇮🇹', 'BR': '🇧🇷', 'CA': '🇨🇦', 'RU': '🇷🇺', 'KR': '🇰🇷',
    'AU': '🇦🇺', 'ES': '🇪🇸', 'MX': '🇲🇽', 'PE': '🇵🇪', 'AR': '🇦🇷', 'CL': '🇨🇱',
    'CO': '🇨🇴', 'VE': '🇻🇪', 'EC': '🇪🇨', 'BO': '🇧🇴', 'PY': '🇵🇾', 'UY': '🇺🇾',
    'GY': '🇬🇾', 'SR': '🇸🇷', 'FK': '🇫🇰', 'GF': '🇬🇫', 'TH': '🇹🇭', 'VN': '🇻🇳',
    'PH': '🇵🇭', 'MY': '🇲🇾', 'SG': '🇸🇬', 'ID': '🇮🇩', 'BD': '🇧🇩', 'PK': '🇵🇰',
    'LK': '🇱🇰', 'MM': '🇲🇲', 'KH': '🇰🇭', 'LA': '🇱🇦', 'NP': '🇳🇵', 'BT': '🇧🇹',
    'AF': '🇦🇫', 'IR': '🇮🇷', 'IQ': '🇮🇶', 'SA': '🇸🇦', 'AE': '🇦🇪', 'TR': '🇹🇷',
    'EG': '🇪🇬', 'ZA': '🇿🇦', 'NG': '🇳🇬', 'KE': '🇰🇪', 'ET': '🇪🇹', 'GH': '🇬🇭',
    'MA': '🇲🇦', 'DZ': '🇩🇿', 'TN': '🇹🇳', 'LY': '🇱🇾', 'SD': '🇸🇩', 'SS': '🇸🇸'
  };
  
  return flagMap[iso2Code] || '🏳️';
}

function getContinent(regionValue) {
  if (regionValue.includes('Europe')) return 'Europe';
  if (regionValue.includes('Asia') || regionValue.includes('Pacific')) return 'Asia';
  if (regionValue.includes('Africa')) return 'Africa';
  if (regionValue.includes('America')) return regionValue.includes('North') ? 'North America' : 'South America';
  if (regionValue.includes('Middle East')) return 'Middle East';
  return 'Other';
}

fetchCountries(); 