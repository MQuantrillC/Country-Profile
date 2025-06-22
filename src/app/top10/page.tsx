'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Medal, 
  Award,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Filter,
  Search,
  BarChart3,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { countries } from '../../utils/countries';

interface CountryRanking {
  name: string;
  code: string;
  flag: string;
  value: number;
  year: string;
  source: string;
}

interface MetricDefinition {
  id: string;
  title: string;
  category: string;
  unit: string;
  description: string;
  higherIsBetter: boolean;
  worldBankCode: string;
}

const metrics: MetricDefinition[] = [
  // Economy
  { id: 'gdp', title: 'GDP', category: 'Economy', unit: 'USD', description: 'Gross Domestic Product', higherIsBetter: true, worldBankCode: 'NY.GDP.MKTP.CD' },
  { id: 'gdpPerCapita', title: 'GDP Per Capita', category: 'Economy', unit: 'USD', description: 'GDP per person', higherIsBetter: true, worldBankCode: 'NY.GDP.PCAP.CD' },
  { id: 'gniPerCapita', title: 'GNI Per Capita', category: 'Economy', unit: 'USD', description: 'Gross National Income per person', higherIsBetter: true, worldBankCode: 'NY.GNP.PCAP.CD' },
  { id: 'tradeGDP', title: 'Trade as % of GDP', category: 'Economy', unit: '%', description: 'Trade as percentage of GDP', higherIsBetter: true, worldBankCode: 'NE.TRD.GNFS.ZS' },
  { id: 'unemploymentRate', title: 'Unemployment Rate', category: 'Economy', unit: '%', description: 'Unemployment as % of labor force', higherIsBetter: false, worldBankCode: 'SL.UEM.TOTL.ZS' },
  { id: 'publicDebtGDP', title: 'Public Debt % of GDP', category: 'Economy', unit: '%', description: 'Government debt as % of GDP', higherIsBetter: false, worldBankCode: 'GC.DOD.TOTL.GD.ZS' },
  
  // Demographics
  { id: 'population', title: 'Population', category: 'Demographics', unit: 'people', description: 'Total population from World Bank', higherIsBetter: true, worldBankCode: 'SP.POP.TOTL' },
  { id: 'lifeExpectancy', title: 'Life Expectancy', category: 'Demographics', unit: 'years', description: 'Life expectancy at birth', higherIsBetter: true, worldBankCode: 'SP.DYN.LE00.IN' },
  { id: 'fertilityRate', title: 'Fertility Rate', category: 'Demographics', unit: 'births/woman', description: 'Births per woman', higherIsBetter: false, worldBankCode: 'SP.DYN.TFRT.IN' },
  { id: 'urbanPopPct', title: 'Urban Population %', category: 'Demographics', unit: '%', description: 'Urban population percentage', higherIsBetter: true, worldBankCode: 'SP.URB.TOTL.IN.ZS' },
  { id: 'ruralPopPct', title: 'Rural Population %', category: 'Demographics', unit: '%', description: 'Rural population percentage', higherIsBetter: false, worldBankCode: 'SP.RUR.TOTL.ZS' },
  
  // Education & Social
  { id: 'literacyRate', title: 'Literacy Rate', category: 'Education', unit: '%', description: 'Adult literacy rate', higherIsBetter: true, worldBankCode: 'SE.ADT.LITR.ZS' },
  { id: 'educationSpendPctGDP', title: 'Education Spending % of GDP', category: 'Education', unit: '%', description: 'Education expenditure as % of GDP', higherIsBetter: true, worldBankCode: 'SE.XPD.TOTL.GD.ZS' },
  { id: 'internetUsers', title: 'Internet Users %', category: 'Technology', unit: '%', description: 'Internet users as % of population', higherIsBetter: true, worldBankCode: 'IT.NET.USER.ZS' },
  { id: 'electricityAccess', title: 'Electricity Access %', category: 'Infrastructure', unit: '%', description: 'Access to electricity', higherIsBetter: true, worldBankCode: 'EG.ELC.ACCS.ZS' },
  
  // Environment
  { id: 'forestPct', title: 'Forest Coverage %', category: 'Environment', unit: '%', description: 'Forest area as % of land', higherIsBetter: true, worldBankCode: 'AG.LND.FRST.ZS' },
  { id: 'agriculturalLandPct', title: 'Agricultural Land %', category: 'Environment', unit: '%', description: 'Agricultural land as % of total', higherIsBetter: false, worldBankCode: 'AG.LND.AGRI.ZS' },
  { id: 'co2PerCapita', title: 'CO2 Emissions Per Capita', category: 'Environment', unit: 'metric tons', description: 'CO2 emissions per person', higherIsBetter: false, worldBankCode: 'EN.ATM.CO2E.PC' },
  
  // Safety
  { id: 'homicideRate', title: 'Homicide Rate', category: 'Safety', unit: 'per 100k', description: 'Intentional homicides per 100,000', higherIsBetter: false, worldBankCode: 'VC.IHR.PSRC.P5' },
  
  // Additional metrics from factbook and other sources
  { id: 'area', title: 'Total Area', category: 'Geography', unit: 'km²', description: 'Total land area', higherIsBetter: true, worldBankCode: 'AG.SRF.TOTL.K2' },
];



// Cache interfaces
interface CacheEntry {
  data: CountryRanking[] | Record<string, unknown>;
  timestamp: number;
}

// Cache to store fetched data and avoid repeated API calls
const dataCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function Top10Page() {
  const [selectedMetric, setSelectedMetric] = useState<MetricDefinition>(metrics[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [rankings, setRankings] = useState<CountryRanking[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showTopPerformers, setShowTopPerformers] = useState(true);

  const categories = ['All', ...Array.from(new Set(metrics.map(m => m.category)))];

  const filteredMetrics = metrics.filter(metric => {
    const matchesCategory = selectedCategory === 'All' || metric.category === selectedCategory;
    const matchesSearch = metric.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Optimized data fetching with caching and batch processing
  const fetchRankings = async (metric: MetricDefinition) => {
    setLoading(true);
    setLoadingProgress(0);
    
    try {
      console.log(`Fetching rankings for ${metric.title}`);
      
      // Check cache first
      const cacheKey = `rankings-${metric.id}`;
      const cachedData = dataCache.get(cacheKey);
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        console.log(`Using cached data for ${metric.title}`);
        if (Array.isArray(cachedData.data)) {
          setRankings(cachedData.data as CountryRanking[]);
        }
        setLoading(false);
        return;
      }
      
      // Process countries in smaller batches for better performance
      const BATCH_SIZE = 10;
      const batches = [];
      for (let i = 0; i < countries.length; i += BATCH_SIZE) {
        batches.push(countries.slice(i, i + BATCH_SIZE));
      }
      
      const allResults: (CountryRanking | null)[] = [];
      
      // Process batches sequentially to avoid overwhelming the API
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        setLoadingProgress(((batchIndex + 1) / batches.length) * 100);
        
        const batchPromises = batch.map(async (country) => {
          try {
            // Check individual country cache
            const countryCacheKey = `country-${country.code}`;
            const cachedCountryData = dataCache.get(countryCacheKey);
            
            let countryData;
            if (cachedCountryData && Date.now() - cachedCountryData.timestamp < CACHE_DURATION) {
              countryData = cachedCountryData.data;
            } else {
              const response = await fetch('/api/worldbank', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  country: country.code
                })
              });

              if (!response.ok) {
                console.warn(`Failed to fetch data for ${country.name}: ${response.status}`);
                return null;
              }

              countryData = await response.json();
              
              // Cache the country data
              dataCache.set(countryCacheKey, {
                data: countryData,
                timestamp: Date.now()
              });
            }
            
            // Extract the specific metric value based on the metric ID
            let value = null;
            let year = null;
            let source = 'World Bank';

            // Special handling for metrics that should ALWAYS use specific sources to match comparison page
            if (metric.id === 'population' && countryData?.enhancedInfo?.factbookData) {
              // Handle population from factbook data (male + female) - matches comparison page
              const factbook = countryData.enhancedInfo.factbookData;
              if (factbook.malePopulation && factbook.femalePopulation) {
                value = factbook.malePopulation + factbook.femalePopulation;
                year = factbook.year;
                source = 'CIA World Factbook';
              }
            } else if (metric.id === 'area' && countryData?.enhancedInfo?.factbookData?.area) {
              // Handle area from factbook ONLY - matches comparison page exactly
              const factbook = countryData.enhancedInfo.factbookData;
              value = factbook.area;
              year = factbook.year;
              source = 'CIA World Factbook';
            } else if (countryData && countryData[metric.id]) {
              // Default World Bank data handling
              value = countryData[metric.id].value;
              year = countryData[metric.id].year;
              source = countryData[metric.id].source || 'World Bank';
            }

            if (value !== null && value !== undefined) {
              return {
                ...country,
                value: value,
                year: year || 'N/A',
                source: source
              };
            }
            
            return null;
          } catch (error) {
            console.error(`Error fetching data for ${country.name}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        allResults.push(...batchResults);
        
        // Small delay between batches to prevent API rate limiting
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Filter out null results and sort by value
      const validResults = allResults
        .filter((result): result is CountryRanking => result !== null)
        .sort((a, b) => metric.higherIsBetter ? b.value - a.value : a.value - b.value)
        .slice(0, 10);

      console.log(`Fetched ${validResults.length} valid results for ${metric.title}`);
      
      // Cache the final rankings
      dataCache.set(cacheKey, {
        data: validResults,
        timestamp: Date.now()
      });
      
      setRankings(validResults);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      setRankings([]);
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  useEffect(() => {
    fetchRankings(selectedMetric);
  }, [selectedMetric]);

  const formatValue = (value: number, unit: string) => {
    if (unit === 'USD' && value > 1000000000000) {
      return `$${(value / 1000000000000).toFixed(1)}T`;
    } else if (unit === 'USD' && value > 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (unit === 'USD' && value > 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (unit === 'USD' && value > 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else if (unit === 'USD') {
      return `$${value.toLocaleString()}`;
    } else if (unit === 'people' && value > 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (unit === 'people' && value > 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (unit === 'people' && value > 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    } else if (unit === 'km²' && value > 1000000) {
      return `${(value / 1000000).toFixed(1)}M km²`;
    } else if (unit === 'km²' && value > 1000) {
      return `${(value / 1000).toFixed(1)}K km²`;
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'years') {
      return `${value.toFixed(1)} years`;
    } else if (unit === 'births/woman') {
      return `${value.toFixed(1)} births/woman`;
    } else if (unit === 'per 100k') {
      return `${value.toFixed(1)} per 100k`;
    } else if (unit === 'metric tons') {
      return `${value.toFixed(1)} metric tons`;
    } else {
      return `${value.toFixed(1)} ${unit}`;
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="text-yellow-500" size={24} />;
      case 2: return <Medal className="text-gray-400" size={24} />;
      case 3: return <Award className="text-amber-600" size={24} />;
      default: return <span className="text-2xl font-bold text-gray-500">#{rank}</span>;
    }
  };

  const displayedRankings = showTopPerformers ? rankings : [...rankings].reverse();
  const titlePrefix = showTopPerformers ? 'Top 10' : 'Bottom 10';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                <ArrowLeft size={20} />
                <span>Back to Comparison</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="mr-3 text-blue-600" size={32} />
                Country Rankings
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Metric Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Filter className="mr-2" size={20} />
                Select Metric
              </h2>
              
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search metrics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Metric List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMetrics.map(metric => (
                  <button
                    key={metric.id}
                    onClick={() => setSelectedMetric(metric)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      selectedMetric.id === metric.id
                        ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="font-medium">{metric.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {metric.category} • {metric.unit}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Rankings */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {titlePrefix} Countries: {selectedMetric.title}
                    </h2>
                    <p className="text-blue-100 mb-4">{selectedMetric.description}</p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Globe size={16} />
                        <span className="text-sm">
                          {selectedMetric.id === 'population' || selectedMetric.id === 'area' 
                            ? 'Source: CIA World Factbook' 
                            : 'Source: World Bank'
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{countries.length} countries analyzed</span>
                      </div>
                      {dataCache.has(`rankings-${selectedMetric.id}`) && (
                        <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded-full">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs">Cached</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => setShowTopPerformers(!showTopPerformers)}
                      className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      {showTopPerformers ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      <span className="text-sm">
                        {showTopPerformers ? 'Show Lowest' : 'Show Highest'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Rankings List */}
              <div className="p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <div className="text-center">
                      <div className="text-gray-600 dark:text-gray-400 mb-2">
                        Loading rankings from {countries.length} countries...
                      </div>
                      {loadingProgress > 0 && (
                        <div className="w-64 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${loadingProgress}%` }}
                          ></div>
                        </div>
                      )}
                      {loadingProgress > 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {Math.round(loadingProgress)}% complete
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedRankings.map((country, index) => {
                      const rank = showTopPerformers ? index + 1 : 10 - index;
                      return (
                        <div
                          key={country.code}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12">
                              {getRankIcon(rank)}
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{country.flag}</span>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {country.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {country.code}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              {formatValue(country.value, selectedMetric.unit)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {country.year}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Metric Info */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                About {selectedMetric.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedMetric.category}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Unit:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedMetric.unit}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Performance:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {selectedMetric.higherIsBetter ? 'Higher is better' : 'Lower is better'}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                {selectedMetric.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 