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
  
  interface CountryStats {
    gdp: number | null;
    gdpPerCapita: number | null;
    population: number | null;
    area: number | null;
  }

  interface WorldBankDataEntry {
    value: number | null;
    date: string;
    [key: string]: unknown;
  }
  
  export async function fetchCountryStats(code: string): Promise<CountryStats> {
    // Convert 2-letter code to 3-letter code for World Bank API
    const wbCode = countryCodeMap[code] || code;
    
    const fetchIndicator = async (indicator: string): Promise<number | null> => {
      try {
        // Correct API path for Next.js App Router
        const url = `/api/worldbank?country=${wbCode}&indicator=${indicator}`;
        
        console.log(`Fetching indicator ${indicator} for ${wbCode}`);
        
        const res = await fetch(url);
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`HTTP error! status: ${res.status}, response: ${errorText}`);
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log(`Data for ${indicator}:`, data);
        
        // Handle World Bank API response format
        // The API returns [metadata, data_array]
        if (data && Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
          // Find the first entry with a non-null value (most recent year with data)
          const dataWithValue = (data[1] as WorldBankDataEntry[]).find((entry) => entry.value !== null && entry.value !== undefined);
          if (dataWithValue) {
            console.log(`Found value for ${indicator}: ${dataWithValue.value} (year: ${dataWithValue.date})`);
            return dataWithValue.value;
          }
        }
        
        console.warn(`No valid data found for ${indicator}`);
        return null;
      } catch (error) {
        console.error(`Failed to fetch ${indicator} for ${wbCode}:`, error);
        return null;
      }
    };
  
    console.log(`Fetching stats for country: ${code} (World Bank code: ${wbCode})`);
  
    const [gdp, gdpPerCapita, population, area] = await Promise.all([
      fetchIndicator(indicators.gdp),
      fetchIndicator(indicators.gdpPerCapita),
      fetchIndicator(indicators.population),
      fetchIndicator(indicators.area)
    ]);
  
    const result = {
      gdp,
      gdpPerCapita,
      population,
      area
    };
  
    console.log(`Final stats for ${code}:`, result);
    return result;
  }