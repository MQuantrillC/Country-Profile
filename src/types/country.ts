// Shapes returned by the API routes and consumed by the comparison page.
//
// Extracted from page.tsx, which held every interface, every component and the
// whole data-loading effect in one 3,286-line client file.

export interface DataWithSource {
  value: number | null;
  year: string | null;
  source: string;
  sourceOrganization: string;
  /**
   * Whether the upstream request succeeded. Without this, "this country has no
   * observation" and "the request failed" both collapse into a bare N/A.
   */
  status?: 'ok' | 'no-data' | 'failed';
}

/** What a metric case may return; missing fields are filled in by getMetricValue. */
export interface PartialReading {
  value: number | null;
  source: string | null;
  sourceDetail: string | null;
  year?: string | null;
  status?: 'ok' | 'no-data' | 'failed';
}

/** One metric resolved for one country, ready to render. */
export interface MetricReading {
  value: number | null;
  source: string | null;
  sourceDetail: string | null;
  /** Observation year, so a figure from a decade ago is not read as current. */
  year: string | null;
  status: 'ok' | 'no-data' | 'failed';
}

export interface RestCountriesData {
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

export interface ClimateData {
  averageTemperature?: number;
  hotDays30?: number;
  hotDays35?: number;
  coldDays?: number;
  source: string;
  year: string;
}

export interface CrimeData {
  country: string;
  region: string;
  subregion: string;
  year: number;
  totalArrests?: number | null;
  arrestsByCitizenship?: {
    national?: number | null;
    foreign?: number | null;
  };
  arrestsBySex?: {
    male?: number | null;
    female?: number | null;
  };
  victimData?: {
    totalVictims?: number | null;
    maleVictims?: number | null;
    femaleVictims?: number | null;
    homicideRate?: number | null;
  };
  convictionData?: {
    totalConvictions?: number | null;
  };
  prisonDeaths?: number | null;
  source: string;
  unit: string;
}

// Interface for Human Development Index data
export interface HDIData {
  country: string;
  countryName?: string;
  hdi: number | null;
  source: string;
  year: string;
  sourceOrganization: string;
  description?: string;
  scale?: string;
  note?: string;
}

export interface OurWorldInDataMetric {
  value: number | null;
  year: string | null;
  source: string;
  sourceOrganization: string;
  unit: string;
  description: string;
}

export interface FactbookData {
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
  
  alcoholConsumption?: string | null;
  tobaccoUse?: string | null;
  literacyRate?: number | null;
  educationExpenditure?: number | null;
  urbanization?: string | null;
  
  etymology?: string | null;
  suffrage?: string | null;
  
  creditRatings?: string | null;
  agriculturalProducts?: string | null;
  industries?: string | null;
  publicDebt?: number | null;
  giniIndex?: number | null;
  averageHouseholdExpenditure?: string | null;
  
  exports?: number | null;
  exportPartners?: string | null;
  exportCommodities?: string | null;
  imports?: number | null;
  importPartners?: string | null;
  importCommodities?: string | null;
  exchangeRates?: string | null;
  
  // Communications & Technology
  internetUsers?: number | null;
  internetCountryCode?: string | null;
  
  // Transportation & Infrastructure
  airports?: number | null;
  railways?: number | null;
  ports?: number | null;
  
  militaryExpenditure?: number | null;
  refugees?: string | null;
  
  location?: string | null;
  area?: number | null;
  climate?: string | null;
  naturalResources?: string | null;
  landUse?: string | null;
  
  source: string;
  year: string;
}

export interface ComtradeData {
  country: string;
  year: string;
  source: string;
  note: string;
  
  // Core trade metrics
  totalExports: {
    value: number;
    formatted: string;
  };
  totalImports: {
    value: number;
    formatted: string;
  };
  tradeBalance: {
    value: number;
    formatted: string;
    status: 'surplus' | 'deficit';
  };
  
  // Trading partners
  topExportPartners: Array<{
    country: string;
    percentage: number | null;
    formatted: string;
  }>;
  topImportPartners: Array<{
    country: string;
    percentage: number | null;
    formatted: string;
  }>;
  
  // Trade commodities
  topExportCommodities: Array<{
    commodity: string;
    description: string;
  }>;
  topImportCommodities: Array<{
    commodity: string;
    description: string;
  }>;
  
  // Raw data for reference
  rawData: {
    exportPartnersText: string;
    exportCommoditiesText: string;
    importCommoditiesText: string;
  };
}

export interface EnhancedCountryInfo {
  restCountriesData?: RestCountriesData;
  climateData?: ClimateData;
  factbookData?: FactbookData;
  comtradeData?: ComtradeData;
  crimeData?: CrimeData;
  hdiData?: HDIData;
  touristsData?: OurWorldInDataMetric;
  schoolingYearsData?: OurWorldInDataMetric;
  taxRevenueData?: OurWorldInDataMetric;
  extremePovertyData?: OurWorldInDataMetric;
  migrantsData?: OurWorldInDataMetric;
  caloricSupplyData?: OurWorldInDataMetric;
  incomeGroupData?: OurWorldInDataMetric;
  incomeShareRichest1Data?: OurWorldInDataMetric;
  incomeSharePoorest50Data?: OurWorldInDataMetric;
  armedForcesPersonnelData?: OurWorldInDataMetric;
  terrorismDeathsData?: OurWorldInDataMetric;
  politicalRegimeData?: OurWorldInDataMetric;
}

export interface CountryStats {
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
  gniPerCapita: DataWithSource;
  tradeGDP: DataWithSource;
  fdiNetInflows: DataWithSource;
  internetUsers: DataWithSource;
  electricityAccess: DataWithSource;
  unemploymentRate: DataWithSource;
  mobileSubscriptions: DataWithSource;
  improvedWaterAccess: DataWithSource;
  improvedSanitationAccess: DataWithSource;
  energyUsePerCapita: DataWithSource;
  researchDevelopmentGDP: DataWithSource;
  publicDebtGDP: DataWithSource;
  populationDensity?: DataWithSource;
  enhancedInfo?: EnhancedCountryInfo;
}



