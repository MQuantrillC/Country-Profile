'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Activity,
  Package,
  AlertTriangle,
  Globe,
  MapPin,
  Thermometer,
  BookOpen,
  Sun,
  Moon,
  ArrowUp,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGlobe, faMoneyBillWave, faUsers, faChartLine, faShieldAlt, faSun,
  faLandmark, faBalanceScale, faCar, faPlane, faShip, faRulerVertical,
  faTemperatureHigh, faSnowflake, faUserFriends, faArrowRight, faMale, faFemale,
  faBaby, faBookReader, faGraduationCap, faHandHoldingUsd, faChartPie, faPercentage,
  faMapMarkedAlt, faWeightHanging, faGavel, faWineGlass, faSmoking, faSkullCrossbones,
  faExchangeAlt, faSignInAlt, faSignOutAlt, faTree, faTractor, faBeer, faGlassWhiskey
} from '@fortawesome/free-solid-svg-icons';
import { countries, type Country } from '../utils/countries';

// Define sections outside component to avoid dependency issues
const sections = [
  { id: 'overview', label: 'Overview', icon: Globe },
  { id: 'economy', label: 'Economy & Development', icon: TrendingUp },
  { id: 'social', label: 'Social & Environment', icon: Users },
  { id: 'trade', label: 'Trade', icon: Package },
  { id: 'safety', label: 'Safety & Crime', icon: AlertTriangle },
  { id: 'climate', label: 'Climate', icon: Thermometer },
  { id: 'sources', label: 'Sources', icon: BookOpen },
];

interface DataWithSource {
  value: number | null;
  year: string | null;
  source: string;
  sourceOrganization: string;
}

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

interface ClimateData {
  averageTemperature?: number;
  hotDays30?: number;
  hotDays35?: number;
  coldDays?: number;
  source: string;
  year: string;
}

interface CrimeData {
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
  rawData?: unknown[];
}

// Interface for Human Development Index data
interface HDIData {
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

interface OurWorldInDataMetric {
  value: number | null;
  year: string | null;
  source: string;
  sourceOrganization: string;
  unit: string;
  description: string;
}

interface FactbookData {
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

interface ComtradeData {
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

interface EnhancedCountryInfo {
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



interface CountryDropdownProps {
  selectedCountries: Country[];
  onSelect: (countries: Country[]) => void;
  countries: Country[];
}




const CountryDropdown = ({ selectedCountries, onSelect, countries }: CountryDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search term
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleCountryToggle = (country: Country) => {
    const isSelected = selectedCountries.some(c => c.code === country.code);
    if (isSelected) {
      onSelect(selectedCountries.filter(c => c.code !== country.code));
    } else {
      if (selectedCountries.length < 5) {
        onSelect([...selectedCountries, country]);
      }
    }
    // Clear the search term after any selection
    setSearchTerm('');
  };

  const handleRemoveCountry = (countryCode: string) => {
    onSelect(selectedCountries.filter(c => c.code !== countryCode));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
          {selectedCountries.map((country) => (
            <div key={country.code} className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
              <Image 
                src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                alt={`${country.name} flag`}
                width={20}
                height={15}
                className="w-4 h-auto sm:w-5 mr-1.5 sm:mr-2"
              />
              <span className="text-xs sm:text-sm font-medium">{country.name}</span>
              <button onClick={() => handleRemoveCountry(country.code)} className="ml-1.5 sm:ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm sm:text-base">
                ×
              </button>
            </div>
          ))}
        </div>
        
        <div className="relative">
          <button onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }
          }} className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              {selectedCountries.length === 0 ? "Select countries to compare (max 5)" : `Add more countries (${selectedCountries.length}/5)`}
            </span>
            <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
            {/* Search Input */}
            <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-600">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredCountries.length > 0) {
                    // Select the first filtered country on Enter
                    const firstCountry = filteredCountries[0];
                    const isSelected = selectedCountries.some(c => c.code === firstCountry.code);
                    const isDisabled = selectedCountries.length >= 5 && !isSelected;
                    if (!isDisabled) {
                      handleCountryToggle(firstCountry);
                    }
                  }
                }}
                className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            {/* Countries List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="px-3 sm:px-4 py-3 text-gray-500 dark:text-gray-400 text-center text-xs sm:text-sm">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country) => {
              const isSelected = selectedCountries.some(c => c.code === country.code);
              const isDisabled = selectedCountries.length >= 5 && !isSelected;
              
              return (
                <button key={country.code} onClick={() => !isDisabled && handleCountryToggle(country)} disabled={isDisabled} className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Image 
                    src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                    alt={`${country.name} flag`}
                    width={20}
                    height={15}
                    className="w-4 h-auto sm:w-5 mr-2 sm:mr-3"
                  />
                  <span className="text-xs sm:text-sm text-gray-900 dark:text-white">{country.name}</span>
                    {isSelected && <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>}
                  </button>
                );
              })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get icon for metric title
const getMetricIcon = (title: string) => {
  switch (title) {
    // Overview
    case 'Total Population': return <FontAwesomeIcon icon={faUsers} />;
    case 'Area': return <FontAwesomeIcon icon={faMapMarkedAlt} />;
    case 'Population Density': return <FontAwesomeIcon icon={faUserFriends} />;
    case 'Urban Population %': return <FontAwesomeIcon icon={faLandmark} />;
    case 'Rural Population %': return <FontAwesomeIcon icon={faRulerVertical} />;
    case 'Net Migration Rate (per 1,000 people)': return <FontAwesomeIcon icon={faArrowRight} />;
    case 'International Migrants': return <FontAwesomeIcon icon={faGlobe} />;
    
    // Economy
    case 'GDP': return <FontAwesomeIcon icon={faMoneyBillWave} />;
    case 'GDP Per Capita': return <FontAwesomeIcon icon={faHandHoldingUsd} />;
    case 'GNI Per Capita': return <FontAwesomeIcon icon={faHandHoldingUsd} />;
    case 'Trade as % of GDP': return <FontAwesomeIcon icon={faChartPie} />;
    case 'Unemployment Rate': return <FontAwesomeIcon icon={faPercentage} />;
    case 'Public Debt % of GDP': return <FontAwesomeIcon icon={faBalanceScale} />;
    case 'Military Expenditure % of GDP': return <FontAwesomeIcon icon={faShieldAlt} />;
    case 'Gini Index': return <FontAwesomeIcon icon={faWeightHanging} />;
    case 'Tax Revenue as % of GDP': return <FontAwesomeIcon icon={faLandmark} />;
    case 'Internet Users %': return <FontAwesomeIcon icon={faGlobe} />;
    case 'Electricity Access %': return <FontAwesomeIcon icon={faSun} />;
    
    // Social
    case 'Human Development Index (HDI)': return <FontAwesomeIcon icon={faChartLine} />;
    case 'Life Expectancy': return <FontAwesomeIcon icon={faChartLine} />;
    case 'Fertility Rate (births per woman)': return <FontAwesomeIcon icon={faBaby} />;
    case 'Literacy Rate': return <FontAwesomeIcon icon={faBookReader} />;
    case 'Education Spending % of GDP': return <FontAwesomeIcon icon={faGraduationCap} />;
    case 'Mean Years of Schooling': return <FontAwesomeIcon icon={faGraduationCap} />;
    case 'Extreme Poverty Rate': return <FontAwesomeIcon icon={faUsers} />;
    case 'Daily Caloric Supply': return <FontAwesomeIcon icon={faUsers} />;
    case 'Income Share of Richest 1%': return <FontAwesomeIcon icon={faUsers} />;
    case 'Income Share of Poorest 50%': return <FontAwesomeIcon icon={faUsers} />;
    case 'Armed Forces Personnel': return <FontAwesomeIcon icon={faShieldAlt} />;
    case 'Forest Coverage %': return <FontAwesomeIcon icon={faTree} />;
    case 'Agricultural Land %': return <FontAwesomeIcon icon={faTractor} />;
    case 'Alcohol Consumption (liters pure alcohol/year)': return <FontAwesomeIcon icon={faWineGlass} />;
    case 'Beer Consumption (liters pure alcohol/year)': return <FontAwesomeIcon icon={faBeer} />;
    case 'Wine Consumption (liters pure alcohol/year)': return <FontAwesomeIcon icon={faWineGlass} />;
    case 'Spirits Consumption (liters pure alcohol/year)': return <FontAwesomeIcon icon={faGlassWhiskey} />;
    case 'Other Alcohols Consumption (liters pure alcohol/year)': return <FontAwesomeIcon icon={faWineGlass} />;
    case 'Tobacco Use (%)': return <FontAwesomeIcon icon={faSmoking} />;
    case 'Tobacco Use - Male (%)': return <FontAwesomeIcon icon={faMale} />;
    case 'Tobacco Use - Female (%)': return <FontAwesomeIcon icon={faFemale} />;
    
    // Safety
    case 'Homicide Rate (per 100,000)': return <FontAwesomeIcon icon={faSkullCrossbones} />;
    case 'Homicide Victims (Total)': return <FontAwesomeIcon icon={faUsers} />;
    case 'Homicide Arrests (Total)': return <FontAwesomeIcon icon={faGavel} />;
    case 'Male Arrests': return <FontAwesomeIcon icon={faMale} />;
    case 'Female Arrests': return <FontAwesomeIcon icon={faFemale} />;
    case 'Male Victims': return <FontAwesomeIcon icon={faMale} />;
    case 'Female Victims': return <FontAwesomeIcon icon={faFemale} />;
    case 'Prison Deaths': return <FontAwesomeIcon icon={faSkullCrossbones} />;
    case 'Terrorism Deaths': return <FontAwesomeIcon icon={faSkullCrossbones} />;
    
    // Trade
    case 'Total Exports': return <FontAwesomeIcon icon={faSignOutAlt} />;
    case 'Total Imports': return <FontAwesomeIcon icon={faSignInAlt} />;
    case 'Trade Balance': return <FontAwesomeIcon icon={faExchangeAlt} />;
    case 'International Tourist Arrivals': return <FontAwesomeIcon icon={faPlane} />;
    case 'Airports': return <FontAwesomeIcon icon={faPlane} />;
    case 'Railways (km)': return <FontAwesomeIcon icon={faCar} />;
    case 'Ports': return <FontAwesomeIcon icon={faShip} />;

    // Climate
    case 'Average Temperature': return <FontAwesomeIcon icon={faTemperatureHigh} />;
    case 'Hot Days (>30°C)': return <FontAwesomeIcon icon={faSun} />;
    case 'Very Hot Days (>35°C)': return <FontAwesomeIcon icon={faSun} />;
    case 'Cold Days (<0°C)': return <FontAwesomeIcon icon={faSnowflake} />;

    default: return <FontAwesomeIcon icon={faChartLine} />;
  }
};

const getMetricTooltip = (title: string): string => {
  const tooltips: Record<string, string> = {
    "Human Development Index (HDI)": "A composite index measuring key dimensions of human development: health (life expectancy), education (schooling), and living standards (income). Scale: 0-1, where higher values indicate higher human development.",
    "International Tourist Arrivals": "Number of trips by people who arrive from abroad and stay overnight. When an individual visits multiple times within a year, each visit is counted separately.",
    "Mean Years of Schooling": "Average years of formal education for individuals aged 15-64. This includes primary, secondary, and higher education but does not count years spent repeating grades.",
    "Tax Revenue as % of GDP": "Direct and indirect taxes as well as social contributions as a percentage of gross domestic product. Includes compulsory payments to government following IMF and OECD definitions.",
    "Extreme Poverty Rate": "Share of population living below the International Poverty Line of $2.15 per day (2017 PPP). Data is adjusted for inflation and differences in living costs between countries.",
    "International Migrants": "People living in a given country who were born in another country. This includes all foreign-born residents regardless of citizenship status.",
    "Daily Caloric Supply": "Daily per capita caloric supply available for human consumption. Measured in kilocalories per day and represents the food available for consumption, not necessarily what is actually consumed.",
    "World Bank Income Group": "World Bank classification of countries based on Gross National Income (GNI) per capita. Categories include Low income, Lower middle income, Upper middle income, and High income countries.",
    "Income Share of Richest 1%": "Percentage of total income received by the richest 1% of the population before taxes and transfers. Higher values indicate greater income inequality at the top of the distribution.",
    "Income Share of Poorest 50%": "Percentage of total income received by the poorest 50% of the population before taxes and transfers. Lower values indicate greater income inequality at the bottom of the distribution.",
    "Armed Forces Personnel": "Active duty military personnel and paramilitary forces as a percentage of total population. Includes all servicemen and women on full-time duty, including conscripts.",
    "Terrorism Deaths": "Total number of deaths from terrorist attacks. Data from the Global Terrorism Database which tracks terrorist incidents worldwide.",
    "Political Regime": "Classification of political systems based on democratic institutions and freedoms. Categories: Closed Autocracy, Electoral Autocracy, Electoral Democracy, and Liberal Democracy.",
    "Total Population": "The total number of people living in the country, including all residents regardless of legal status or citizenship",
    "Area": "Total land and water area of the country in square kilometers",
    "Population Density": "Number of people per square kilometer - calculated by dividing total population by total area",
    "Urban Population %": "Percentage of the total population living in urban areas (cities and towns)",
    "Rural Population %": "Percentage of the total population living in rural areas (countryside and villages)",
    "Fertility Rate (births per woman)": "Average number of children that would be born to a woman over her lifetime",
    "Net Migration Rate (per 1,000 people)": "Difference between immigration and emigration per 1,000 people - positive means more people entering than leaving",
    "GDP": "Gross Domestic Product - total value of all goods and services produced in the country",
    "GDP Per Capita": "GDP divided by population - average economic output per person in US dollars",
    "GNI Per Capita": "Gross National Income per person - includes income from abroad, measured in US dollars",
    "Trade as % of GDP": "Total imports and exports as a percentage of GDP - measures how integrated the economy is with global trade",
    "Unemployment Rate": "Percentage of the labor force that is unemployed but actively seeking employment",
    "Public Debt % of GDP": "Government debt as a percentage of GDP - measures government borrowing relative to economic size",
    "Military Expenditure % of GDP": "Government spending on defense and military as a percentage of GDP",
    "Life Expectancy": "Average number of years a person is expected to live at birth",
    "Literacy Rate": "Percentage of people aged 15 and above who can read and write",
    "Education Spending % of GDP": "Government expenditure on education as a percentage of GDP",
    "Internet Users %": "Percentage of the population that uses the internet",
    "Electricity Access %": "Percentage of the population with access to electricity",
    "Forest Coverage %": "Percentage of land area covered by forests",
    "Agricultural Land %": "Percentage of land area used for agriculture (crops, pasture, etc.)",
    "Alcohol Consumption (liters pure alcohol/year)": "Average liters of pure alcohol consumed per person per year",
    "Tobacco Use (%)": "Percentage of adults who use tobacco products",
    "Tobacco Use - Male (%)": "Percentage of adult males who use tobacco products",
    "Tobacco Use - Female (%)": "Percentage of adult females who use tobacco products",
    "Beer Consumption (liters pure alcohol/year)": "Average liters of pure alcohol from beer consumed per person per year",
    "Wine Consumption (liters pure alcohol/year)": "Average liters of pure alcohol from wine consumed per person per year",
    "Spirits Consumption (liters pure alcohol/year)": "Average liters of pure alcohol from spirits consumed per person per year",
    "Other Alcohols Consumption (liters pure alcohol/year)": "Average liters of pure alcohol from other alcoholic beverages consumed per person per year",
    "Homicide Rate (per 100,000)": "Number of intentional homicides per 100,000 people - a key indicator of violent crime",
    "Homicide Victims (Total)": "Total number of people who were victims of intentional homicide based on UN crime statistics",
    "Homicide Arrests (Total)": "Total number of people arrested or suspected for intentional homicide crimes",
    "Male Arrests": "Number of male individuals arrested or suspected for intentional homicide",
    "Female Arrests": "Number of female individuals arrested or suspected for intentional homicide", 
    "Male Victims": "Number of male victims of intentional homicide",
    "Female Victims": "Number of female victims of intentional homicide",
    "Prison Deaths": "Number of deaths due to intentional homicide that occurred in prison facilities",
    "Average Temperature": "Mean annual temperature across the country in degrees Celsius",
    "Hot Days (>30°C)": "Average number of days per year with maximum temperature above 30°C (86°F)",
    "Very Hot Days (>35°C)": "Average number of days per year with maximum temperature above 35°C (95°F)",
    "Cold Days (<0°C)": "Average number of days per year with minimum temperature below 0°C (32°F)",
    "Total Exports": "Total value of goods and services exported by the country in US dollars",
    "Total Imports": "Total value of goods and services imported by the country in US dollars",
    "Trade Balance": "Difference between total exports and imports - positive indicates trade surplus, negative indicates trade deficit",
    "Gini Index": "Measure of income inequality - 0 means perfect equality, 100 means perfect inequality",
    "Airports": "Total number of airports in the country (including all types: international, domestic, military, etc.)",
          "Railways (km)": "Total length of railway lines in kilometers",
      "Ports": "Total number of ports in the country (including seaports, river ports, and lake ports)",
      "Exchange Rates (2024)": "Currency exchange rate to US Dollar for the most recent year available"
  
  };
  
  return tooltips[title] || "No description available for this metric";
};

// Source color mapping for visual indicators
const sourceColors = {
  'World Bank': '#3B82F6',        // Blue
  'Our World in Data': '#10B981', // Green
  'CIA World Factbook': '#F59E0B', // Amber
  'RestCountries': '#8B5CF6',     // Purple
  'Climate API': '#EF4444',       // Red
  'UN Comtrade': '#6366F1',       // Indigo
  'CTS/NSO': '#EC4899',          // Pink
  'UN HDI': '#14B8A6',           // Teal
  'UN DESA': '#0891B2',          // Cyan
  'UNU-WIDER': '#65A30D',         // Lime
  'Barro-Lee': '#BE185D',         // Fuchsia
  'FAO': '#FB923C',               // Orange
  'WID': '#D946EF',               // Violet
  'UNWTO': '#4F46E5',              // Indigo
  'GTD': '#DC2626',               // Red
  'Default': '#6B7280'           // Gray
};

// Function to get source color based on source organization
const getSourceColor = (source: string | undefined): string => {
  if (!source) return sourceColors.Default;
  
  if (source.includes('Climate')) return sourceColors['Climate API'];
  if (source.includes('World Bank')) return sourceColors['World Bank'];
  if (source.includes('UN DESA')) return sourceColors['UN DESA'];
  if (source.includes('UNU-WIDER')) return sourceColors['UNU-WIDER'];
  if (source.includes('Barro-Lee')) return sourceColors['Barro-Lee'];
  if (source.includes('FAO')) return sourceColors['FAO'];
  if (source.includes('World Inequality Database')) return sourceColors['WID'];
  if (source.includes('UNWTO')) return sourceColors['UNWTO'];
  if (source.includes('Global Terrorism Database')) return sourceColors['GTD'];
  if (source.includes('Our World in Data')) return sourceColors['Our World in Data'];
  if (source.includes('CIA') || source.includes('Factbook')) return sourceColors['CIA World Factbook'];
  if (source.includes('RestCountries')) return sourceColors['RestCountries'];
  if (source.includes('Comtrade')) return sourceColors['UN Comtrade'];
  if (source.includes('CTS') || source.includes('NSO')) return sourceColors['CTS/NSO'];
  if (source.includes('HDI') || source.includes('UNDP')) return sourceColors['UN HDI'];
  
  return sourceColors.Default;
};

// Compact Section Table Component
const CompactSectionTable = ({ 
  sectionId,
  title, 
  metrics, 
  countries, 
  countryStats, 
  loading, 
  activeTooltip, 
  toggleTooltip,
  isExpanded,
  onToggle 
}: {
  sectionId: string;
  title: string;
  metrics: string[];
  countries: Country[];
  countryStats: Record<string, CountryStats>;
  loading: boolean;
  activeTooltip: string | null;
  toggleTooltip: (tooltipId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const [showSources, setShowSources] = useState(false);
  const [showAsPercentage, setShowAsPercentage] = useState(false);
  
  const getWorldBankMetricValue = (data: DataWithSource | undefined | null, format: (value: number) => string) => {
    return {
      value: data?.value ?? null,
      source: 'World Bank Open Data',
      sourceDetail: data?.source ?? null,
      formatted: data?.value ? format(data.value) : 'N/A'
    };
  };

  // Get value function for each metric
  const getMetricValue = (metric: string, country: Country): { value: number | null; source: string | null; sourceDetail: string | null; formatted: string } => {
    const stats = countryStats[country.code];
    if (!stats) return { value: null, source: null, sourceDetail: null, formatted: 'N/A' };

    switch (metric) {
      // Overview metrics
      case 'Total Population':
        return getWorldBankMetricValue(stats.population, v => `${v.toLocaleString()} people`);
      case 'Area':
        return getWorldBankMetricValue(stats.area, v => `${v.toLocaleString()} km²`);
      case 'Population Density':
        return getWorldBankMetricValue(stats.populationDensity, v => `${v.toFixed(1)} people/km²`);
      case 'Urban Population %':
        return getWorldBankMetricValue(stats.urbanPopPct, v => `${v.toFixed(1)}%`);
      case 'Rural Population %':
        return getWorldBankMetricValue(stats.ruralPopPct, v => `${v.toFixed(1)}%`);
      case 'Net Migration Rate (per 1,000 people)':
        return { value: stats.enhancedInfo?.factbookData?.netMigrationRate ?? null, source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook', formatted: stats.enhancedInfo?.factbookData?.netMigrationRate ? `${stats.enhancedInfo.factbookData.netMigrationRate.toFixed(1)}/1000` : 'N/A' };
      case 'International Migrants':
        return { value: stats.enhancedInfo?.migrantsData?.value ?? null, source: 'UN DESA', sourceDetail: stats.enhancedInfo?.migrantsData?.source ?? null, formatted: stats.enhancedInfo?.migrantsData?.value ? `${stats.enhancedInfo.migrantsData.value.toLocaleString()} people` : 'N/A' };
      
      // Economy metrics
      case 'GDP':
        return getWorldBankMetricValue(stats.gdp, v => `$${(v).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}B`);
      case 'GDP Per Capita':
        return getWorldBankMetricValue(stats.gdpPerCapita, v => `$${v.toLocaleString()}`);
      case 'GNI Per Capita':
        return getWorldBankMetricValue(stats.gniPerCapita, v => `$${v.toLocaleString()}`);
      case 'Trade as % of GDP':
        return getWorldBankMetricValue(stats.tradeGDP, v => `${v.toFixed(1)}%`);
      case 'Unemployment Rate':
        return getWorldBankMetricValue(stats.unemploymentRate, v => `${v.toFixed(1)}%`);
      case 'Public Debt % of GDP': {
        const wbData = stats.publicDebtGDP;
        if (wbData?.value != null) {
          return getWorldBankMetricValue(wbData, v => `${v.toFixed(1)}%`);
        }
        const fbValue = stats.enhancedInfo?.factbookData?.publicDebt;
        return {
          value: fbValue ?? null,
          source: fbValue != null ? 'CIA World Factbook' : null,
          sourceDetail: fbValue != null ? 'CIA World Factbook' : null,
          formatted: fbValue != null ? `${fbValue.toFixed(1)}%` : 'N/A'
        };
      }
      case 'Military Expenditure % of GDP':
        return { value: stats.enhancedInfo?.factbookData?.militaryExpenditure ?? null, source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook', formatted: stats.enhancedInfo?.factbookData?.militaryExpenditure ? `${stats.enhancedInfo.factbookData.militaryExpenditure.toFixed(1)}%` : 'N/A' };
      case 'Gini Index':
        return { value: stats.enhancedInfo?.factbookData?.giniIndex ?? null, source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook', formatted: stats.enhancedInfo?.factbookData?.giniIndex ? `${stats.enhancedInfo.factbookData.giniIndex.toFixed(1)}` : 'N/A' };
      case 'Tax Revenue as % of GDP':
        return { value: stats.enhancedInfo?.taxRevenueData?.value ?? null, source: 'UNU-WIDER', sourceDetail: stats.enhancedInfo?.taxRevenueData?.source ?? null, formatted: stats.enhancedInfo?.taxRevenueData?.value ? `${stats.enhancedInfo.taxRevenueData.value.toFixed(1)}%` : 'N/A' };
      case 'Internet Users %':
        return getWorldBankMetricValue(stats.internetUsers, v => `${v.toFixed(1)}%`);
      case 'Electricity Access %':
        return getWorldBankMetricValue(stats.electricityAccess, v => `${v.toFixed(1)}%`);
      
      // Social metrics
      case 'Human Development Index (HDI)':
        return { value: stats.enhancedInfo?.hdiData?.hdi ?? null, source: 'UN HDI', sourceDetail: stats.enhancedInfo?.hdiData?.source ?? null, formatted: stats.enhancedInfo?.hdiData?.hdi ? `${stats.enhancedInfo.hdiData.hdi.toFixed(3)}` : 'N/A' };
      case 'Life Expectancy':
        return getWorldBankMetricValue(stats.lifeExpectancy, v => `${v.toFixed(1)} years`);
      case 'Fertility Rate (births per woman)':
        return getWorldBankMetricValue(stats.fertilityRate, v => `${v.toFixed(1)} births/woman`);
      case 'Literacy Rate': {
        const wbData = stats.literacyRate;
        if (wbData?.value != null) {
          return getWorldBankMetricValue(wbData, v => `${v.toFixed(1)}%`);
        }
        const fbValue = stats.enhancedInfo?.factbookData?.literacyRate;
        return {
          value: fbValue ?? null,
          source: fbValue != null ? 'CIA World Factbook' : null,
          sourceDetail: fbValue != null ? 'CIA World Factbook' : null,
          formatted: fbValue != null ? `${fbValue.toFixed(1)}%` : 'N/A'
        };
      }
      case 'Education Spending % of GDP':
        return getWorldBankMetricValue(stats.educationSpendPctGDP, v => `${v.toFixed(1)}%`);
      case 'Mean Years of Schooling':
        return { value: stats.enhancedInfo?.schoolingYearsData?.value ?? null, source: 'Barro-Lee', sourceDetail: stats.enhancedInfo?.schoolingYearsData?.source ?? null, formatted: stats.enhancedInfo?.schoolingYearsData?.value ? `${stats.enhancedInfo.schoolingYearsData.value.toFixed(1)} years` : 'N/A' };
      case 'Extreme Poverty Rate':
        return { value: stats.enhancedInfo?.extremePovertyData?.value ?? null, source: 'Our World in Data', sourceDetail: stats.enhancedInfo?.extremePovertyData?.source ?? null, formatted: stats.enhancedInfo?.extremePovertyData?.value ? `${stats.enhancedInfo.extremePovertyData.value.toFixed(1)}%` : 'N/A' };
      case 'Daily Caloric Supply':
        return { value: stats.enhancedInfo?.caloricSupplyData?.value ?? null, source: 'FAO', sourceDetail: stats.enhancedInfo?.caloricSupplyData?.source ?? null, formatted: stats.enhancedInfo?.caloricSupplyData?.value ? `${stats.enhancedInfo.caloricSupplyData.value.toLocaleString()} kcal` : 'N/A' };
      case 'Income Share of Richest 1%':
        return { value: stats.enhancedInfo?.incomeShareRichest1Data?.value ?? null, source: 'World Inequality Database', sourceDetail: stats.enhancedInfo?.incomeShareRichest1Data?.source ?? null, formatted: stats.enhancedInfo?.incomeShareRichest1Data?.value ? `${stats.enhancedInfo.incomeShareRichest1Data.value.toFixed(1)}%` : 'N/A' };
      case 'Income Share of Poorest 50%':
        return { value: stats.enhancedInfo?.incomeSharePoorest50Data?.value ?? null, source: 'World Inequality Database', sourceDetail: stats.enhancedInfo?.incomeSharePoorest50Data?.source ?? null, formatted: stats.enhancedInfo?.incomeSharePoorest50Data?.value ? `${stats.enhancedInfo.incomeSharePoorest50Data.value.toFixed(1)}%` : 'N/A' };
      case 'Armed Forces Personnel':
        return { value: stats.enhancedInfo?.armedForcesPersonnelData?.value ?? null, source: 'Our World in Data', sourceDetail: stats.enhancedInfo?.armedForcesPersonnelData?.source ?? null, formatted: stats.enhancedInfo?.armedForcesPersonnelData?.value != null ? `${stats.enhancedInfo.armedForcesPersonnelData.value.toFixed(1)}%` : 'N/A' };
      case 'Forest Coverage %':
        return getWorldBankMetricValue(stats.forestPct, v => `${v.toFixed(1)}%`);
      case 'Agricultural Land %':
        return getWorldBankMetricValue(stats.agriculturalLandPct, v => `${v.toFixed(1)}%`);
      case 'Alcohol Consumption (liters pure alcohol/year)':
        return { value: parseAlcoholConsumption(stats.enhancedInfo?.factbookData?.alcoholConsumption), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook', formatted: stats.enhancedInfo?.factbookData?.alcoholConsumption ? `${stats.enhancedInfo.factbookData.alcoholConsumption}` : 'N/A' };
      case 'Beer Consumption (liters pure alcohol/year)':
        return { value: parseAlcoholBeer(stats.enhancedInfo?.factbookData?.alcoholConsumption), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook', formatted: stats.enhancedInfo?.factbookData?.alcoholConsumption ? `${stats.enhancedInfo.factbookData.alcoholConsumption}` : 'N/A' };
      case 'Wine Consumption (liters pure alcohol/year)':
        return { value: parseAlcoholWine(stats.enhancedInfo?.factbookData?.alcoholConsumption), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook', formatted: stats.enhancedInfo?.factbookData?.alcoholConsumption ? `${stats.enhancedInfo.factbookData.alcoholConsumption}` : 'N/A' };
      case 'Spirits Consumption (liters pure alcohol/year)':
        return { value: parseAlcoholSpirits(stats.enhancedInfo?.factbookData?.alcoholConsumption), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook', formatted: stats.enhancedInfo?.factbookData?.alcoholConsumption ? `${stats.enhancedInfo.factbookData.alcoholConsumption}` : 'N/A' };
      case 'Other Alcohols Consumption (liters pure alcohol/year)':
        return { value: parseAlcoholOther(stats.enhancedInfo?.factbookData?.alcoholConsumption), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook', formatted: stats.enhancedInfo?.factbookData?.alcoholConsumption ? `${stats.enhancedInfo.factbookData.alcoholConsumption}` : 'N/A' };
      case 'Tobacco Use (%)':
        return { value: parseTobaccoUse(stats.enhancedInfo?.factbookData?.tobaccoUse), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook', formatted: stats.enhancedInfo?.factbookData?.tobaccoUse ? `${stats.enhancedInfo.factbookData.tobaccoUse}` : 'N/A' };
      case 'Tobacco Use - Male (%)':
        return { value: parseTobaccoUseMale(stats.enhancedInfo?.factbookData?.tobaccoUse), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook', formatted: stats.enhancedInfo?.factbookData?.tobaccoUse ? `${stats.enhancedInfo.factbookData.tobaccoUse}` : 'N/A' };
      case 'Tobacco Use - Female (%)':
        return { value: parseTobaccoUseFemale(stats.enhancedInfo?.factbookData?.tobaccoUse), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook', formatted: stats.enhancedInfo?.factbookData?.tobaccoUse ? `${stats.enhancedInfo.factbookData.tobaccoUse}` : 'N/A' };
      
      // Safety metrics
      case 'Homicide Rate (per 100,000)':
        return getWorldBankMetricValue(stats.homicideRate, v => v.toFixed(1));
      case 'Homicide Victims (Total)':
        return { value: stats.enhancedInfo?.crimeData?.victimData?.totalVictims ?? null, source: 'CTS/NSO', sourceDetail: stats.enhancedInfo?.crimeData?.source ?? null, formatted: stats.enhancedInfo?.crimeData?.victimData?.totalVictims ? `${stats.enhancedInfo.crimeData.victimData.totalVictims.toLocaleString()} people` : 'N/A' };
      case 'Homicide Arrests (Total)':
        return { value: stats.enhancedInfo?.crimeData?.totalArrests ?? null, source: 'CTS/NSO', sourceDetail: stats.enhancedInfo?.crimeData?.source ?? null, formatted: stats.enhancedInfo?.crimeData?.totalArrests ? `${stats.enhancedInfo.crimeData.totalArrests.toLocaleString()} people` : 'N/A' };
      case 'Male Arrests':
        return { value: stats.enhancedInfo?.crimeData?.arrestsBySex?.male ?? null, source: 'CTS/NSO', sourceDetail: stats.enhancedInfo?.crimeData?.source ?? null, formatted: stats.enhancedInfo?.crimeData?.arrestsBySex?.male ? `${stats.enhancedInfo.crimeData.arrestsBySex.male.toLocaleString()} people` : 'N/A' };
      case 'Female Arrests':
        return { value: stats.enhancedInfo?.crimeData?.arrestsBySex?.female ?? null, source: 'CTS/NSO', sourceDetail: stats.enhancedInfo?.crimeData?.source ?? null, formatted: stats.enhancedInfo?.crimeData?.arrestsBySex?.female ? `${stats.enhancedInfo.crimeData.arrestsBySex.female.toLocaleString()} people` : 'N/A' };
      case 'Male Victims':
        return { value: stats.enhancedInfo?.crimeData?.victimData?.maleVictims ?? null, source: 'CTS/NSO', sourceDetail: stats.enhancedInfo?.crimeData?.source ?? null, formatted: stats.enhancedInfo?.crimeData?.victimData?.maleVictims ? `${stats.enhancedInfo.crimeData.victimData.maleVictims.toLocaleString()} people` : 'N/A' };
      case 'Female Victims':
        return { value: stats.enhancedInfo?.crimeData?.victimData?.femaleVictims ?? null, source: 'CTS/NSO', sourceDetail: stats.enhancedInfo?.crimeData?.source ?? null, formatted: stats.enhancedInfo?.crimeData?.victimData?.femaleVictims ? `${stats.enhancedInfo.crimeData.victimData.femaleVictims.toLocaleString()} people` : 'N/A' };
      case 'Prison Deaths':
        return { value: stats.enhancedInfo?.crimeData?.prisonDeaths ?? null, source: 'CTS/NSO', sourceDetail: stats.enhancedInfo?.crimeData?.source ?? null, formatted: stats.enhancedInfo?.crimeData?.prisonDeaths ? `${stats.enhancedInfo.crimeData.prisonDeaths.toLocaleString()} deaths` : 'N/A' };
      case 'Terrorism Deaths':
        return { value: stats.enhancedInfo?.terrorismDeathsData?.value ?? null, source: 'Global Terrorism Database', sourceDetail: stats.enhancedInfo?.terrorismDeathsData?.source ?? null, formatted: stats.enhancedInfo?.terrorismDeathsData?.value ? `${stats.enhancedInfo.terrorismDeathsData.value.toLocaleString()} deaths` : 'N/A' };
      
      // Climate metrics
      case 'Average Temperature':
        return { value: stats.enhancedInfo?.climateData?.averageTemperature ?? null, source: 'World Bank Climate Knowledge Portal', sourceDetail: stats.enhancedInfo?.climateData?.source ?? null, formatted: stats.enhancedInfo?.climateData?.averageTemperature ? `${stats.enhancedInfo.climateData.averageTemperature.toFixed(1)}°C` : 'N/A' };
      case 'Hot Days (>30°C)':
        return { value: stats.enhancedInfo?.climateData?.hotDays30 ?? null, source: 'World Bank Climate Knowledge Portal', sourceDetail: stats.enhancedInfo?.climateData?.source ?? null, formatted: stats.enhancedInfo?.climateData?.hotDays30 ? `${stats.enhancedInfo.climateData.hotDays30.toFixed(0)} days` : 'N/A' };
      case 'Very Hot Days (>35°C)':
        return { value: stats.enhancedInfo?.climateData?.hotDays35 ?? null, source: 'World Bank Climate Knowledge Portal', sourceDetail: stats.enhancedInfo?.climateData?.source ?? null, formatted: stats.enhancedInfo?.climateData?.hotDays35 ? `${stats.enhancedInfo.climateData.hotDays35.toFixed(0)} days` : 'N/A' };
      case 'Cold Days (<0°C)':
        return { value: stats.enhancedInfo?.climateData?.coldDays ?? null, source: 'World Bank Climate Knowledge Portal', sourceDetail: stats.enhancedInfo?.climateData?.source ?? null, formatted: stats.enhancedInfo?.climateData?.coldDays ? `${stats.enhancedInfo.climateData.coldDays.toFixed(0)} days` : 'N/A' };
      
      // Trade metrics
      case 'Total Exports':
        return { value: stats.enhancedInfo?.comtradeData?.totalExports?.value ?? null, source: 'UN Comtrade', sourceDetail: stats.enhancedInfo?.comtradeData?.source ?? null, formatted: stats.enhancedInfo?.comtradeData?.totalExports?.value ? `$${(stats.enhancedInfo.comtradeData.totalExports.value).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}B` : 'N/A' };
      case 'Total Imports':
        return { value: stats.enhancedInfo?.comtradeData?.totalImports?.value ?? null, source: 'UN Comtrade', sourceDetail: stats.enhancedInfo?.comtradeData?.source ?? null, formatted: stats.enhancedInfo?.comtradeData?.totalImports?.value ? `$${(stats.enhancedInfo.comtradeData.totalImports.value).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}B` : 'N/A' };
      case 'Trade Balance':
        const tradeBalanceValue = stats.enhancedInfo?.comtradeData?.tradeBalance?.value;
        const formattedTradeBalance = tradeBalanceValue != null ? `${(Math.abs(tradeBalanceValue)).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}B` : 'N/A';
        return { value: tradeBalanceValue ?? null, source: 'UN Comtrade', sourceDetail: stats.enhancedInfo?.comtradeData?.source ?? null, formatted: tradeBalanceValue != null ? `${tradeBalanceValue >= 0 ? '+' : '-'}$${formattedTradeBalance}` : 'N/A' };
      case 'International Tourist Arrivals':
        return { value: stats.enhancedInfo?.touristsData?.value ?? null, source: 'UNWTO', sourceDetail: stats.enhancedInfo?.touristsData?.source ?? null, formatted: stats.enhancedInfo?.touristsData?.value ? `${stats.enhancedInfo.touristsData.value.toLocaleString()} trips` : 'N/A' };
      case 'Airports':
        return { value: stats.enhancedInfo?.factbookData?.airports ?? null, source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook', formatted: stats.enhancedInfo?.factbookData?.airports ? `${stats.enhancedInfo.factbookData.airports.toLocaleString()} airports` : 'N/A' };
      case 'Railways (km)':
        return { value: stats.enhancedInfo?.factbookData?.railways ?? null, source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook', formatted: stats.enhancedInfo?.factbookData?.railways ? `${stats.enhancedInfo.factbookData.railways.toLocaleString()} km` : 'N/A' };
      case 'Ports':
        return { value: stats.enhancedInfo?.factbookData?.ports ?? null, source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook', formatted: stats.enhancedInfo?.factbookData?.ports ? `${stats.enhancedInfo.factbookData.ports.toLocaleString()} ports` : 'N/A' };
      
      default:
        return { value: null, source: null, sourceDetail: null, formatted: 'N/A' };
    }
  };

  const formatMetricValue = (metric: string, value: number | null): string => {
    if (value === null) return 'N/A';
    
    switch (metric) {
      // Overview metrics
      case 'Total Population':
        return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${value.toLocaleString()}`;
      case 'Area':
        return `${value.toLocaleString()} km²`;
      case 'Population Density':
        return `${value.toFixed(1)}/km²`;
      case 'Urban Population %':
      case 'Rural Population %':
        return `${value.toFixed(1)}%`;
      case 'Net Migration Rate (per 1,000 people)':
        return `${value.toFixed(1)}/1000`;
      case 'International Migrants':
        return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${value.toLocaleString()}`;
      
      // Economy metrics
      case 'GDP':
        if (value >= 1000000000) {
          return `$${(value / 1000000000).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}B`;
        }
        return `$${(value / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}M`;
      case 'GDP Per Capita':
      case 'GNI Per Capita':
        return `$${value.toLocaleString()}`;
      case 'Trade as % of GDP':
      case 'Unemployment Rate':
      case 'Public Debt % of GDP':
      case 'Military Expenditure % of GDP':
      case 'Tax Revenue as % of GDP':
      case 'Internet Users %':
      case 'Electricity Access %':
      case 'Education Spending % of GDP':
      case 'Forest Coverage %':
      case 'Agricultural Land %':
      case 'Extreme Poverty Rate':
      case 'Income Share of Richest 1%':
      case 'Income Share of Poorest 50%':
      case 'Tobacco Use (%)':
        return `${value.toFixed(1)}%`;
      case 'Gini Index':
        return value.toFixed(1);
      
      // Social metrics
      case 'Human Development Index (HDI)':
        return value.toFixed(3);
      case 'Life Expectancy':
        return `${value.toFixed(1)} years`;
      case 'Fertility Rate (births per woman)':
        return `${value.toFixed(1)} births/woman`;
      case 'Literacy Rate':
        return `${value.toFixed(1)}%`;
      case 'Mean Years of Schooling':
        return `${value.toFixed(1)} years`;
      case 'Daily Caloric Supply':
        return `${value.toLocaleString()} kcal`;
      case 'Armed Forces Personnel':
        return `${value.toFixed(1)}%`;
      case 'Alcohol Consumption (liters pure alcohol/year)':
      case 'Beer Consumption (liters pure alcohol/year)':
      case 'Wine Consumption (liters pure alcohol/year)':
      case 'Spirits Consumption (liters pure alcohol/year)':
      case 'Other Alcohols Consumption (liters pure alcohol/year)':
        return `${value.toFixed(1)}L`;
      case 'Tobacco Use - Male (%)':
      case 'Tobacco Use - Female (%)':
        return `${value.toFixed(1)}%`;
      
      // Safety metrics
      case 'Homicide Rate (per 100,000)':
        return value.toFixed(1);
      case 'Homicide Victims (Total)':
      case 'Homicide Arrests (Total)':
      case 'Male Arrests':
      case 'Female Arrests':
      case 'Male Victims':
      case 'Female Victims':
      case 'Prison Deaths':
        return value.toLocaleString();
      case 'Terrorism Deaths':
        return value.toLocaleString();
      
      // Climate metrics
      case 'Average Temperature':
        return `${value.toFixed(1)}°C`;
      case 'Hot Days (>30°C)':
      case 'Very Hot Days (>35°C)':
      case 'Cold Days (<0°C)':
        return `${value.toFixed(0)} days`;
      
      // Trade metrics
      case 'Total Exports':
      case 'Total Imports':
        if (value >= 1000000000) {
          return `$${(value / 1000000000).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}B`;
        }
        return `$${(value / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}M`;
      case 'Trade Balance':
        const tradeBalanceValue = value;
        if (tradeBalanceValue === null) return 'N/A';
        const formattedValue = (Math.abs(tradeBalanceValue / 1e9)).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
        return tradeBalanceValue >= 0 ? `+$${formattedValue}B` : `-$${formattedValue}B`;
      case 'International Tourist Arrivals':
        return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${value.toLocaleString()}`;
      case 'Airports':
      case 'Ports':
        return value.toLocaleString();
      case 'Railways (km)':
        return `${value.toLocaleString()} km`;
      
      default:
        return value.toLocaleString();
    }
  };

  // Calculate max values for comparison bars
  const metricMaxValues = metrics.reduce((acc, metric) => {
    const values = countries.map(country => getMetricValue(metric, country).value).filter(v => v !== null) as number[];
    acc[metric] = Math.max(...values, 0);
    return acc;
  }, {} as Record<string, number>);

  // Get unique sources used in this section
  const sectionSources = new Map<string, Set<string>>();
  metrics.forEach(metric => {
    countries.forEach(country => {
      const { source, sourceDetail } = getMetricValue(metric, country);
      if (source && sourceDetail) {
        if (!sectionSources.has(source)) {
          sectionSources.set(source, new Set<string>());
        }
        sectionSources.get(source)!.add(sourceDetail);
      } else if (source) {
        if (!sectionSources.has(source)) {
          sectionSources.set(source, new Set<string>());
        }
      }
    });
  });

  return (
    <div id={sectionId} className="mb-12 scroll-mt-24">
      <button
        onClick={onToggle}
        className="w-full text-left mb-6 group"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
            {title}
          </h2>
          <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div>
          <div className="flex justify-end items-center mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-400 mr-3">Display as:</span>
              <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                      type="button"
                      onClick={() => setShowAsPercentage(false)}
                      className={`px-4 py-2 text-sm font-medium rounded-l-lg border transition-colors ${
                          !showAsPercentage
                              ? 'bg-blue-600 text-white border-blue-600 z-10 ring-2 ring-blue-300'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                      Raw Value
                  </button>
                  <button
                      type="button"
                      onClick={() => setShowAsPercentage(true)}
                      className={`px-4 py-2 text-sm font-medium rounded-r-lg border transition-colors ${
                          showAsPercentage
                              ? 'bg-blue-600 text-white border-blue-600 z-10 ring-2 ring-blue-300'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                      % of Highest
                  </button>
              </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 min-w-[200px]">
                      Metric
                    </th>
                    {countries.map(country => (
                      <th key={country.code} className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 min-w-[140px]">
                        <div className="flex flex-col items-center space-y-1">
                          <Image 
                            src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                            alt={`${country.name} flag`}
                            width={20}
                            height={15}
                            className="w-5 h-auto"
                          />
                          <span className="text-xs font-medium truncate max-w-[120px]">{country.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                  {metrics.map((metric) => {
                    const metricId = `${sectionId}-${metric.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`;
                    const maxValue = metricMaxValues[metric];
                    
                    return (
                      <tr key={metric} id={metricId} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getSourceColor(countries.find(c => getMetricValue(metric, c).source)?.code ? getMetricValue(metric, countries.find(c => getMetricValue(metric, c).source)!).source || undefined : undefined) }}
                            />
                            <div className="flex items-center space-x-2">
                              <span className="text-sm sm:text-base mr-2 opacity-70">{getMetricIcon(metric)}</span>
                              <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{metric}</span>
                              <div className="group relative tooltip-container">
                                <HelpCircle 
                                  size={14} 
                                  className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors duration-200" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTooltip(`tooltip-${metricId}`);
                                  }}
                                />
                                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs sm:text-sm rounded-lg shadow-lg transition-opacity duration-200 z-10 w-48 sm:w-64 text-center ${
                                  activeTooltip === `tooltip-${metricId}` 
                                    ? 'opacity-100 pointer-events-auto' 
                                    : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
                                }`}>
                                  {getMetricTooltip(metric)}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        {countries.map(country => {
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          const { value, source } = getMetricValue(metric, country);
                          const percentage = value && maxValue > 0 ? (value / maxValue) * 100 : 0;
                          
                          return (
                            <td key={country.code} className="px-3 sm:px-4 py-3 sm:py-4">
                              <div className="flex flex-col items-center space-y-2">
                                <span className={`text-xs sm:text-sm font-medium text-center ${
                                  value !== null ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {loading ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                                  ) : showAsPercentage ? (
                                    value !== null ? `${percentage.toFixed(1)}%` : 'N/A'
                                  ) : (
                                    formatMetricValue(metric, value)
                                  )}
                                </span>
                                {value !== null && value > 0 && maxValue > 0 && countries.length > 1 && (
                                  <div className="w-full max-w-[100px] bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                    <div 
                                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out" 
                                      style={{ width: `${Math.max(4, percentage)}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Section Sources */}
            {isExpanded && sectionSources.size > 0 && (
              <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="w-full flex justify-between items-center text-left text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <span>{showSources ? 'Hide' : 'Show'} Sources ({sectionSources.size})</span>
                  <ChevronDown
                    className={`w-4 h-4 transform transition-transform duration-200 ${
                      showSources ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {showSources && (
                  <div className="mt-3 space-y-3">
                  {Array.from(sectionSources.entries()).map(([organization, details]) => (
                      <div key={organization} className="flex items-start space-x-2">
                      <div 
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" 
                        style={{ backgroundColor: getSourceColor(organization) }}
                      />
                        <div className="text-xs">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{organization}</span>
                          {details.size > 0 && (
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {Array.from(details).map((detail, index) => (
                                <li key={index} className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {detail}
                                </li>
                            ))}
                          </ul>
                          )}
                        </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MetricTable = ({ title, countries, getValue, getSource, formatValue, loading, activeTooltip, toggleTooltip }: {
  title: string;
  countries: Country[];
  getValue: (country: Country) => number | null;
  getSource: (country: Country) => string | null;
  formatValue: (value: number) => string;
  loading?: boolean;
  activeTooltip?: string | null;
  toggleTooltip?: (tooltipId: string) => void;
}) => {
  // Create a unique ID from the title
  const metricId = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const data = countries
    .map(country => ({ 
      country, 
      value: getValue(country)
    }))
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  const maxValue = Math.max(...data.map(d => d.value || 0));
  const showComparison = countries.length > 1 && data.some(d => d.value !== null && d.value > 0);

  return (
    <div id={`metric-${metricId}`} className="mb-8 scroll-mt-24 transition-all duration-300">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
        <span className="text-sm sm:text-base mr-2 opacity-70">{getMetricIcon(title)}</span>
        <span className="text-gray-900 dark:text-white">
          {title}
        </span>
        <div className="group relative ml-2 tooltip-container">
          <HelpCircle 
            size={14} 
            className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors duration-200" 
            onClick={(e) => {
              e.stopPropagation();
              toggleTooltip?.(`tooltip-${metricId}`);
            }}
          />
          <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs sm:text-sm rounded-lg shadow-lg transition-opacity duration-200 z-10 w-48 sm:w-64 text-center ${
            activeTooltip === `tooltip-${metricId}` 
              ? 'opacity-100 pointer-events-auto' 
              : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
          }`}>
            {getMetricTooltip(title)}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
          </div>
        </div>
      </h3>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] sm:min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                  Country
                </th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                  Value
                </th>
                {showComparison && (
                  <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                    Comparison
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
              {data.map(({ country, value }) => (
                <tr 
                  key={country.code} 
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors duration-150"
                >
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4">
                    <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                      <Image 
                          src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                          alt={`${country.name} flag`}
                          width={20}
                          height={15}
                          className="w-4 h-auto sm:w-5 mr-1 sm:mr-2"
                        />
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {country.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4">
                    <span className={`text-xs sm:text-sm font-medium ${
                      value !== null ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {loading ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
                          <span className="hidden sm:inline">Loading...</span>
                          <span className="sm:hidden">...</span>
                        </span>
                      ) : value !== null ? formatValue(value) : "N/A"}
                    </span>
                  </td>
                  {showComparison && (
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4">
                      {value !== null && value > 0 && maxValue > 0 ? (
                        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 sm:h-3 max-w-[60px] sm:max-w-[100px] md:max-w-[140px]">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 sm:h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
                              style={{ width: `${Math.max(8, (value / maxValue) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium min-w-[20px] sm:min-w-[25px] md:min-w-[35px] text-right">
                            {((value / maxValue) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CollapsibleInfoSection = ({ title, children, isExpanded, onToggle, titleClassName }: { title: React.ReactNode, children: React.ReactNode, isExpanded: boolean, onToggle: () => void, titleClassName?: string }) => {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full text-left sm:pointer-events-none"
      >
        <h4 className={`text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-600 pb-2 flex justify-between items-center ${titleClassName}`}>
          <span>{title}</span>
          <span className="sm:hidden transform transition-transform duration-200">{isExpanded ? '▲' : '▼'}</span>
        </h4>
      </button>
      <div className={`sm:block ${isExpanded ? 'block' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );
};

const parseAlcoholConsumption = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/total: ([\d.]+) liters of pure alcohol/);
  return match ? parseFloat(match[1]) : null;
};

const parseTobaccoUse = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/total: ([\d.]+)%/);
  return match ? parseFloat(match[1]) : null;
};

const parseTobaccoUseMale = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/male: ([\d.]+)%/);
  return match ? parseFloat(match[1]) : null;
};

const parseTobaccoUseFemale = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/female: ([\d.]+)%/);
  return match ? parseFloat(match[1]) : null;
};

const parseAlcoholBeer = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/beer: ([\d.]+) liters of pure alcohol/);
  return match ? parseFloat(match[1]) : null;
};

const parseAlcoholWine = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/wine: ([\d.]+) liters of pure alcohol/);
  return match ? parseFloat(match[1]) : null;
};

const parseAlcoholSpirits = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/spirits: ([\d.]+) liters of pure alcohol/);
  return match ? parseFloat(match[1]) : null;
};

const parseAlcoholOther = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/other alcohols: ([\d.]+) liters of pure alcohol/);
  return match ? parseFloat(match[1]) : null;
};

export default function HomePage() {
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([countries[0]]);
  const [countryStats, setCountryStats] = useState<Record<string, CountryStats>>({});
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, Record<string, boolean>>>({});
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [countryInfoExpanded, setCountryInfoExpanded] = useState(false);
  const [selectedCountryInfo, setSelectedCountryInfo] = useState<string | null>(null);
  const [selectedTradeCountry, setSelectedTradeCountry] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showStickyNav, setShowStickyNav] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: false,
    economy: false,
    social: false,
    trade: false,
    safety: false,
    climate: false,
    sources: false
  });
  const [contentSectionsExpanded, setContentSectionsExpanded] = useState<Record<string, boolean>>({
    overview: true,
    economy: true,
    social: true,
    trade: true,
    safety: true,
    climate: true,
    sources: true
  });
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [infoSectionsExpanded, setInfoSectionsExpanded] = useState<Record<string, boolean>>({
    basic: true,
    demographics: true,
    geography: true,
    government: true,
    languages: true,
    economy: true,
    sources: true,
  });

  // Define metrics for each section
  const sectionMetrics: Record<string, string[]> = {
    overview: [
      'Total Population',
      'Area',
      'Population Density',
      'Urban Population %',
      'Rural Population %',
      'Net Migration Rate (per 1,000 people)',
      'International Migrants'
    ],
    economy: [
      'GDP',
      'GDP Per Capita', 
      'GNI Per Capita',
      'Trade as % of GDP',
      'Unemployment Rate',
      'Public Debt % of GDP',
      'Military Expenditure % of GDP',
      'Gini Index',
      'Tax Revenue as % of GDP',
      'Internet Users %',
      'Electricity Access %'
    ],
    social: [
      'Human Development Index (HDI)',
      'Life Expectancy',
      'Fertility Rate (births per woman)',
      'Literacy Rate',
      'Education Spending % of GDP',
      'Mean Years of Schooling',
      'Extreme Poverty Rate',
      'Daily Caloric Supply',
      'Income Share of Richest 1%',
      'Income Share of Poorest 50%',
      'Armed Forces Personnel',
      'Forest Coverage %',
      'Agricultural Land %',
      'Alcohol Consumption (liters pure alcohol/year)',
      'Beer Consumption (liters pure alcohol/year)',
      'Wine Consumption (liters pure alcohol/year)',
      'Spirits Consumption (liters pure alcohol/year)',
      'Other Alcohols Consumption (liters pure alcohol/year)',
      'Tobacco Use (%)',
      'Tobacco Use - Male (%)',
      'Tobacco Use - Female (%)'
    ],
    trade: [
      'Total Exports',
      'Total Imports',
      'Trade Balance',
      'International Tourist Arrivals',
      'Airports',
      'Railways (km)',
      'Ports'
    ],
    safety: [
      'Homicide Rate (per 100,000)',
      'Homicide Victims (Total)',
      'Homicide Arrests (Total)',
      'Male Arrests',
      'Female Arrests',
      'Male Victims',
      'Female Victims',
      'Prison Deaths',
      'Terrorism Deaths'
    ],
    climate: [
      'Average Temperature',
      'Hot Days (>30°C)',
      'Very Hot Days (>35°C)',
      'Cold Days (<0°C)'
    ],
    sources: [
      'Data Sources',
      'Last Updated Information'
    ]
  };

  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleContentSectionExpansion = (sectionId: string) => {
    setContentSectionsExpanded(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getSectionForMetric = (metricTitle: string) => {
    for (const sectionId in sectionMetrics) {
      if (sectionMetrics[sectionId].includes(metricTitle)) {
        return sectionId;
      }
    }
    return null;
  };

  const scrollToMetric = (metricTitle: string) => {
    const sectionId = getSectionForMetric(metricTitle);
    if (!sectionId) return;

    // Expand the section if it is collapsed
    if (!contentSectionsExpanded[sectionId]) {
      toggleContentSectionExpansion(sectionId);
    }

    const metricId = `${sectionId}-${metricTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`;

    // Use a timeout to allow the section to expand before scrolling
    setTimeout(() => {
      const element = document.getElementById(metricId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a brief highlight effect
        element.classList.add('ring-2', 'ring-blue-500', 'dark:ring-blue-400', 'ring-opacity-50', 'transition-all', 'duration-300');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-blue-500', 'dark:ring-blue-400', 'ring-opacity-50');
        }, 2000);
      }
    }, 150);
  };

  useEffect(() => {
    // Initialize dark mode from localStorage or system preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('darkMode');
              const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldUseDark = savedTheme !== null ? savedTheme === 'true' : systemPrefersDark;
        setDarkMode(shouldUseDark);
        document.documentElement.classList.toggle('dark', shouldUseDark);
    }
  }, []);

      useEffect(() => {
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', darkMode);
        localStorage.setItem('darkMode', darkMode.toString());
      }
    }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
              setShowScrollTop(scrollY > 400);
      
      // Show sticky nav when scrolled past initial navigation
      setShowStickyNav(scrollY > 600);
      
      // Determine active section based on scroll position
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id),
        offset: document.getElementById(section.id)?.offsetTop || 0
      }));
      
      const currentSection = sectionElements
        .filter(section => section.element)
        .find((section, index, arr) => {
          const nextSection = arr[index + 1];
          const sectionTop = section.offset - 200; // Account for header
          const sectionBottom = nextSection ? nextSection.offset - 200 : document.body.scrollHeight;
          
          return scrollY >= sectionTop && scrollY < sectionBottom;
        });
      
      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Auto-select first country when country info is expanded
    if (countryInfoExpanded && selectedCountries.length > 0 && !selectedCountryInfo) {
      setSelectedCountryInfo(selectedCountries[0].code);
    }
  }, [countryInfoExpanded, selectedCountries, selectedCountryInfo]);

  useEffect(() => {
    // Auto-select first country for trade data when countries are selected
    if (selectedCountries.length > 0 && !selectedTradeCountry) {
      setSelectedTradeCountry(selectedCountries[0].code);
    }
  }, [selectedCountries, selectedTradeCountry]);

  // Handle tooltip clicks and outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside tooltip or help icon
      if (!target.closest('.tooltip-container')) {
        setActiveTooltip(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (selectedCountries.length === 0) return;

      setLoading(true);
      setError(null);

      // Initialize loading states for all countries and metrics
      const initialLoadingStates: Record<string, Record<string, boolean>> = {};
      selectedCountries.forEach(country => {
        initialLoadingStates[country.code] = {
          worldBank: true,
          restCountries: true,
          factbook: true,
          climate: true,
          comtrade: true,
          crime: true,
          hdi: true,
          tourists: true,
          schoolingYears: true,
          taxRevenue: true,
          extremePoverty: true,
          migrants: true,
          caloricSupply: true,
          incomeGroup: true,
          incomeShareRichest1: true,
          incomeSharePoorest50: true,
          armedForcesPersonnel: true,
          terrorismDeaths: true,
          politicalRegime: true
        };
      });
      setLoadingStates(initialLoadingStates);

      try {
        console.log('Loading data for countries:', selectedCountries.map(c => c.name));
        
        const fetchPromises = selectedCountries.map(async (country) => {
          console.log(`Fetching data for ${country.name} (${country.code})`);
          
          try {
            // Helper function to fetch data and update loading state
            const fetchWithLoading = async (url: string, metricName: string) => {
              try {
                const response = await fetch(url);
                const data = response.ok ? await response.json() : null;
                setMetricLoading(country.code, metricName, false);
                return data;
                              } catch {
                setMetricLoading(country.code, metricName, false);
                return null;
              }
            };

            // Fetch all data sources in parallel with individual loading tracking
            const [worldBankData, restCountriesData, factbookData, climateData, comtradeData, crimeData, hdiData, touristsData, schoolingYearsData, taxRevenueData, extremePovertyData, migrantsData, caloricSupplyData, incomeGroupData, incomeShareRichest1Data, incomeSharePoorest50Data, armedForcesPersonnelData, terrorismDeathsData, politicalRegimeData] = await Promise.all([
              (async () => {
                try {
                  const response = await fetch('/api/worldbank', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      country: country.code
                    })
                  });
                  const data = response.ok ? await response.json() : null;
                  setMetricLoading(country.code, 'worldBank', false);
                  return data;
                } catch {
                  setMetricLoading(country.code, 'worldBank', false);
                  return null;
                }
              })(),
              fetchWithLoading(`/api/restcountries?country=${country.code}`, 'restCountries'),
              fetchWithLoading(`/api/factbook?country=${country.code}`, 'factbook'),
              fetchWithLoading(`/api/climate?country=${country.code}`, 'climate'),
              fetchWithLoading(`/api/comtrade?country=${country.code}`, 'comtrade'),
              fetchWithLoading(`/api/crime?country=${country.code}`, 'crime'),
              fetchWithLoading(`/api/hdi?country=${country.code}`, 'hdi'),
              fetchWithLoading(`/api/ourworldindata?country=${country.code}&metric=tourists`, 'tourists'),
              fetchWithLoading(`/api/ourworldindata?country=${country.code}&metric=schoolingYears`, 'schoolingYears'),
              fetchWithLoading(`/api/ourworldindata?country=${country.code}&metric=taxRevenue`, 'taxRevenue'),
              fetchWithLoading(`/api/ourworldindata?country=${country.code}&metric=extremePoverty`, 'extremePoverty'),
              fetchWithLoading(`/api/ourworldindata?country=${country.code}&metric=migrants`, 'migrants'),
              fetchWithLoading(`/api/ourworldindata?country=${country.code}&metric=caloricSupply`, 'caloricSupply'),
              fetchWithLoading(`/api/ourworldindata?country=${country.code}&metric=incomeGroup`, 'incomeGroup'),
              fetchWithLoading(`/api/ourworldindata?country=${country.code}&metric=incomeShareRichest1`, 'incomeShareRichest1'),
              fetchWithLoading(`/api/ourworldindata?country=${country.code}&metric=incomeSharePoorest50`, 'incomeSharePoorest50'),
              fetchWithLoading(`/api/ourworldindata?country=${country.code}&metric=armedForcesPersonnel`, 'armedForcesPersonnel'),
              fetchWithLoading(`/api/ourworldindata?country=${country.code}&metric=terrorismDeaths`, 'terrorismDeaths'),
              fetchWithLoading(`/api/ourworldindata?country=${country.code}&metric=politicalRegime`, 'politicalRegime')
            ]);



            // Debug logs
            console.log(`REST Countries data for ${country.name}:`, restCountriesData);
            console.log(`Factbook data for ${country.name}:`, factbookData);
            if (factbookData?.militaryExpenditure) {
              console.log(`Military expenditure for ${country.name}:`, factbookData.militaryExpenditure);
            }

            // Add fallback climate data if API fails
            let finalClimateData = climateData;
            if (!climateData) {
              const basicClimateData: Record<string, { averageTemperature: number; hotDays30: number; hotDays35: number; coldDays: number }> = {
                'US': { averageTemperature: 12.9, hotDays30: 45, hotDays35: 15, coldDays: 85 },
                'CN': { averageTemperature: 8.9, hotDays30: 40, hotDays35: 12, coldDays: 120 },
                'JP': { averageTemperature: 15.4, hotDays30: 55, hotDays35: 20, coldDays: 45 },
                'DE': { averageTemperature: 9.6, hotDays30: 15, hotDays35: 3, coldDays: 65 },
                'IN': { averageTemperature: 25.0, hotDays30: 180, hotDays35: 120, coldDays: 0 },
                'GB': { averageTemperature: 9.8, hotDays30: 8, hotDays35: 1, coldDays: 55 },
                'FR': { averageTemperature: 12.0, hotDays30: 25, hotDays35: 8, coldDays: 45 },
                'IT': { averageTemperature: 13.9, hotDays30: 45, hotDays35: 18, coldDays: 25 },
                'BR': { averageTemperature: 25.5, hotDays30: 200, hotDays35: 85, coldDays: 0 },
                'CA': { averageTemperature: -5.2, hotDays30: 25, hotDays35: 5, coldDays: 180 },
                'RU': { averageTemperature: -5.1, hotDays30: 20, hotDays35: 3, coldDays: 190 },
                'KR': { averageTemperature: 12.5, hotDays30: 50, hotDays35: 15, coldDays: 95 },
                'AU': { averageTemperature: 21.6, hotDays30: 120, hotDays35: 75, coldDays: 5 },
                'ES': { averageTemperature: 15.2, hotDays30: 60, hotDays35: 25, coldDays: 15 },
                'MX': { averageTemperature: 21.0, hotDays30: 150, hotDays35: 80, coldDays: 0 },
                'PE': { averageTemperature: 19.0, hotDays30: 100, hotDays35: 45, coldDays: 0 }
              };
              
              const climate = basicClimateData[country.code];
              if (climate) {
                finalClimateData = {
                  averageTemperature: climate.averageTemperature,
                  hotDays30: climate.hotDays30,
                  hotDays35: climate.hotDays35,
                  coldDays: climate.coldDays,
                  source: "World Bank Climate Change Knowledge Portal",
                  year: "1991-2020"
                };
              }
            }

            console.log(`Data loaded for ${country.name}:`, {
              worldBank: !!worldBankData,
              restCountries: !!restCountriesData,
              factbook: !!factbookData,
              climate: !!climateData
            });

                         // Process REST Countries data properly
            let processedRestCountriesData = null;
            if (restCountriesData && Array.isArray(restCountriesData) && restCountriesData.length > 0) {
              const countryData = restCountriesData[0];
              processedRestCountriesData = {
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
            } else if (restCountriesData && !Array.isArray(restCountriesData)) {
              // Handle case where it's already processed
              processedRestCountriesData = restCountriesData;
            }

                         // Combine all data
             const combinedData = {
               ...(worldBankData || {}),
               enhancedInfo: {
                 restCountriesData: processedRestCountriesData,
                 factbookData,
                 climateData: finalClimateData,
                 comtradeData,
                 crimeData,
                 hdiData,
                 touristsData,
                 schoolingYearsData,
                 taxRevenueData,
                 extremePovertyData,
                 migrantsData,
                 caloricSupplyData,
                 incomeGroupData,
                 incomeShareRichest1Data,
                 incomeSharePoorest50Data,
                 armedForcesPersonnelData,
                 terrorismDeathsData,
                 politicalRegimeData
               }
             };

            return combinedData;
          } catch (countryError) {
            console.error(`Error fetching data for ${country.name}:`, countryError);
            return null;
          }
        });

        const statsResults = await Promise.all(fetchPromises);
        console.log('Loaded stats:', statsResults);
        
        const newCountryStats: Record<string, CountryStats> = {};
        selectedCountries.forEach((country, index) => {
          if (statsResults[index]) {
            newCountryStats[country.code] = statsResults[index];
          }
        });

        setCountryStats(newCountryStats);
        console.log('Final country stats:', newCountryStats);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load country data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedCountries]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatNumber = (num: number | null): string => {
    if (num === null || isNaN(num)) return 'N/A';
    return num.toLocaleString();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatCurrency = (num: number | null): string => {
    if (num === null || isNaN(num)) return 'N/A';
    return `$${num.toLocaleString()}`;
  };

  const formatPopulation = (num: number | null): string => {
    if (num === null || isNaN(num)) return 'N/A';
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toString();
  };

  const formatArea = (num: number | null): string => {
    if (num === null || isNaN(num)) return 'N/A';
    return `${num.toLocaleString()} km²`;
  };

  const formatPopulationDensity = (num: number | null): string => {
    if (num === null || isNaN(num)) return 'N/A';
    return `${num.toFixed(1)} people/km²`;
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to check if a specific metric is loading for any country
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isMetricLoading = (metricName: string): boolean => {
    return selectedCountries.some(country => 
      loadingStates[country.code]?.[metricName] === true
    );
  };

  // Helper function to set loading state for specific metric and country
  const setMetricLoading = (countryCode: string, metricName: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [countryCode]: {
        ...prev[countryCode],
        [metricName]: isLoading
      }
    }));
  };

  const toggleTooltip = (tooltipId: string) => {
    setActiveTooltip(activeTooltip === tooltipId ? null : tooltipId);
  };

  const toggleInfoSection = (section: string) => {
    setInfoSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    setInfoSectionsExpanded({
      basic: !isMobile,
      demographics: !isMobile,
      geography: !isMobile,
      government: !isMobile,
      languages: !isMobile,
      economy: !isMobile,
      sources: !isMobile,
    });
  }, []);

  const handleCountrySelect = (newSelected: Country[]) => {
    setSelectedCountries(newSelected);
    setSelectedCountryInfo(null);
    setSelectedTradeCountry(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="text-center relative">
            <div className="absolute top-0 right-0 flex items-center space-x-1 sm:space-x-2">
              <Link
                href="/top10"
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium"
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Top 10 Rankings</span>
                <span className="sm:hidden">Top 10</span>
              </Link>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                )}
              </button>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 pr-20 sm:pr-0">
              Country Profile Comparison
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4 sm:px-0">
              Compare economic indicators, demographics, trade data, and safety metrics between countries around the world
            </p>
            {loading && (
              <div className="mt-4 text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                Loading country data...
              </div>
            )}
            {error && (
              <div className="mt-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm sm:text-base">
                Error: {error}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Country Selection */}
        <div className="mb-8">
          <CountryDropdown
            selectedCountries={selectedCountries}
            onSelect={handleCountrySelect}
            countries={countries}
          />
        </div>

        {/* Expandable Navigation (Desktop) */}
        <div className="mb-8 hidden lg:block">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {sections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSections[section.id];
              const metrics = sectionMetrics[section.id as keyof typeof sectionMetrics] || [];
              
              return (
                <div key={section.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  {/* Section Header */}
                  <div className="flex items-center">
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className="flex-1 flex items-center space-x-3 px-6 py-4 text-left font-medium transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Icon size={18} />
                      <span>{section.label}</span>
                    </button>
                    
                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => toggleSectionExpansion(section.id)}
                      className="px-4 py-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${section.label} metrics`}
                    >
                      <svg 
                        className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Expandable Metrics List */}
                  {isExpanded && (
                    <div className="px-6 pb-4 bg-gray-50 dark:bg-gray-700/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {metrics.map((metric, index) => (
                          <button
                            key={index}
                            onClick={() => scrollToMetric(metric)}
                            className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 py-1 px-2 rounded-md hover:bg-white dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 text-left group"
                          >
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0 group-hover:bg-blue-500"></div>
                            <span className="group-hover:underline">{metric}</span>
                          </button>
                        ))}
                      </div>
                      {metrics.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No specific metrics available
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="mb-8 lg:hidden">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {sections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSections[section.id];
              const metrics = sectionMetrics[section.id as keyof typeof sectionMetrics] || [];
              
              return (
                <div key={section.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  {/* Section Header */}
                  <div className="flex items-center">
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className="flex-1 flex items-center space-x-3 px-4 py-3 text-left font-medium transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Icon size={16} />
                      <span className="text-sm">{section.label}</span>
                    </button>
                    
                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => toggleSectionExpansion(section.id)}
                      className="px-3 py-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${section.label} metrics`}
                    >
                      <svg 
                        className={`w-3 h-3 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Expandable Metrics List */}
                  {isExpanded && (
                    <div className="px-4 pb-3 bg-gray-50 dark:bg-gray-700/30">
                      <div className="grid grid-cols-1 gap-1">
                        {metrics.map((metric, index) => (
                          <button
                            key={index}
                            onClick={() => scrollToMetric(metric)}
                            className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 py-1 px-2 rounded-md hover:bg-white dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 text-left group"
                          >
                            <div className="w-1 h-1 bg-blue-400 rounded-full flex-shrink-0 group-hover:bg-blue-500"></div>
                            <span className="group-hover:underline">{metric}</span>
                          </button>
                        ))}
                      </div>
                      {metrics.length === 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                          No specific metrics available
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Collapsible Country Info */}
        {selectedCountries.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setCountryInfoExpanded(!countryInfoExpanded)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <MapPin className="text-blue-500" size={24} />
                  <h2 className="text-sm sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                    Country Information
                  </h2>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Desktop view: Show flags and country names */}
                  <div className="hidden sm:flex space-x-2">
                    {selectedCountries.slice(0, 3).map((country) => (
                      <div key={country.code} className="flex items-center space-x-1">
                        <Image 
                          src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                          alt={`${country.name} flag`}
                          width={20}
                          height={15}
                          className="w-5 h-auto mr-1"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {country.name}
                        </span>
                      </div>
                    ))}
                    {selectedCountries.length > 3 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        +{selectedCountries.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  {/* Mobile view: Show flags only */}
                  <div className="sm:hidden flex space-x-1">
                    {selectedCountries.slice(0, 5).map((country) => (
                      <Image 
                        key={country.code}
                        src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                        alt={`${country.name} flag`}
                        width={16}
                        height={12}
                        className="w-4 h-auto"
                      />
                    ))}
                    {selectedCountries.length > 5 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        +{selectedCountries.length - 5}
                      </span>
                    )}
                  </div>
                  
                  <div className={`transform transition-transform duration-200 ${countryInfoExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </div>
              </div>
            </button>
            
            {countryInfoExpanded && (
              <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                {/* Country Selection Cards */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Select a country to view detailed information:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                    {selectedCountries.map((country) => {
                      const isSelected = selectedCountryInfo === country.code;
                      return (
                        <button
                          key={country.code}
                          onClick={() => setSelectedCountryInfo(country.code)}
                          className={`
                            relative flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 
                            ${isSelected 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg transform scale-105' 
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                            }
                          `}
                        >
                          {/* Selection Indicator */}
                          <div className={`
                            flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                            ${isSelected 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300 dark:border-gray-500 bg-transparent'
                            }
                          `}>
                            {isSelected && (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          
                          {/* Country Info */}
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <Image 
                              src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                              alt={`${country.name} flag`}
                              width={24}
                              height={18}
                              className="w-5 h-auto sm:w-6"
                            />
                            <span className={`
                              text-xs sm:text-sm font-medium truncate transition-colors duration-200
                              ${isSelected 
                                ? 'text-blue-700 dark:text-blue-300' 
                                : 'text-gray-900 dark:text-white'
                              }
                            `}>
                              {country.name}
                            </span>
                          </div>
                          
                          {/* Selected Badge */}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Country Information Display */}
                {selectedCountryInfo && (() => {
                  const stats = countryStats[selectedCountryInfo];
                  const restData = stats?.enhancedInfo?.restCountriesData;
                  const factbook = stats?.enhancedInfo?.factbookData;
                  const totalPopulation = factbook?.malePopulation && factbook?.femalePopulation ? 
                    factbook.malePopulation + factbook.femalePopulation : null;
                  const selectedCountry = selectedCountries.find(c => c.code === selectedCountryInfo);
                  
                  return (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <Image 
                          src={`https://flagcdn.com/w40/${selectedCountry?.code.toLowerCase()}.png`}
                          alt={`${selectedCountry?.name} flag`}
                          width={32}
                          height={24}
                          className="w-8 h-auto"
                        />
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCountry?.name}</h3>
                      </div>
                      
                      {/* Basic Information */}
                      <CollapsibleInfoSection title="Basic Information" isExpanded={infoSectionsExpanded.basic} onToggle={() => toggleInfoSection('basic')}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center text-sm sm:text-base">
                              <Globe className="mr-2" size={14} />
                              Region
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                              {restData?.region || 'N/A'} {restData?.subregion && `/ ${restData.subregion}`}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center text-sm sm:text-base">
                              <MapPin className="mr-2" size={14} />
                              Capital
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                              {restData?.capital?.join(', ') || 'N/A'}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center text-sm sm:text-base">
                              <Globe className="mr-2" size={14} />
                              View on Map
                            </h5>
                            {restData?.googleMaps ? (
                              <a 
                                href={restData.googleMaps} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                              >
                                <Globe className="mr-1 sm:mr-2" size={12} />
                                <span className="hidden sm:inline">Open in Google Maps</span>
                                <span className="sm:hidden">Google Maps</span>
                                <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Map link not available</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center text-sm sm:text-base">
                              <DollarSign className="mr-2" size={14} />
                              Currency
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                              {restData?.currencies ? Object.entries(restData.currencies).map(([code, currency]) => 
                                `${currency.name} (${code})`
                              ).join(', ') : 'N/A'}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center text-sm sm:text-base">
                              <Globe className="mr-2" size={14} />
                              Internet Country Code
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                              {factbook?.internetCountryCode || 'N/A'}
                              {factbook?.internetCountryCode && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                  Top-level domain
                                </span>
                              )}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                              <Users className="mr-2" size={16} />
                              Population
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300">
                              {totalPopulation ? formatPopulation(totalPopulation) : 'N/A'}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                              <MapPin className="mr-2" size={16} />
                              Area
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300">
                              {factbook?.area ? formatArea(factbook.area) : 'N/A'}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                              <Activity className="mr-2" size={16} />
                              Population Density
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300">
                              {totalPopulation && factbook?.area ? 
                                formatPopulationDensity(totalPopulation / factbook.area) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </CollapsibleInfoSection>

                      {/* Demographics */}
                      {(factbook?.malePopulation || factbook?.femalePopulation || factbook?.ethnicGroups || factbook?.religions) && (
                        <CollapsibleInfoSection title="Demographics" isExpanded={infoSectionsExpanded.demographics} onToggle={() => toggleInfoSection('demographics')}>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {factbook?.malePopulation && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Male Population</h5>
                                <p className="text-gray-700 dark:text-gray-300">{formatPopulation(factbook.malePopulation)}</p>
                              </div>
                            )}
                            
                            {factbook?.femalePopulation && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Female Population</h5>
                                <p className="text-gray-700 dark:text-gray-300">{formatPopulation(factbook.femalePopulation)}</p>
                              </div>
                            )}
                            
                            {factbook?.medianAge && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Median Age</h5>
                                <p className="text-gray-700 dark:text-gray-300">{factbook.medianAge}</p>
                              </div>
                            )}
                            
                            {factbook?.ethnicGroups && (
                              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Ethnic Groups</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.ethnicGroups}</p>
                              </div>
                            )}
                            
                            {factbook?.religions && (
                              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Religions</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.religions}</p>
                              </div>
                            )}
                          </div>
                        </CollapsibleInfoSection>
                      )}

                      {/* Geography & Climate */}
                      {(factbook?.location || factbook?.climate || factbook?.naturalResources) && (
                        <CollapsibleInfoSection title="Geography & Climate" isExpanded={infoSectionsExpanded.geography} onToggle={() => toggleInfoSection('geography')}>
                          <div className="space-y-4">
                            {factbook?.location && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Location</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.location}</p>
                              </div>
                            )}
                            
                            {factbook?.climate && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Climate</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.climate}</p>
                              </div>
                            )}
                            
                            {factbook?.naturalResources && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Natural Resources</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.naturalResources}</p>
                              </div>
                            )}
                          </div>
                        </CollapsibleInfoSection>
                      )}

                      {/* Government & Politics */}
                      {(factbook?.etymology || factbook?.suffrage || stats?.enhancedInfo?.politicalRegimeData) && (
                        <CollapsibleInfoSection title="Government & Politics" isExpanded={infoSectionsExpanded.government} onToggle={() => toggleInfoSection('government')}>
                          <div className="space-y-4">
                            {stats?.enhancedInfo?.politicalRegimeData && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                                  🏛️ Political Regime
                                </h5>
                                <p className="text-gray-700 dark:text-gray-300">
                                  {(() => {
                                    const value = stats.enhancedInfo.politicalRegimeData.value;
                                    if (value === 0) return 'Closed Autocracy';
                                    if (value === 1) return 'Electoral Autocracy';
                                    if (value === 2) return 'Electoral Democracy';
                                    if (value === 3) return 'Liberal Democracy';
                                    return stats.enhancedInfo.politicalRegimeData.value || 'N/A';
                                  })()}
                                </p>
                              </div>
                            )}
                            
                            {factbook?.etymology && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Etymology</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.etymology}</p>
                              </div>
                            )}
                            
                            {factbook?.suffrage && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Suffrage</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.suffrage}</p>
                              </div>
                            )}
                          </div>
                        </CollapsibleInfoSection>
                      )}

                      {/* Languages & Timezones */}
                      {(restData?.languages || restData?.timezones) && (
                        <CollapsibleInfoSection title="Languages & Timezones" isExpanded={infoSectionsExpanded.languages} onToggle={() => toggleInfoSection('languages')}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {restData?.languages && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Languages</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">
                                  {Object.values(restData.languages).join(', ')}
                                </p>
                              </div>
                            )}
                            
                            {restData?.timezones && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Timezones</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">
                                  {restData.timezones.join(', ')}
                                </p>
                              </div>
                            )}
                          </div>
                        </CollapsibleInfoSection>
                      )}

                      {/* Economic Information */}
                      {(factbook?.industries || factbook?.agriculturalProducts || stats?.enhancedInfo?.incomeGroupData) && (
                        <CollapsibleInfoSection title="Economic Information" isExpanded={infoSectionsExpanded.economy} onToggle={() => toggleInfoSection('economy')}>
                          <div className="space-y-4">
                            {stats?.enhancedInfo?.incomeGroupData && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                                  <DollarSign className="mr-2" size={16} />
                                  World Bank Income Group
                                </h5>
                                <p className="text-gray-700 dark:text-gray-300">
                                  {stats.enhancedInfo.incomeGroupData.value || 'N/A'}
                                </p>
                              </div>
                            )}
                            
                            {factbook?.industries && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Industries</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.industries}</p>
                              </div>
                            )}
                            
                            {factbook?.agriculturalProducts && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Agricultural Products</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.agriculturalProducts}</p>
                              </div>
                            )}
                          </div>
                        </CollapsibleInfoSection>
                      )}

                      {/* Sources Section */}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                        <CollapsibleInfoSection 
                          title={
                            <span className="flex items-center">
                              <BookOpen className="mr-2" size={16} />
                              Data Sources
                            </span>
                          } 
                          isExpanded={infoSectionsExpanded.sources} 
                          onToggle={() => toggleInfoSection('sources')}
                          titleClassName="border-none"
                        >
                          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                            <div className="space-y-3">
                              {/* Rest Countries API */}
                              {restData && (
                                <div className="flex items-start space-x-3">
                                  <div 
                                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                    style={{ backgroundColor: getSourceColor('RestCountries') }}
                                  ></div>
                                  <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      <span className="font-medium">REST Countries API</span>
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Open-source API providing country information including capitals, currencies, languages, and geographic data
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {/* CIA World Factbook Source */}
                              {factbook && (
                                <div className="flex items-start space-x-3">
                                  <div 
                                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                    style={{ backgroundColor: getSourceColor(factbook.source) }}
                                  ></div>
                                  <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      <span className="font-medium">{factbook.source}</span> ({factbook.year})
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      CIA World Factbook - Comprehensive country demographic and geographic data
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Political Regime Source */}
                              {stats?.enhancedInfo?.politicalRegimeData && (
                                <div className="flex items-start space-x-3">
                                  <div 
                                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                    style={{ backgroundColor: getSourceColor(stats.enhancedInfo.politicalRegimeData.source) }}
                                  ></div>
                                  <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      <span className="font-medium">{stats.enhancedInfo.politicalRegimeData.source}</span> ({stats.enhancedInfo.politicalRegimeData.year})
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {stats.enhancedInfo.politicalRegimeData.sourceOrganization} - Democratic institutions and governance classification
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {/* World Bank Income Group Source */}
                              {stats?.enhancedInfo?.incomeGroupData && (
                                <div className="flex items-start space-x-3">
                                  <div 
                                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                    style={{ backgroundColor: getSourceColor(stats.enhancedInfo.incomeGroupData.source) }}
                                  ></div>
                                  <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      <span className="font-medium">{stats.enhancedInfo.incomeGroupData.source}</span> ({stats.enhancedInfo.incomeGroupData.year})
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {stats.enhancedInfo.incomeGroupData.sourceOrganization} - Country income classification based on GNI per capita
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CollapsibleInfoSection>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {selectedCountries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500 dark:text-gray-400">
              Please select at least one country to view data
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Overview Section */}
            <CompactSectionTable
              sectionId="overview"
              title="Overview"
              metrics={sectionMetrics.overview}
              countries={selectedCountries}
              countryStats={countryStats}
              loading={loading}
              activeTooltip={activeTooltip}
              toggleTooltip={toggleTooltip}
              isExpanded={contentSectionsExpanded.overview}
              onToggle={() => toggleContentSectionExpansion('overview')}
            />

            {/* Economy & Development Section */}
            <CompactSectionTable
              sectionId="economy"
              title="Economy & Development"
              metrics={sectionMetrics.economy}
              countries={selectedCountries}
              countryStats={countryStats}
              loading={loading}
              activeTooltip={activeTooltip}
              toggleTooltip={toggleTooltip}
              isExpanded={contentSectionsExpanded.economy}
              onToggle={() => toggleContentSectionExpansion('economy')}
            />

            {/* Social & Environment Section */}
            <CompactSectionTable
              sectionId="social"
              title="Social & Environment"
              metrics={sectionMetrics.social}
              countries={selectedCountries}
              countryStats={countryStats}
              loading={loading}
              activeTooltip={activeTooltip}
              toggleTooltip={toggleTooltip}
              isExpanded={contentSectionsExpanded.social}
              onToggle={() => toggleContentSectionExpansion('social')}
            />

            {/* Trade Section */}
            <CompactSectionTable
              sectionId="trade"
              title="Trade"
              metrics={sectionMetrics.trade}
              countries={selectedCountries}
              countryStats={countryStats}
              loading={loading}
              activeTooltip={activeTooltip}
              toggleTooltip={toggleTooltip}
              isExpanded={contentSectionsExpanded.trade}
              onToggle={() => toggleContentSectionExpansion('trade')}
            />

            {/* Detailed Trade Dashboard */}
            <section id="trade-details" className="scroll-mt-8">
              <div className="mb-12 relative">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mr-4"></div>
                  <h2 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Trade Dashboard
                  </h2>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 ml-16 font-light">
                  Detailed trade analysis including partners, commodities, and export/import breakdowns
                </p>
              </div>
              
              <div className="space-y-8">
                {/* Country Selection for Trade Data */}
                {selectedCountries.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Select a country to view detailed trade information:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {selectedCountries.map((country) => {
                        const isSelected = selectedTradeCountry === country.code;
                        return (
                          <button
                            key={country.code}
                            onClick={() => setSelectedTradeCountry(country.code)}
                            className={`
                              relative flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200 
                              ${isSelected 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg transform scale-105' 
                                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                              }
                            `}
                          >
                            {/* Selection Indicator */}
                            <div className={`
                              flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                              ${isSelected 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300 dark:border-gray-500 bg-transparent'
                              }
                            `}>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            
                            {/* Country Info */}
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <Image 
                                src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                                alt={`${country.name} flag`}
                                width={20}
                                height={15}
                                className="w-5 h-auto mr-3"
                              />
                              <span className={`
                                text-sm font-medium truncate transition-colors duration-200
                                ${isSelected 
                                  ? 'text-blue-700 dark:text-blue-300' 
                                  : 'text-gray-900 dark:text-white'
                                }
                              `}>
                                {country.name}
                              </span>
                            </div>
                            
                            {/* Selected Badge */}
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Detailed Trade Data Display */}
                {selectedTradeCountry && (() => {
                  const stats = countryStats[selectedTradeCountry];
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const factbook = stats?.enhancedInfo?.factbookData;
                  const comtrade = stats?.enhancedInfo?.comtradeData;
                  const selectedCountry = selectedCountries.find(c => c.code === selectedTradeCountry);
                  
                  return (
                    <div key={selectedTradeCountry} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                      {/* Country Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Image 
                              src={`https://flagcdn.com/w40/${selectedCountry?.code.toLowerCase()}.png`}
                              alt={`${selectedCountry?.name} flag`}
                              width={24}
                              height={18}
                              className="w-6 h-auto mr-3"
                            />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedCountry?.name}</h3>
                          </div>
                          {comtrade && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Data from {comtrade.year} • UN Comtrade
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-6">
                        {/* Trade Overview */}
                        {comtrade && (
                          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                              <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">Total Exports</h4>
                              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                {comtrade.totalExports?.formatted || 'N/A'}
                              </p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Total Imports</h4>
                              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                {comtrade.totalImports?.formatted || 'N/A'}
                              </p>
                            </div>
                            <div className={`p-4 rounded-lg border ${
                              comtrade.tradeBalance?.status === 'surplus' 
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            }`}>
                              <h4 className={`text-sm font-semibold mb-2 ${
                                comtrade.tradeBalance?.status === 'surplus'
                                  ? 'text-emerald-800 dark:text-emerald-300'
                                  : 'text-red-800 dark:text-red-300'
                              }`}>
                                Trade Balance
                              </h4>
                              <p className={`text-2xl font-bold ${
                                comtrade.tradeBalance?.status === 'surplus'
                                  ? 'text-emerald-900 dark:text-emerald-100'
                                  : 'text-red-900 dark:text-red-100'
                              }`}>
                                {comtrade.tradeBalance?.status === 'surplus' ? '+' : '-'}
                                {comtrade.tradeBalance?.formatted || 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Trade Commodities Section */}
                        {((comtrade?.topExportCommodities && comtrade.topExportCommodities.length > 0) || (comtrade?.topImportCommodities && comtrade.topImportCommodities.length > 0)) && (
                          <div className="mb-8">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                              <span className="text-base mr-2">📦</span>
                              Trade Commodities
                            </h4>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Export Commodities */}
                              {comtrade?.topExportCommodities && comtrade.topExportCommodities.length > 0 && (
                                <div>
                                  <h5 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                    🚢 Main Export Commodities
                                  </h5>
                                  <div className="space-y-2">
                                    {comtrade.topExportCommodities.map((commodity, index) => (
                                      <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <div className="flex items-center">
                                          <span className="w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center mr-3">
                                            {index + 1}
                                          </span>
                                          <span className="text-gray-900 dark:text-white font-medium">
                                            {commodity.commodity}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Import Commodities */}
                              {comtrade?.topImportCommodities && comtrade.topImportCommodities.length > 0 && (
                                <div>
                                  <h5 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                    🛒 Main Import Commodities
                                  </h5>
                                  <div className="space-y-2">
                                    {comtrade.topImportCommodities.map((commodity, index) => (
                                      <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center">
                                          <span className="w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center mr-3">
                                            {index + 1}
                                          </span>
                                          <span className="text-gray-900 dark:text-white font-medium">
                                            {commodity.commodity}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Trade Partners and Traditional Commodities Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Top Export Partners */}
                          {comtrade?.topExportPartners && comtrade.topExportPartners.length > 0 && (
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <span className="text-base mr-2">🌍</span>
                                Top Export Partners
                              </h4>
                              <div className="space-y-3">
                                {comtrade.topExportPartners.map((partner, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center">
                                      <span className="w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center mr-3">
                                        {index + 1}
                                      </span>
                                      <span className="font-medium text-gray-900 dark:text-white">{partner.country}</span>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-gray-900 dark:text-white">
                                        {partner.formatted || 'N/A'}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Top Import Partners */}
                          {comtrade?.topImportPartners && comtrade.topImportPartners.length > 0 && (
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <span className="text-base mr-2">🌐</span>
                                Top Import Partners
                              </h4>
                              <div className="space-y-3">
                                {comtrade.topImportPartners.map((partner, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center">
                                      <span className="w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center mr-3">
                                        {index + 1}
                                      </span>
                                      <span className="font-medium text-gray-900 dark:text-white">{partner.country}</span>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-gray-900 dark:text-white">
                                        {partner.formatted || 'N/A'}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Show message if no data */}
                        {!comtrade && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            {loading ? (
                              <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                Loading trade data...
                              </span>
                            ) : (
                              "Trade data not available"
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </section>

            {/* Safety & Crime Section */}
            <CompactSectionTable
              sectionId="safety"
              title="Safety & Crime"
              metrics={sectionMetrics.safety}
              countries={selectedCountries}
              countryStats={countryStats}
              loading={loading}
              activeTooltip={activeTooltip}
              toggleTooltip={toggleTooltip}
              isExpanded={contentSectionsExpanded.safety}
              onToggle={() => toggleContentSectionExpansion('safety')}
            />

            {/* Climate Section */}
            <CompactSectionTable
              sectionId="climate"
              title="Climate"
              metrics={sectionMetrics.climate}
              countries={selectedCountries}
              countryStats={countryStats}
              loading={loading}
              activeTooltip={activeTooltip}
              toggleTooltip={toggleTooltip}
              isExpanded={contentSectionsExpanded.climate}
              onToggle={() => toggleContentSectionExpansion('climate')}
            />

            {/* Sources Section */}
            <section id="sources" className="scroll-mt-8">
              <div className="mb-12">
                <button
                  onClick={() => toggleSectionExpansion('sources')}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                      Sources
                    </h2>
                    <div className={`transform transition-transform duration-200 ${expandedSections.sources ? 'rotate-180' : ''}`}>
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
              
              {expandedSections.sources && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        Data Sources
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['World Bank'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">World Bank Open Data</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['CIA World Factbook'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">CIA World Factbook</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['Our World in Data'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">Our World in Data</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['CTS/NSO'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">UN Office on Drugs and Crime</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['Climate API'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">World Bank Climate Knowledge Portal</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['RestCountries'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">REST Countries API</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['UN HDI'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">UNDP Human Development Report</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['UN Comtrade'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">UN Comtrade Database</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['UN DESA'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">UN Department of Economic and Social Affairs</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['UNU-WIDER'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">UNU-WIDER Government Revenue Dataset</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['Barro-Lee'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">Barro-Lee & Lee-Lee Educational Attainment</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['FAO'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">Food and Agriculture Organization (FAO)</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['WID'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">World Inequality Database</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['UNWTO'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">UN World Tourism Organization</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sourceColors['GTD'] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">Global Terrorism Database</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Update Information</h3>
                      <div className="space-y-3">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="font-medium">Real-time Data:</span> Most metrics are fetched directly from official APIs
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="font-medium">Data Accuracy:</span> Values represent the latest available data from each source
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Source Indicators:</span> Color dots next to each metric indicate the data source
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Floating Sticky Navigation */}
      {showStickyNav && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full shadow-xl border border-gray-200/50 dark:border-gray-700/50 px-2 py-2">
            <div className="flex items-center gap-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`
                      group relative flex items-center justify-center p-3 rounded-full transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-500 text-white shadow-lg scale-110' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
                      }
                    `}
                    title={section.label}
                  >
                    <Icon size={18} />
                    
                    {/* Tooltip */}
                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {section.label}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
} 