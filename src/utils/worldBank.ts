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
    literacyRate: "SE.ADT.LITR.ZS",
    schoolEnrollment: "SE.SEC.NENR",
    educationSpendPctGDP: "SE.XPD.TOTL.GD.ZS",
    healthSpendPerCapita: "SH.XPD.CHEX.PC.CD",
    homicideRate: "VC.IHR.PSRC.P5"
  };
  
  interface CountryStats {
    gdp: number | null;
    gdpPerCapita: number | null;
    population: number | null;
    area: number | null;
    inflation: number | null;
    populationGrowth: number | null;
    urbanPopPct: number | null;
    ruralPopPct: number | null;
    fertilityRate: number | null;
    lifeExpectancy: number | null;
    co2PerCapita: number | null;
    forestPct: number | null;
    literacyRate: number | null;
    schoolEnrollment: number | null;
    educationSpendPctGDP: number | null;
    healthSpendPerCapita: number | null;
    homicideRate: number | null;
  }

  interface WorldBankDataEntry {
    value: number | null;
    date: string;
    [key: string]: unknown;
  }
  
  async function fetchIndicator(code: string, indicator: string) {
    const url = `https://api.worldbank.org/v2/country/${code}/indicator/${indicator}?format=json&per_page=1`;
    try {
      const res = await axios.get(url);
      if (!res.data[1]) {
        console.warn(`⚠️ No data for ${code} → ${indicator}`);
        return null;
      }
      return res.data[1][0].value ?? null;
    } catch (error) {
      console.error(`❌ Failed to fetch ${indicator} for ${code}`, error);
      return null;
    }
  }
  
  export async function fetchCountryStats(code: string): Promise<CountryStats> {
    // Convert 2-letter code to 3-letter code for World Bank API
    const wbCode = countryCodeMap[code] || code;
    
    const [
      gdp,
      gdpPerCapita,
      population,
      area,
      inflation,
      populationGrowth,
      urbanPopPct,
      ruralPopPct,
      fertilityRate,
      lifeExpectancy,
      co2PerCapita,
      forestPct,
      literacyRate,
      schoolEnrollment,
      educationSpendPctGDP,
      healthSpendPerCapita,
      homicideRate
    ] = await Promise.all(
      Object.values(indicators).map(indicator =>
        fetchIndicator(wbCode, indicator)
      )
    );
  
    console.log(`✅ Data fetched for ${wbCode}:`, {
      gdp,
      gdpPerCapita,
      population,
      area,
      inflation,
      populationGrowth,
      urbanPopPct,
      ruralPopPct,
      fertilityRate,
      lifeExpectancy,
      co2PerCapita,
      forestPct,
      literacyRate,
      schoolEnrollment,
      educationSpendPctGDP,
      healthSpendPerCapita,
      homicideRate
    });
  
    return {
      gdp,
      gdpPerCapita,
      population,
      area,
      inflation,
      populationGrowth,
      urbanPopPct,
      ruralPopPct,
      fertilityRate,
      lifeExpectancy,
      co2PerCapita,
      forestPct,
      literacyRate,
      schoolEnrollment,
      educationSpendPctGDP,
      healthSpendPerCapita,
      homicideRate
    };
  }