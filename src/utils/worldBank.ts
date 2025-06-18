// src/utils/worldBank.ts
import axios from "axios";

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
      
      const res = await axios.get(url);
      return res.data[1]?.[0]?.value ?? null;
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