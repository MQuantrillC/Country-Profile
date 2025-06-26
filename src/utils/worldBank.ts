// src/utils/worldBank.ts
import axios from "axios";

// Map 2-letter ISO codes to 3-letter codes for World Bank API
const countryCodeMap: Record<string, string> = {
  US: 'USA', CN: 'CHN', JP: 'JPN', DE: 'DEU', IN: 'IND', 
  GB: 'GBR', FR: 'FRA', IT: 'ITA', BR: 'BRA', CA: 'CAN',
  RU: 'RUS', KR: 'KOR', AU: 'AUS', ES: 'ESP', MX: 'MEX',
  ID: 'IDN', NL: 'NLD', SA: 'SAU', CH: 'CHE', TR: 'TUR',
  DK: 'DNK', FI: 'FIN', BE: 'BEL', AT: 'AUT', IE: 'IRL',
  PT: 'PRT', GR: 'GRC', PL: 'POL', CZ: 'CZE', HU: 'HUN',
  SK: 'SVK', SI: 'SVN', HR: 'HRV', BG: 'BGR', RO: 'ROU',
  LT: 'LTU', LV: 'LVA', EE: 'EST', LU: 'LUX', MT: 'MLT',
  CY: 'CYP', IS: 'ISL', SE: 'SWE', NO: 'NOR', UA: 'UKR',
  BY: 'BLR', RS: 'SRB', BA: 'BIH', ME: 'MNE', MK: 'MKD',
  AL: 'ALB', MD: 'MDA', GE: 'GEO', AM: 'ARM', AZ: 'AZE',
  SG: 'SGP', TH: 'THA', MY: 'MYS', VN: 'VNM', PH: 'PHL',
  AE: 'ARE', QA: 'QAT', KW: 'KWT', OM: 'OMN', BH: 'BHR',
  JO: 'JOR', LB: 'LBN', IL: 'ISR', EG: 'EGY', MA: 'MAR',
  TN: 'TUN', DZ: 'DZA', NG: 'NGA', KE: 'KEN', GH: 'GHA',
  ET: 'ETH', TZ: 'TZA', UG: 'UGA', RW: 'RWA', SN: 'SEN',
  CI: 'CIV', CM: 'CMR', MG: 'MDG', MZ: 'MOZ', ZM: 'ZMB',
  ZW: 'ZWE', BW: 'BWA', NA: 'NAM', ZA: 'ZAF', PK: 'PAK',
  BD: 'BGD', LK: 'LKA', NP: 'NPL', AF: 'AFG', IR: 'IRN',
  IQ: 'IRQ', CL: 'CHL', PE: 'PER', AR: 'ARG', CO: 'COL',
  VE: 'VEN', EC: 'ECU', UY: 'URY', PY: 'PRY', BO: 'BOL'
};
  
  const indicators = {
    gdp: "NY.GDP.MKTP.CD",
    gdpPerCapita: "NY.GDP.PCAP.CD",
    gniPerCapita: "NY.GNP.PCAP.CD",
    tradeGDP: "NE.TRD.GNFS.ZS",
    unemploymentRate: "SL.UEM.TOTL.ZS",
    publicDebtGDP: "GC.DOD.TOTL.GD.ZS",
    inflation: "FP.CPI.TOTL.ZG",
    fdiNetInflows: "BX.KLT.DINV.WD.GD.ZS",
    population: "SP.POP.TOTL",
    lifeExpectancy: "SP.DYN.LE00.IN",
    fertilityRate: "SP.DYN.TFRT.IN",
    urbanPopPct: "SP.URB.TOTL.IN.ZS",
    ruralPopPct: "SP.RUR.TOTL.ZS",
    populationGrowth: "SP.POP.GROW",
    literacyRate: "SE.ADT.LITR.ZS",
    educationSpendPctGDP: "SE.XPD.TOTL.GD.ZS",
    schoolEnrollment: "SE.SEC.NENR",
    healthSpendPerCapita: "SH.XPD.CHEX.PC.CD",
    internetUsers: "IT.NET.USER.ZS",
    electricityAccess: "EG.ELC.ACCS.ZS",
    mobileSubscriptions: "IT.CEL.SETS.P2",
    improvedWaterAccess: "SH.H2O.BASW.ZS",
    improvedSanitationAccess: "SH.STA.BASS.ZS",
    researchDevelopmentGDP: "GB.XPD.RSDV.GD.ZS",
    forestPct: "AG.LND.FRST.ZS",
    agriculturalLandPct: "AG.LND.AGRI.ZS",
    co2PerCapita: "EN.ATM.CO2E.PC",
    energyUsePerCapita: "EG.USE.PCAP.KG.OE",
    homicideRate: "VC.IHR.PSRC.P5",
    area: "AG.SRF.TOTL.K2",
    populationDensity: "EN.POP.DNST"
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
      const response = await axios.get(`https://api.worldbank.org/v2/indicator/${indicator}?format=json`, {
        timeout: 5000, // 5 second timeout for metadata
        headers: {
          'User-Agent': 'Country-Profile-App/1.0'
        }
      });
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
      const response = await axios.get(worldBankUrl, {
        timeout: 8000, // 8 second timeout
        headers: {
          'User-Agent': 'Country-Profile-App/1.0'
        }
      });
      
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
      
      const stats: Record<string, DataWithSource> = {};
      worldBankResults.forEach(({ key, data }) => {
        stats[key] = data;
      });

      console.log('Fetched stats:', stats);
      
      // Population density is now directly fetched from World Bank API

      // Add enhanced country information
      const enhancedInfo: EnhancedCountryInfo = {
        restCountriesData: restCountriesData || undefined,
        climateData: climateData || undefined,
        factbookData: factbookData || undefined
      };

      return {
        ...stats,
        enhancedInfo
      } as CountryStats;
    } catch (error) {
      console.error(`Error fetching stats for ${countryCode}:`, error);
      return null;
    }
  }