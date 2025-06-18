// src/utils/worldBank.ts
// Map 2-letter ISO codes to 3-letter codes for World Bank API
const countryCodeMap: Record<string, string> = {
    US: 'USA',
    PE: 'PER',
    GB: 'GBR',
    JP: 'JPN'
  };
  
  const indicators = {
    gdp: "NY.GDP.MKTP.CD",
    gdpPerCapita: "NY.GDP.PCAP.CD",
    population: "SP.POP.TOTL",
    area: "AG.SRF.TOTL.K2"
  };
  
  export async function fetchCountryStats(code: string) {
    // Convert 2-letter code to 3-letter code for World Bank API
    const wbCode = countryCodeMap[code] || code;
    
    const fetchIndicator = async (indicator: string) => {
      try {
        // Use your Vercel serverless function
        const url = `/api/worldbank?country=${wbCode}&indicator=${indicator}`;
        
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log(`Data for ${indicator}:`, data); // Debug log
        
        // The API returns [metadata, data_array]
        // We want the most recent year's data with a non-null value
        if (data && Array.isArray(data) && data.length > 1 && Array.isArray(data[1]) && data[1].length > 0) {
          // Find the first entry with a non-null value (most recent year with data)
          const dataWithValue = data[1].find(entry => entry.value !== null);
          return dataWithValue ? dataWithValue.value : null;
        }
        
        return null;
      } catch (error) {
        console.error(`Failed to fetch ${indicator} for ${wbCode}`, error);
        return null;
      }
    };
  
    const [gdp, gdpPerCapita, population, area] = await Promise.all([
      fetchIndicator(indicators.gdp),
      fetchIndicator(indicators.gdpPerCapita),
      fetchIndicator(indicators.population),
      fetchIndicator(indicators.area)
    ]);
  
    return {
      gdp,
      gdpPerCapita,
      population,
      area
    };
  }