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
    area: "AG.SRF.TOTL.K2",
    inflation: "FP.CPI.TOTL.ZG",
    populationGrowth: "SP.POP.GROW",
    urbanPopPct: "SP.URB.TOTL.IN.ZS",
    ruralPopPct: "SP.RUR.TOTL.ZS",
    fertilityRate: "SP.DYN.TFRT.IN",
    lifeExpectancy: "SP.DYN.LE00.IN",
    co2PerCapita: "EN.ATM.CO2E.PC",
    forestPct: "AG.LND.FRST.ZS",
    agriculturalLandPct: "AG.LND.AGRI.ZS",
    literacyRate: "SE.ADT.LITR.ZS",
    schoolEnrollment: "SE.SEC.NENR",
    educationSpendPctGDP: "SE.XPD.TOTL.GD.ZS",
    healthSpendPerCapita: "SH.XPD.CHEX.PC.CD",
    homicideRate: "VC.IHR.PSRC.P5",
    // Additional economic and development indicators available in WDI
    gniPerCapita: "NY.GNP.PCAP.CD",
    tradeGDP: "NE.TRD.GNFS.ZS",
    fdiNetInflows: "BX.KLT.DINV.WD.GD.ZS",
    internetUsers: "IT.NET.USER.ZS",
    electricityAccess: "EG.ELC.ACCS.ZS",
    unemploymentRate: "SL.UEM.TOTL.ZS",
    // Infrastructure and development indicators
    mobileSubscriptions: "IT.CEL.SETS.P2",
    improvedWaterAccess: "SH.H2O.BASW.ZS",
    improvedSanitationAccess: "SH.STA.BASS.ZS",
    energyUsePerCapita: "EG.USE.PCAP.KG.OE",
    researchDevelopmentGDP: "GB.XPD.RSDV.GD.ZS",
    publicDebtGDP: "GC.DOD.TOTL.GD.ZS"
  };

  // Store indicator metadata
  const indicatorMetadata: Record<string, { name: string; source: string; sourceOrganization: string }> = {};

  interface DataWithSource {
    value: number | null;
    year: string | null;
    source: string;
    sourceOrganization: string;
  }

  // Interface for REST Countries API data
interface RestCountriesData {
  capital?: string[];
  currencies?: Record<string, { name: string; symbol: string }>;
  languages?: Record<string, string>;
  continents?: string[];
  googleMaps?: string;
  region?: string;
  subregion?: string;
  timezones?: string[];
  flag?: string;
  coatOfArms?: {
    png?: string;
    svg?: string;
  };
}

// Interface for Climate API data
interface ClimateData {
  averageTemperature?: number;
  hotDays30?: number; // Days above 30°C
  hotDays35?: number; // Days above 35°C
  coldDays?: number;  // Days below 0°C (frost days)
  source: string;
  year: string;
}

// Interface for CIA World Factbook data
interface FactbookData {
  // Demographics
  malePopulation?: number | null;
  femalePopulation?: number | null;
  ethnicGroups?: string | null;
  religions?: string | null;
  ageStructure?: string | null;
  medianAge?: string | null;
  birthRate?: number | null;
  deathRate?: number | null;
  netMigrationRate?: number | null;
  lifeExpectancy?: number | null;
  
  // Health & Social
  alcoholConsumption?: string | null;
  tobaccoUse?: string | null;
  literacyRate?: number | null;
  educationExpenditure?: number | null;
  urbanization?: string | null;
  
  // Government & Politics
  etymology?: string | null;
  suffrage?: string | null;
  
  // Economic Data
  creditRatings?: string | null;
  agriculturalProducts?: string | null;
  industries?: string | null;
  giniIndex?: number | null;
  averageHouseholdExpenditure?: string | null;
  
  // Trade Data
  exports?: number | null;
  exportPartners?: string | null;
  exportCommodities?: string | null;
  imports?: number | null;
  importCommodities?: string | null;
  exchangeRates?: string | null;
  
  // Military & Security
  militaryExpenditure?: number | null;
  refugees?: string | null;
  
  // Geography
  location?: string | null;
  area?: number | null;
  climate?: string | null;
  naturalResources?: string | null;
  landUse?: string | null;
  
  source: string;
  year: string;
}

// Enhanced country info combining World Bank, REST Countries, Climate, and Factbook data
interface EnhancedCountryInfo {
  restCountriesData?: RestCountriesData;
  climateData?: ClimateData;
  factbookData?: FactbookData;
}
  
  interface CountryStats {
  gdp: DataWithSource;
  gdpPerCapita: DataWithSource;
  population: DataWithSource;
  area: DataWithSource;
  inflation: DataWithSource;
  populationGrowth: DataWithSource;
  urbanPopPct: DataWithSource;
  ruralPopPct: DataWithSource;
  fertilityRate: DataWithSource;
  lifeExpectancy: DataWithSource;
  co2PerCapita: DataWithSource;
  forestPct: DataWithSource;
  agriculturalLandPct: DataWithSource;
  literacyRate: DataWithSource;
  schoolEnrollment: DataWithSource;
  educationSpendPctGDP: DataWithSource;
  healthSpendPerCapita: DataWithSource;
  homicideRate: DataWithSource;
  // Additional economic and development indicators available in WDI
  gniPerCapita: DataWithSource;
  tradeGDP: DataWithSource;
  fdiNetInflows: DataWithSource;
  internetUsers: DataWithSource;
  electricityAccess: DataWithSource;
  unemploymentRate: DataWithSource;
  // Infrastructure and development indicators
  mobileSubscriptions: DataWithSource;
  improvedWaterAccess: DataWithSource;
  improvedSanitationAccess: DataWithSource;
  energyUsePerCapita: DataWithSource;
  researchDevelopmentGDP: DataWithSource;
  publicDebtGDP: DataWithSource;
  populationDensity?: DataWithSource;
  // Enhanced country information
  enhancedInfo?: EnhancedCountryInfo;
}

  interface WorldBankDataEntry {
    value: number | null;
    date: string;
    [key: string]: unknown;
  }

  // Fetch REST Countries data
  async function fetchRestCountriesData(countryCode: string): Promise<RestCountriesData | null> {
    try {
      console.log(`Fetching REST Countries data for ${countryCode}`);
      const response = await axios.get(`https://restcountries.com/v3.1/alpha/${countryCode}`);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const countryData = response.data[0];
        console.log(`✅ REST Countries data for ${countryCode}:`, countryData);
        
        return {
          capital: countryData.capital,
          currencies: countryData.currencies,
          languages: countryData.languages,
          continents: countryData.continents,
          googleMaps: countryData.maps?.googleMaps,
          region: countryData.region,
          subregion: countryData.subregion,
          timezones: countryData.timezones,
          flag: countryData.flag,
          coatOfArms: countryData.coatOfArms
        };
      }
      
      console.warn(`⚠️ No REST Countries data found for ${countryCode}`);
      return null;
    } catch (error) {
      console.error(`❌ Failed to fetch REST Countries data for ${countryCode}:`, error);
      return null;
    }
  }

  // Fetch Factbook data - disabled for server-side context
  async function fetchFactbookData(countryCode: string): Promise<FactbookData | null> {
    // Return null since we're fetching this client-side to avoid server-side API call issues
    console.log(`Skipping factbook data fetch for ${countryCode} - handled client-side`);
    return null;
  }

  // Fetch Climate data - disabled for server-side context
  async function fetchClimateData(countryCode: string): Promise<ClimateData | null> {
    // Return null since we're fetching this client-side to avoid server-side API call issues
    console.log(`Skipping climate data fetch for ${countryCode} - handled client-side`);
    return null;
  }

  // Fetch indicator metadata
  async function fetchIndicatorMetadata(indicator: string) {
    if (indicatorMetadata[indicator]) {
      return indicatorMetadata[indicator];
    }

    try {
      const response = await axios.get(`https://api.worldbank.org/v2/indicator/${indicator}?format=json`);
      if (response.data && response.data[1] && response.data[1][0]) {
        const metadata = response.data[1][0];
        indicatorMetadata[indicator] = {
          name: metadata.name || 'Unknown',
          source: metadata.source?.value || 'World Bank',
          sourceOrganization: metadata.sourceOrganization || 'World Bank'
        };
        return indicatorMetadata[indicator];
      }
    } catch (error) {
      console.warn(`Failed to fetch metadata for ${indicator}:`, error);
    }

    // Fallback
    return {
      name: 'Unknown',
      source: 'World Bank',
      sourceOrganization: 'World Bank'
    };
  }
  
  async function fetchIndicator(code: string, indicator: string): Promise<DataWithSource> {
    // Get metadata for this indicator
    const metadata = await fetchIndicatorMetadata(indicator);
    
    // Convert 2-letter country code to 3-letter for World Bank API
    const worldBankCode = countryCodeMap[code] || code;
    
    // Call World Bank API directly
    const worldBankUrl = `https://api.worldbank.org/v2/country/${worldBankCode}/indicator/${indicator}?format=json&per_page=5&date=2020:2024`;
    
    try {
      const response = await axios.get(worldBankUrl);
      
      if (!response.data || !Array.isArray(response.data) || response.data.length < 2) {
        console.warn(`⚠️ No data structure for ${code} → ${indicator}`);
        return {
          value: null,
          year: null,
          source: metadata.source,
          sourceOrganization: metadata.sourceOrganization
        };
      }
      
      const dataArray = response.data[1];
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        console.warn(`⚠️ No data for ${code} → ${indicator}`);
        return {
          value: null,
          year: null,
          source: metadata.source,
          sourceOrganization: metadata.sourceOrganization
        };
      }
      
      // Find the most recent non-null value
      for (const entry of dataArray) {
        if (entry.value !== null && entry.value !== undefined) {
          console.log(`✅ ${code} ${indicator}: ${entry.value} (${entry.date})`);
          return {
            value: entry.value,
            year: entry.date,
            source: metadata.source,
            sourceOrganization: metadata.sourceOrganization
          };
        }
      }
      
      console.warn(`⚠️ No valid data found for ${code} → ${indicator}`);
      return {
        value: null,
        year: null,
        source: metadata.source,
        sourceOrganization: metadata.sourceOrganization
      };
    } catch (error) {
      console.error(`❌ Failed to fetch ${indicator} for ${code}`, error);
      return {
        value: null,
        year: null,
        source: metadata.source,
        sourceOrganization: metadata.sourceOrganization
      };
    }
  }
  
  export async function fetchCountryStats(countryCode: string): Promise<CountryStats | null> {
    try {
      console.log(`Fetching stats for ${countryCode}`);
      
      // Fetch World Bank data, REST Countries data, Climate data, and Factbook data in parallel
      const [worldBankResults, restCountriesData, climateData, factbookData] = await Promise.all([
        Promise.all(
          Object.entries(indicators).map(([key, indicatorCode]) =>
            fetchIndicator(countryCode, indicatorCode).then(data => ({ key, data }))
          )
        ),
        fetchRestCountriesData(countryCode),
        fetchClimateData(countryCode),
        fetchFactbookData(countryCode)
      ]);
      
      const stats: any = {};
      worldBankResults.forEach(({ key, data }) => {
        stats[key] = data;
      });

      console.log('Fetched stats:', stats);
      
      // Calculate population density if we have both population and area
      let populationDensity: DataWithSource | null = null;
      if (stats.population?.value && stats.area?.value) {
        populationDensity = {
          value: stats.population.value / stats.area.value, // people per km²
          year: stats.population.year || stats.area.year,
          source: 'World Bank (Calculated)',
          sourceOrganization: 'World Bank Group'
        };
      }

      // Add enhanced country information
      const enhancedInfo: EnhancedCountryInfo = {
        restCountriesData: restCountriesData || undefined,
        climateData: climateData || undefined,
        factbookData: factbookData || undefined
      };

      return {
        ...stats,
        populationDensity,
        enhancedInfo
      } as CountryStats;
    } catch (error) {
      console.error(`Error fetching stats for ${countryCode}:`, error);
      return null;
    }
  }