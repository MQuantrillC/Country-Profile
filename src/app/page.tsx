'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  HelpCircle
} from 'lucide-react';
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
  giniIndex?: number | null;
  averageHouseholdExpenditure?: string | null;
  
  exports?: number | null;
  exportPartners?: string | null;
  exportCommodities?: string | null;
  imports?: number | null;
  importCommodities?: string | null;
  exchangeRates?: string | null;
  
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
  year: number;
  totalExports: {
    value: number;
    formatted: {
      value: number;
      formatted: string;
      unit: string;
    };
  };
  totalImports: {
    value: number;
    formatted: {
      value: number;
      formatted: string;
      unit: string;
    };
  };
  tradeBalance: {
    value: number;
    formatted: {
      value: number;
      formatted: string;
      unit: string;
    };
    status: 'surplus' | 'deficit';
  };
  topExportPartners: Array<{
    country: string;
    value: number;
    formatted: {
      value: number;
      formatted: string;
      unit: string;
    };
    percentage: string;
  }>;
  topImportPartners: Array<{
    country: string;
    value: number;
    formatted: {
      value: number;
      formatted: string;
      unit: string;
    };
    percentage: string;
  }>;
  source: string;
  sourceOrganization: string;
  lastUpdated: string;
}

interface EnhancedCountryInfo {
  restCountriesData?: RestCountriesData;
  climateData?: ClimateData;
  factbookData?: FactbookData;
  comtradeData?: ComtradeData;
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
  };

  const handleRemoveCountry = (countryCode: string) => {
    onSelect(selectedCountries.filter(c => c.code !== countryCode));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCountries.map((country) => (
            <div key={country.code} className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-2 rounded-lg">
              <span className="mr-2 emoji">{country.flag}</span>
              <span className="text-sm font-medium">{country.name}</span>
              <button onClick={() => handleRemoveCountry(country.code)} className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
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
          }} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
            <span className="text-gray-700 dark:text-gray-300">
              {selectedCountries.length === 0 ? "Select countries to compare (max 5)" : `Add more countries (${selectedCountries.length}/5)`}
            </span>
            <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-600">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            {/* Countries List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country) => {
              const isSelected = selectedCountries.some(c => c.code === country.code);
              const isDisabled = selectedCountries.length >= 5 && !isSelected;
              
              return (
                <button key={country.code} onClick={() => !isDisabled && handleCountryToggle(country)} disabled={isDisabled} className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className="mr-3 text-lg emoji">{country.flag}</span>
                  <span className="text-gray-900 dark:text-white">{country.name}</span>
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
  const titleLower = title.toLowerCase();
  if (titleLower.includes('gdp') || titleLower.includes('economy')) return '💰';
  if (titleLower.includes('population')) return '👥';
  if (titleLower.includes('area')) return '🌍';
  if (titleLower.includes('life') || titleLower.includes('health')) return '❤️';
  if (titleLower.includes('education') || titleLower.includes('literacy')) return '📚';
  if (titleLower.includes('trade') || titleLower.includes('export') || titleLower.includes('import')) return '🚢';
  if (titleLower.includes('climate') || titleLower.includes('temperature') || titleLower.includes('co2')) return '🌡️';
  if (titleLower.includes('forest') || titleLower.includes('environment')) return '🌲';
  if (titleLower.includes('internet') || titleLower.includes('mobile') || titleLower.includes('technology')) return '📱';
  if (titleLower.includes('water') || titleLower.includes('sanitation')) return '💧';
  if (titleLower.includes('energy')) return '⚡';
  if (titleLower.includes('debt') || titleLower.includes('inflation')) return '📊';
  if (titleLower.includes('research') || titleLower.includes('development')) return '🔬';
  if (titleLower.includes('unemployment') || titleLower.includes('employment')) return '💼';
  if (titleLower.includes('homicide') || titleLower.includes('crime') || titleLower.includes('safety')) return '🛡️';
  if (titleLower.includes('urban') || titleLower.includes('rural')) return '🏙️';
  if (titleLower.includes('fertility') || titleLower.includes('birth')) return '👶';
  if (titleLower.includes('migration')) return '🌏';
  if (titleLower.includes('electricity')) return '💡';
  return '📈'; // Default icon
};

// Tooltip definitions for metrics
const getMetricTooltip = (title: string): string => {
  const tooltips: Record<string, string> = {
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
    "Average Temperature": "Mean annual temperature across the country in degrees Celsius",
    "Hot Days (>30°C)": "Average number of days per year with maximum temperature above 30°C (86°F)",
    "Very Hot Days (>35°C)": "Average number of days per year with maximum temperature above 35°C (95°F)",
    "Cold Days (<0°C)": "Average number of days per year with minimum temperature below 0°C (32°F)",
    "Total Exports": "Total value of goods and services exported by the country in US dollars",
    "Total Imports": "Total value of goods and services imported by the country in US dollars",
    "Trade Balance": "Difference between total exports and imports - positive indicates trade surplus, negative indicates trade deficit"
  };
  
  return tooltips[title] || "No description available for this metric";
};

const MetricTable = ({ title, countries, getValue, getSource, formatValue, loading }: {
  title: string;
  countries: Country[];
  getValue: (country: Country) => number | null;
  getSource?: (country: Country) => { source?: string; year?: string; sourceOrganization?: string } | null;
  formatValue: (value: number) => string;
  loading?: boolean;
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

  // Get source info from the first country that has data
  const sourceInfo = getSource ? countries.find(country => getValue(country) !== null) : null;
  const source = sourceInfo && getSource ? getSource(sourceInfo) : null;

  return (
    <div id={`metric-${metricId}`} className="mb-8 scroll-mt-24 transition-all duration-300">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
        <span className="text-base mr-2 opacity-70">{getMetricIcon(title)}</span>
        {title}
        <div className="group relative ml-2">
          <HelpCircle 
            size={16} 
            className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 cursor-help transition-colors duration-200" 
          />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-64 text-center">
            {getMetricTooltip(title)}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
          </div>
        </div>
      </h3>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                Country
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                Value
              </th>
              {showComparison && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
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
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg emoji">{country.flag}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {country.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-sm font-medium ${
                    value !== null ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {loading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
                        Loading...
                      </span>
                    ) : value !== null ? formatValue(value) : "N/A"}
                  </span>
                </td>
                {showComparison && (
                  <td className="px-4 py-4">
                    {value !== null && value > 0 && maxValue > 0 ? (
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-3 max-w-[140px]">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
                            style={{ width: `${Math.max(8, (value / maxValue) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium min-w-[35px] text-right">
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
      
      {/* Source information below the table */}
      {source && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Source:
            </span>
            {source.source && source.year && (
              <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-300 dark:border-gray-600">
                {source.source} ({source.year})
              </span>
            )}
            {source.sourceOrganization && (
              <span className="text-gray-500 dark:text-gray-400">
                • {source.sourceOrganization}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function HomePage() {
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([countries[0]]);
  const [countryStats, setCountryStats] = useState<Record<string, CountryStats>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [countryInfoExpanded, setCountryInfoExpanded] = useState(false);
  const [selectedCountryInfo, setSelectedCountryInfo] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showStickyNav, setShowStickyNav] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Define metrics for each section
  const sectionMetrics = {
    overview: [
      'Total Population',
      'Area',
      'Population Density',
      'Urban Population %',
      'Rural Population %',
      'Fertility Rate',
      'Net Migration Rate'
    ],
    economy: [
      'GDP',
      'GDP Per Capita', 
      'GNI Per Capita',
      'Trade as % of GDP',
      'Unemployment Rate',
      'Public Debt % of GDP',
      'Military Expenditure % of GDP'
    ],
    social: [
      'Life Expectancy',
      'Literacy Rate',
      'Education Spending % of GDP',
      'Internet Users %',
      'Electricity Access %',
      'Forest Coverage %',
      'Agricultural Land %',
      'Alcohol Consumption (Total)',
      'Tobacco Use (Total, Male, Female)',
      'Beer/Wine/Spirits/Other Consumption'
    ],
    trade: [
      'Total Exports',
      'Total Imports',
      'Trade Balance',
      'Export Partners',
      'Import Partners',
      'Export Commodities',
      'Import Commodities'
    ],
    safety: [
      'Homicide Rate'
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

  const scrollToMetric = (metricTitle: string) => {
    const metricId = metricTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const element = document.getElementById(`metric-${metricId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight effect
      element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
      }, 2000);
    }
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
    const loadData = async () => {
      if (selectedCountries.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        console.log('Loading data for countries:', selectedCountries.map(c => c.name));
        
        const fetchPromises = selectedCountries.map(async (country) => {
          console.log(`Fetching data for ${country.name} (${country.code})`);
          
          try {
            // Fetch all data sources in parallel
            const [worldBankResponse, restCountriesResponse, factbookResponse, climateResponse, comtradeResponse] = await Promise.all([
              fetch('/api/worldbank', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  country: country.code
                })
              }),
              fetch(`/api/restcountries?country=${country.code}`),
              fetch(`/api/factbook?country=${country.code}`),
              fetch(`/api/climate?country=${country.code}`),
              fetch(`/api/comtrade?country=${country.code}`)
            ]);

            const [worldBankData, restCountriesData, factbookData, climateData, comtradeData] = await Promise.all([
              worldBankResponse.ok ? worldBankResponse.json() : null,
              restCountriesResponse.ok ? restCountriesResponse.json() : null,
              factbookResponse.ok ? factbookResponse.json() : null,
              climateResponse.ok ? climateResponse.json() : null,
              comtradeResponse.ok ? comtradeResponse.json() : null
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
                 comtradeData
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

  const formatNumber = (num: number | null): string => {
    if (num === null || num === undefined) return "N/A";
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (num: number | null): string => {
    if (num === null || num === undefined) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPopulation = (num: number | null): string => {
    if (num === null || num === undefined) return "N/A";
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatArea = (num: number | null): string => {
    if (num === null || num === undefined) return "N/A";
    return `${num.toLocaleString()} km²`;
  };

  const formatPopulationDensity = (num: number | null): string => {
    if (num === null || num === undefined) return "N/A";
    return `${num.toFixed(1)} people/km²`;
  };

  // Parse alcohol consumption total from string like "total: 8.93 liters of pure alcohol (2019 est.); ..."
  const parseAlcoholConsumption = (text: string | null | undefined): number | null => {
    if (!text) return null;
    const match = text.match(/total:\s*([0-9.]+)\s*liters/i);
    return match ? parseFloat(match[1]) : null;
  };

  // Parse tobacco use total from string like "total: 22.1% (2025 est.); ..."
  const parseTobaccoUse = (text: string | null | undefined): number | null => {
    if (!text) return null;
    const match = text.match(/total:\s*([0-9.]+)%/i);
    return match ? parseFloat(match[1]) : null;
  };

  // Parse tobacco use by gender
  const parseTobaccoUseMale = (text: string | null | undefined): number | null => {
    if (!text) return null;
    const match = text.match(/male:\s*([0-9.]+)%/i);
    return match ? parseFloat(match[1]) : null;
  };

  const parseTobaccoUseFemale = (text: string | null | undefined): number | null => {
    if (!text) return null;
    const match = text.match(/female:\s*([0-9.]+)%/i);
    return match ? parseFloat(match[1]) : null;
  };

  // Parse detailed alcohol consumption by type
  const parseAlcoholBeer = (text: string | null | undefined): number | null => {
    if (!text) return null;
    const match = text.match(/beer:\s*([0-9.]+)\s*liters/i);
    return match ? parseFloat(match[1]) : null;
  };

  const parseAlcoholWine = (text: string | null | undefined): number | null => {
    if (!text) return null;
    const match = text.match(/wine:\s*([0-9.]+)\s*liters/i);
    return match ? parseFloat(match[1]) : null;
  };

  const parseAlcoholSpirits = (text: string | null | undefined): number | null => {
    if (!text) return null;
    const match = text.match(/spirits:\s*([0-9.]+)\s*liters/i);
    return match ? parseFloat(match[1]) : null;
  };

  const parseAlcoholOther = (text: string | null | undefined): number | null => {
    if (!text) return null;
    const match = text.match(/other alcohols?:\s*([0-9.]+)\s*liters/i);
    return match ? parseFloat(match[1]) : null;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center relative">
            <div className="absolute top-0 right-0 flex items-center space-x-2">
              <Link
                href="/top10"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Top 10 Rankings</span>
              </Link>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Country Profile Comparison
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Compare economic indicators, demographics, trade data, and safety metrics between countries around the world
            </p>
            {loading && (
              <div className="mt-4 text-blue-600 dark:text-blue-400">
                Loading country data...
              </div>
            )}
            {error && (
              <div className="mt-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
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
            onSelect={setSelectedCountries}
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
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Country Information
                  </h2>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-2">
                    {selectedCountries.slice(0, 3).map((country) => (
                      <div key={country.code} className="flex items-center space-x-1">
                        <span className="text-xl emoji">{country.flag}</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {selectedCountries.map((country) => {
                      const isSelected = selectedCountryInfo === country.code;
                      return (
                        <button
                          key={country.code}
                          onClick={() => setSelectedCountryInfo(country.code)}
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
                            <span className="text-2xl emoji flex-shrink-0">{country.flag}</span>
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
                        <span className="text-3xl emoji">{selectedCountry?.flag}</span>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCountry?.name}</h3>
                      </div>
                      
                      {/* Basic Information */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                          Basic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                              <Globe className="mr-2" size={16} />
                              Region
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300">
                              {restData?.region || 'N/A'} {restData?.subregion && `/ ${restData.subregion}`}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                              <MapPin className="mr-2" size={16} />
                              Capital
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300">
                              {restData?.capital?.join(', ') || 'N/A'}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                              <Globe className="mr-2" size={16} />
                              View on Map
                            </h5>
                            {restData?.googleMaps ? (
                              <a 
                                href={restData.googleMaps} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                              >
                                <Globe className="mr-2" size={14} />
                                Open in Google Maps
                                <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400 text-sm">Map link not available</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                              <DollarSign className="mr-2" size={16} />
                              Currency
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300">
                              {restData?.currencies ? Object.entries(restData.currencies).map(([code, currency]) => 
                                `${currency.name} (${code})`
                              ).join(', ') : 'N/A'}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                              <Users className="mr-2" size={16} />
                              Population
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300">
                              {totalPopulation ? formatPopulation(totalPopulation) : 'N/A'}
                              <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                Source: {factbook?.source || 'N/A'} ({factbook?.year || 'N/A'})
                              </span>
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                              <MapPin className="mr-2" size={16} />
                              Area
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300">
                              {factbook?.area ? formatArea(factbook.area) : 'N/A'}
                              <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                Source: {factbook?.source || 'N/A'} ({factbook?.year || 'N/A'})
                              </span>
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
                              <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                Source: {factbook?.source || 'N/A'} ({factbook?.year || 'N/A'})
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Demographics */}
                      {(factbook?.malePopulation || factbook?.femalePopulation || factbook?.ethnicGroups || factbook?.religions) && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                            Demographics
                          </h4>
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
                        </div>
                      )}

                      {/* Geography & Climate */}
                      {(factbook?.location || factbook?.climate || factbook?.naturalResources) && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                            Geography & Climate
                          </h4>
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
                        </div>
                      )}

                      {/* Government & Politics */}
                      {(factbook?.etymology || factbook?.suffrage) && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                            Government & Politics
                          </h4>
                          <div className="space-y-4">
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
                        </div>
                      )}

                      {/* Languages & Timezones */}
                      {(restData?.languages || restData?.timezones) && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                            Languages & Timezones
                          </h4>
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
                        </div>
                      )}

                      {/* Economic Information */}
                      {(factbook?.industries || factbook?.agriculturalProducts) && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                            Economic Information
                          </h4>
                          <div className="space-y-4">
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
                        </div>
                      )}
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
            <section id="overview" className="scroll-mt-8">
              <div className="mb-12 relative">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-4"></div>
                  <h2 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Overview
                  </h2>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 ml-16 font-light">
                  Essential demographic and geographic insights
                </p>
              </div>
              
              <div className="space-y-8">
                <MetricTable
                  title="Total Population"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook?.malePopulation && factbook?.femalePopulation ? 
                      factbook.malePopulation + factbook.femalePopulation : null;
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook ? {
                      source: factbook.source,
                      year: factbook.year,
                      sourceOrganization: "CIA World Factbook"
                    } : null;
                  }}
                  formatValue={formatPopulation}
                  loading={loading}
                />

                <MetricTable
                  title="Area"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.enhancedInfo?.factbookData?.area || null;
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook ? {
                      source: factbook.source,
                      year: factbook.year,
                      sourceOrganization: "CIA World Factbook"
                    } : null;
                  }}
                  formatValue={formatArea}
                  loading={loading}
                />

                <MetricTable
                  title="Population Density"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    const totalPopulation = factbook?.malePopulation && factbook?.femalePopulation ? 
                      factbook.malePopulation + factbook.femalePopulation : null;
                    return totalPopulation && factbook?.area ? totalPopulation / factbook.area : null;
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook ? {
                      source: factbook.source,
                      year: factbook.year,
                      sourceOrganization: "CIA World Factbook"
                    } : null;
                  }}
                  formatValue={formatPopulationDensity}
                  loading={loading}
                />

                <MetricTable
                  title="Urban Population %"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.urbanPopPct?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.urbanPopPct ? {
                      source: stats.urbanPopPct.source,
                      year: stats.urbanPopPct.year || undefined,
                      sourceOrganization: stats.urbanPopPct.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />

                <MetricTable
                  title="Rural Population %"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.ruralPopPct?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.ruralPopPct ? {
                      source: stats.ruralPopPct.source,
                      year: stats.ruralPopPct.year || undefined,
                      sourceOrganization: stats.ruralPopPct.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />

                <MetricTable
                  title="Fertility Rate (births per woman)"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.fertilityRate?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.fertilityRate ? {
                      source: stats.fertilityRate.source,
                      year: stats.fertilityRate.year || undefined,
                      sourceOrganization: stats.fertilityRate.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)} births/woman`}
                  loading={loading}
                />

                <MetricTable
                  title="Net Migration Rate (per 1,000 people)"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.enhancedInfo?.factbookData?.netMigrationRate || null;
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook ? {
                      source: factbook.source,
                      year: factbook.year,
                      sourceOrganization: "CIA World Factbook"
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}/1000`}
                  loading={loading}
                />
              </div>
            </section>

            {/* Economy & Development Section */}
            <section id="economy" className="scroll-mt-8">
              <div className="mb-12 relative">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mr-4"></div>
                  <h2 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Economy & Development
                  </h2>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 ml-16 font-light">
                  Financial performance and growth indicators
                </p>
              </div>
              
              <div className="space-y-8">
                <MetricTable
                  title="GDP"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.gdp?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.gdp ? {
                      source: stats.gdp.source,
                      year: stats.gdp.year || undefined,
                      sourceOrganization: stats.gdp.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => formatNumber(value)}
                  loading={loading}
                />

                <MetricTable
                  title="GDP Per Capita"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.gdpPerCapita?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.gdpPerCapita ? {
                      source: stats.gdpPerCapita.source,
                      year: stats.gdpPerCapita.year || undefined,
                      sourceOrganization: stats.gdpPerCapita.sourceOrganization
                    } : null;
                  }}
                  formatValue={formatCurrency}
                  loading={loading}
                />

                <MetricTable
                  title="GNI Per Capita"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.gniPerCapita?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.gniPerCapita ? {
                      source: stats.gniPerCapita.source,
                      year: stats.gniPerCapita.year || undefined,
                      sourceOrganization: stats.gniPerCapita.sourceOrganization
                    } : null;
                  }}
                  formatValue={formatCurrency}
                  loading={loading}
                />

                <MetricTable
                  title="Trade as % of GDP"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.tradeGDP?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.tradeGDP ? {
                      source: stats.tradeGDP.source,
                      year: stats.tradeGDP.year || undefined,
                      sourceOrganization: stats.tradeGDP.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />

                <MetricTable
                  title="Unemployment Rate"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.unemploymentRate?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.unemploymentRate ? {
                      source: stats.unemploymentRate.source,
                      year: stats.unemploymentRate.year || undefined,
                      sourceOrganization: stats.unemploymentRate.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />

                <MetricTable
                  title="Public Debt % of GDP"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.publicDebtGDP?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.publicDebtGDP ? {
                      source: stats.publicDebtGDP.source,
                      year: stats.publicDebtGDP.year || undefined,
                      sourceOrganization: stats.publicDebtGDP.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />

                <MetricTable
                  title="Military Expenditure % of GDP"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.enhancedInfo?.factbookData?.militaryExpenditure || null;
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook ? {
                      source: factbook.source,
                      year: factbook.year,
                      sourceOrganization: "CIA World Factbook"
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />
              </div>
            </section>

            {/* Social & Environment Section */}
            <section id="social" className="scroll-mt-8">
              <div className="mb-12 relative">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full mr-4"></div>
                  <h2 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Social & Environment
                  </h2>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 ml-16 font-light">
                  Quality of life and sustainability metrics
                </p>
              </div>
              
              <div className="space-y-8">
                <MetricTable
                  title="Life Expectancy"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.lifeExpectancy?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.lifeExpectancy ? {
                      source: stats.lifeExpectancy.source,
                      year: stats.lifeExpectancy.year || undefined,
                      sourceOrganization: stats.lifeExpectancy.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)} years`}
                  loading={loading}
                />

                <MetricTable
                  title="Literacy Rate"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook?.literacyRate || stats?.literacyRate?.value || null;
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    if (factbook?.literacyRate) {
                      return {
                        source: factbook.source,
                        year: factbook.year,
                        sourceOrganization: "CIA World Factbook"
                      };
                    } else if (stats?.literacyRate) {
                      return {
                        source: stats.literacyRate.source,
                        year: stats.literacyRate.year || undefined,
                        sourceOrganization: stats.literacyRate.sourceOrganization
                      };
                    }
                    return null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />

                <MetricTable
                  title="Education Spending % of GDP"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.educationSpendPctGDP?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.educationSpendPctGDP ? {
                      source: stats.educationSpendPctGDP.source,
                      year: stats.educationSpendPctGDP.year || undefined,
                      sourceOrganization: stats.educationSpendPctGDP.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />

                <MetricTable
                  title="Internet Users %"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.internetUsers?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.internetUsers ? {
                      source: stats.internetUsers.source,
                      year: stats.internetUsers.year || undefined,
                      sourceOrganization: stats.internetUsers.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />

                <MetricTable
                  title="Electricity Access %"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.electricityAccess?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.electricityAccess ? {
                      source: stats.electricityAccess.source,
                      year: stats.electricityAccess.year || undefined,
                      sourceOrganization: stats.electricityAccess.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />

                <MetricTable
                  title="Forest Coverage %"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.forestPct?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.forestPct ? {
                      source: stats.forestPct.source,
                      year: stats.forestPct.year || undefined,
                      sourceOrganization: stats.forestPct.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />

                <MetricTable
                  title="Agricultural Land %"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.agriculturalLandPct?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.agriculturalLandPct ? {
                      source: stats.agriculturalLandPct.source,
                      year: stats.agriculturalLandPct.year || undefined,
                      sourceOrganization: stats.agriculturalLandPct.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />

                <MetricTable
                  title="Alcohol Consumption (liters pure alcohol/year)"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return parseAlcoholConsumption(factbook?.alcoholConsumption);
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook ? {
                      source: factbook.source,
                      year: factbook.year,
                      sourceOrganization: "CIA World Factbook"
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)} liters`}
                  loading={loading}
                />

                <MetricTable
                  title="Tobacco Use (%)"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return parseTobaccoUse(factbook?.tobaccoUse);
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook ? {
                      source: factbook.source,
                      year: factbook.year,
                      sourceOrganization: "CIA World Factbook"
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />

                <MetricTable
                  title="Tobacco Use - Male (%)"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return parseTobaccoUseMale(factbook?.tobaccoUse);
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook ? {
                      source: factbook.source,
                      year: factbook.year,
                      sourceOrganization: "CIA World Factbook"
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />

                <MetricTable
                  title="Tobacco Use - Female (%)"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return parseTobaccoUseFemale(factbook?.tobaccoUse);
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook ? {
                      source: factbook.source,
                      year: factbook.year,
                      sourceOrganization: "CIA World Factbook"
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  loading={loading}
                />

                <MetricTable
                  title="Beer Consumption (liters pure alcohol/year)"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return parseAlcoholBeer(factbook?.alcoholConsumption);
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook ? {
                      source: factbook.source,
                      year: factbook.year,
                      sourceOrganization: "CIA World Factbook"
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)} liters`}
                  loading={loading}
                />

                <MetricTable
                  title="Wine Consumption (liters pure alcohol/year)"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return parseAlcoholWine(factbook?.alcoholConsumption);
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook ? {
                      source: factbook.source,
                      year: factbook.year,
                      sourceOrganization: "CIA World Factbook"
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)} liters`}
                  loading={loading}
                />

                <MetricTable
                  title="Spirits Consumption (liters pure alcohol/year)"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return parseAlcoholSpirits(factbook?.alcoholConsumption);
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook ? {
                      source: factbook.source,
                      year: factbook.year,
                      sourceOrganization: "CIA World Factbook"
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)} liters`}
                  loading={loading}
                />

                <MetricTable
                  title="Other Alcohols Consumption (liters pure alcohol/year)"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return parseAlcoholOther(factbook?.alcoholConsumption);
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const factbook = stats?.enhancedInfo?.factbookData;
                    return factbook ? {
                      source: factbook.source,
                      year: factbook.year,
                      sourceOrganization: "CIA World Factbook"
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)} liters`}
                  loading={loading}
                />
              </div>
            </section>

            {/* Trade Section */}
            <section id="trade" className="scroll-mt-8">
              <div className="mb-12 relative">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mr-4"></div>
                  <h2 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Trade
                  </h2>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 ml-16 font-light">
                  Import and export analysis with partner countries and trade values
                </p>
              </div>
              
              <div className="space-y-8">
                {/* Trade Metrics Tables */}
                <MetricTable
                  title="Total Exports"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.enhancedInfo?.comtradeData?.totalExports?.value || null;
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const comtrade = stats?.enhancedInfo?.comtradeData;
                    return comtrade ? {
                      source: comtrade.source,
                      year: comtrade.year?.toString(),
                      sourceOrganization: comtrade.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => {
                    if (value >= 1000000000) {
                      return `$${(value / 1000000000).toFixed(1)}B`;
                    } else if (value >= 1000000) {
                      return `$${(value / 1000000).toFixed(1)}M`;
                    } else {
                      return `$${value.toLocaleString()}`;
                    }
                  }}
                  loading={loading}
                />

                <MetricTable
                  title="Total Imports"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.enhancedInfo?.comtradeData?.totalImports?.value || null;
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const comtrade = stats?.enhancedInfo?.comtradeData;
                    return comtrade ? {
                      source: comtrade.source,
                      year: comtrade.year?.toString(),
                      sourceOrganization: comtrade.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => {
                    if (value >= 1000000000) {
                      return `$${(value / 1000000000).toFixed(1)}B`;
                    } else if (value >= 1000000) {
                      return `$${(value / 1000000).toFixed(1)}M`;
                    } else {
                      return `$${value.toLocaleString()}`;
                    }
                  }}
                  loading={loading}
                />

                <MetricTable
                  title="Trade Balance"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.enhancedInfo?.comtradeData?.tradeBalance?.value || null;
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const comtrade = stats?.enhancedInfo?.comtradeData;
                    return comtrade ? {
                      source: comtrade.source,
                      year: comtrade.year?.toString(),
                      sourceOrganization: comtrade.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => {
                    const absValue = Math.abs(value);
                    const status = value >= 0 ? 'Surplus' : 'Deficit';
                    if (absValue >= 1000000000) {
                      return `${status}: $${(absValue / 1000000000).toFixed(1)}B`;
                    } else if (absValue >= 1000000) {
                      return `${status}: $${(absValue / 1000000).toFixed(1)}M`;
                    } else {
                      return `${status}: $${absValue.toLocaleString()}`;
                    }
                  }}
                  loading={loading}
                />

                {/* Detailed Trade Partners */}
                {selectedCountries.map((country) => {
                  const stats = countryStats[country.code];
                  const factbook = stats?.enhancedInfo?.factbookData;
                  const comtrade = stats?.enhancedInfo?.comtradeData;
                  
                  return (
                    <div key={country.code} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                      {/* Country Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3 emoji">{country.flag}</span>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{country.name}</h3>
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
                                {comtrade.totalExports?.formatted?.formatted || 'N/A'}
                              </p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Total Imports</h4>
                              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                {comtrade.totalImports?.formatted?.formatted || 'N/A'}
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
                                {comtrade.tradeBalance?.formatted?.formatted || 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Trade Partners and Commodities Grid */}
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
                                        {partner.formatted?.formatted || 'N/A'}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {partner.percentage}%
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
                                        {partner.formatted?.formatted || 'N/A'}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {partner.percentage}%
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Export Commodities */}
                          {factbook?.exportCommodities && (
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <span className="text-base mr-2">🚢</span>
                                Export Commodities
                              </h4>
                              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-2">
                                {factbook.exportCommodities.split(',').map((commodity, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-blue-500 mr-2 font-bold">•</span>
                                    <span>{commodity.trim()}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Import Commodities */}
                          {factbook?.importCommodities && (
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <span className="text-base mr-2">📦</span>
                                Import Commodities
                              </h4>
                              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-2">
                                {factbook.importCommodities.split(',').map((commodity, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-green-500 mr-2 font-bold">•</span>
                                    <span>{commodity.trim()}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        {/* Show message if no data */}
                        {!comtrade && !factbook?.exportCommodities && !factbook?.importCommodities && (
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
                })}
              </div>
            </section>

            {/* Safety & Crime Section */}
            <section id="safety" className="scroll-mt-8">
              <div className="mb-12 relative">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-1 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full mr-4"></div>
                  <h2 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Safety & Crime
                  </h2>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 ml-16 font-light">
                  Security and crime rate analysis
                </p>
              </div>
              
              <div className="space-y-8">
                <MetricTable
                  title="Homicide Rate (per 100,000)"
                  countries={selectedCountries}
                  getValue={(country) => countryStats[country.code]?.homicideRate?.value || null}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.homicideRate ? {
                      source: stats.homicideRate.source,
                      year: stats.homicideRate.year || undefined,
                      sourceOrganization: stats.homicideRate.sourceOrganization
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}/100k`}
                  loading={loading}
                />
              </div>
            </section>

            {/* Climate Section */}
            <section id="climate" className="scroll-mt-8">
              <div className="mb-12 relative">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-1 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full mr-4"></div>
                  <h2 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Climate
                  </h2>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 ml-16 font-light">
                  Temperature patterns and weather data
                </p>
              </div>
              
              <div className="space-y-8">
                <MetricTable
                  title="Average Temperature"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.enhancedInfo?.climateData?.averageTemperature || null;
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const climate = stats?.enhancedInfo?.climateData;
                    return climate ? {
                      source: climate.source,
                      year: climate.year,
                      sourceOrganization: "World Bank Climate Change Knowledge Portal"
                    } : null;
                  }}
                  formatValue={(value) => `${value.toFixed(1)}°C`}
                  loading={loading}
                />

                <MetricTable
                  title="Hot Days (>30°C)"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.enhancedInfo?.climateData?.hotDays30 || null;
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const climate = stats?.enhancedInfo?.climateData;
                    return climate ? {
                      source: climate.source,
                      year: climate.year,
                      sourceOrganization: "World Bank Climate Change Knowledge Portal"
                    } : null;
                  }}
                  formatValue={(value) => `${value} days/year`}
                  loading={loading}
                />

                <MetricTable
                  title="Very Hot Days (>35°C)"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.enhancedInfo?.climateData?.hotDays35 || null;
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const climate = stats?.enhancedInfo?.climateData;
                    return climate ? {
                      source: climate.source,
                      year: climate.year,
                      sourceOrganization: "World Bank Climate Change Knowledge Portal"
                    } : null;
                  }}
                  formatValue={(value) => `${value} days/year`}
                  loading={loading}
                />

                <MetricTable
                  title="Cold Days (<0°C)"
                  countries={selectedCountries}
                  getValue={(country) => {
                    const stats = countryStats[country.code];
                    return stats?.enhancedInfo?.climateData?.coldDays || null;
                  }}
                  getSource={(country) => {
                    const stats = countryStats[country.code];
                    const climate = stats?.enhancedInfo?.climateData;
                    return climate ? {
                      source: climate.source,
                      year: climate.year,
                      sourceOrganization: "World Bank Climate Change Knowledge Portal"
                    } : null;
                  }}
                  formatValue={(value) => `${value} days/year`}
                  loading={loading}
                />
              </div>
            </section>

            {/* Sources Section */}
            <section id="sources" className="scroll-mt-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
                Sources
              </h2>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Data Sources</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• CIA World Factbook (2024)</li>
                      <li>• World Bank Open Data</li>
                      <li>• REST Countries API</li>
                      <li>• World Bank Climate Change Knowledge Portal</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Last Updated</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Data is fetched in real-time from official sources
                    </p>
                  </div>
                </div>
              </div>
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