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
  Globe,
  RefreshCw,
  Clock,
  Zap,
  Database
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
}

// ONLY working World Bank metrics - optimized for ultra-fast bulk loading
const worldBankMetrics: MetricDefinition[] = [
  // Economy
  { id: 'gdp', title: 'GDP', category: 'Economy', unit: 'USD', description: 'Gross Domestic Product', higherIsBetter: true },
  { id: 'gdpPerCapita', title: 'GDP Per Capita', category: 'Economy', unit: 'USD', description: 'GDP per person', higherIsBetter: true },
  { id: 'gniPerCapita', title: 'GNI Per Capita', category: 'Economy', unit: 'USD', description: 'Gross National Income per person', higherIsBetter: true },
  { id: 'tradeGDP', title: 'Trade as % of GDP', category: 'Economy', unit: '%', description: 'Trade as percentage of GDP', higherIsBetter: true },
  { id: 'unemploymentRate', title: 'Unemployment Rate', category: 'Economy', unit: '%', description: 'Unemployment as % of labor force', higherIsBetter: false },
  
  // Demographics
  { id: 'population', title: 'Population', category: 'Demographics', unit: 'people', description: 'Total population', higherIsBetter: true },
  { id: 'lifeExpectancy', title: 'Life Expectancy', category: 'Demographics', unit: 'years', description: 'Life expectancy at birth', higherIsBetter: true },
  { id: 'fertilityRate', title: 'Fertility Rate', category: 'Demographics', unit: 'births/woman', description: 'Births per woman', higherIsBetter: true },
  { id: 'urbanPopPct', title: 'Urban Population %', category: 'Demographics', unit: '%', description: 'Urban population percentage', higherIsBetter: true },
  
  // Education & Social
  { id: 'educationSpendPctGDP', title: 'Education Spending % of GDP', category: 'Education', unit: '%', description: 'Education expenditure as % of GDP', higherIsBetter: true },
  { id: 'internetUsers', title: 'Internet Users %', category: 'Technology', unit: '%', description: 'Internet users as % of population', higherIsBetter: true },
  
  // Environment
  { id: 'forestPct', title: 'Forest Coverage %', category: 'Environment', unit: '%', description: 'Forest area as % of land', higherIsBetter: true },
  { id: 'agriculturalLandPct', title: 'Agricultural Land %', category: 'Environment', unit: '%', description: 'Agricultural land as % of total', higherIsBetter: true },
  
  // Safety
  { id: 'homicideRate', title: 'Homicide Rate', category: 'Safety', unit: 'per 100k', description: 'Intentional homicides per 100,000', higherIsBetter: true },
  
  // Calculated metrics (derived from other World Bank data)
  { id: 'ruralPopPct', title: 'Rural Population %', category: 'Demographics', unit: '%', description: 'Rural population percentage (100 - Urban %)', higherIsBetter: true }
];

interface BulkDataCache {
  [metricId: string]: CountryRanking[];
}

interface LoadingState {
  isLoading: boolean;
  loadedMetrics: number;
  totalMetrics: number;
  currentMetric: string;
  failed: string[];
}

export default function Top10Page() {
  const [selectedMetric, setSelectedMetric] = useState<MetricDefinition>(worldBankMetrics[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkCache, setBulkCache] = useState<BulkDataCache>({});
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    loadedMetrics: 0,
    totalMetrics: worldBankMetrics.length,
    currentMetric: '',
    failed: []
  });
  const [showTopPerformers, setShowTopPerformers] = useState(true);

  const categories = ['All', ...Array.from(new Set(worldBankMetrics.map(m => m.category)))];

  const filteredMetrics = worldBankMetrics.filter(metric => {
    const matchesCategory = selectedCategory === 'All' || metric.category === selectedCategory;
    const matchesSearch = metric.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         metric.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Ultra-fast bulk data loader
  const loadAllWorldBankData = async () => {
    console.log('🚀 Starting ultra-fast bulk data loading for', worldBankMetrics.length, 'World Bank metrics...');
    
    const newCache: BulkDataCache = {};
    const failedMetrics: string[] = [];
    
    setLoadingState(prev => ({ ...prev, isLoading: true, loadedMetrics: 0, failed: [] }));

    // Create all API calls in parallel for maximum speed (skip calculated metrics)
    const apiMetrics = worldBankMetrics.filter(metric => metric.id !== 'ruralPopPct');
    const allPromises = apiMetrics.map(async (metric, index) => {
      try {
        setLoadingState(prev => ({ ...prev, currentMetric: metric.title }));
        
        console.log(`📊 Fetching ${metric.title}...`);
        const response = await fetch(`/api/worldbank-single?metric=${metric.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error || !data.data || !Array.isArray(data.data)) {
          console.warn(`⚠️ No data for ${metric.title}:`, data.error || 'No data array');
          failedMetrics.push(metric.id);
          return { metricId: metric.id, rankings: [] };
        }

        // Map countries to our format with improved mapping
        const countryCodeMap: Record<string, string> = {
          // Major economies
          USA: 'US', CHN: 'CN', JPN: 'JP', DEU: 'DE', IND: 'IN', 
          GBR: 'GB', FRA: 'FR', ITA: 'IT', BRA: 'BR', CAN: 'CA',
          RUS: 'RU', KOR: 'KR', AUS: 'AU', ESP: 'ES', MEX: 'MX',
          IDN: 'ID', NLD: 'NL', SAU: 'SA', CHE: 'CH', TUR: 'TR',
          
          // Western Europe
          DNK: 'DK', FIN: 'FI', BEL: 'BE', AUT: 'AT', IRL: 'IE',
          PRT: 'PT', GRC: 'GR', NOR: 'NO', SWE: 'SE', ISL: 'IS',
          LUX: 'LU', MLT: 'MT', CYP: 'CY',
          
          // Eastern Europe & Balkans
          POL: 'PL', CZE: 'CZ', HUN: 'HU', SVK: 'SK', SVN: 'SI',
          HRV: 'HR', BGR: 'BG', ROU: 'RO', LTU: 'LT', LVA: 'LV',
          EST: 'EE', UKR: 'UA', BLR: 'BY', SRB: 'RS', BIH: 'BA',
          MNE: 'ME', MKD: 'MK', ALB: 'AL', MDA: 'MD', KSV: 'XK',
          
          // Caucasus & Central Asia
          GEO: 'GE', ARM: 'AM', AZE: 'AZ', KAZ: 'KZ', UZB: 'UZ',
          TKM: 'TM', KGZ: 'KG', TJK: 'TJ', MNG: 'MN',
          
          // East & Southeast Asia
          SGP: 'SG', THA: 'TH', MYS: 'MY', VNM: 'VN', PHL: 'PH',
          LAO: 'LA', KHM: 'KH', MMR: 'MM', PRK: 'KP', TWN: 'TW',
          HKG: 'HK', MAC: 'MO', BRN: 'BN', TLS: 'TL', FJI: 'FJ',
          
          // Middle East & North Africa
          ARE: 'AE', QAT: 'QA', KWT: 'KW', OMN: 'OM', BHR: 'BH',
          JOR: 'JO', LBN: 'LB', ISR: 'IL', PSE: 'PS', SYR: 'SY',
          EGY: 'EG', MAR: 'MA', TUN: 'TN', DZA: 'DZ', LBY: 'LY',
          SDN: 'SD', YEM: 'YE',
          
          // Sub-Saharan Africa
          NGA: 'NG', KEN: 'KE', GHA: 'GH', ETH: 'ET', TZA: 'TZ',
          UGA: 'UG', RWA: 'RW', SEN: 'SN', CIV: 'CI', CMR: 'CM',
          MDG: 'MG', MOZ: 'MZ', ZMB: 'ZM', ZWE: 'ZW', BWA: 'BW',
          NAM: 'NA', ZAF: 'ZA', AGO: 'AO', COD: 'CD', GAB: 'GA',
          MLI: 'ML', BFA: 'BF', NER: 'NE', TCD: 'TD', CAF: 'CF',
          COG: 'CG', GNQ: 'GQ', STP: 'ST', BEN: 'BJ', TGO: 'TG',
          LBR: 'LR', SLE: 'SL', GIN: 'GN', GMB: 'GM', GNB: 'GW',
          
          // South Asia
          PAK: 'PK', BGD: 'BD', LKA: 'LK', NPL: 'NP', AFG: 'AF',
          BTN: 'BT', MDV: 'MV',
          
          // Middle East (continued)
          IRN: 'IR', IRQ: 'IQ',
          
          // Americas
          CHL: 'CL', PER: 'PE', ARG: 'AR', COL: 'CO', VEN: 'VE',
          ECU: 'EC', URY: 'UY', PRY: 'PY', BOL: 'BO', GUY: 'GY',
          SUR: 'SR', CRI: 'CR', PAN: 'PA', NIC: 'NI', HND: 'HN',
          GTM: 'GT', BLZ: 'BZ', SLV: 'SV', CUB: 'CU', DOM: 'DO',
          HTI: 'HT', JAM: 'JM', TTO: 'TT', BRB: 'BB', BHS: 'BS',
          
          // Pacific
          NZL: 'NZ', PNG: 'PG', VUT: 'VU', SLB: 'SB', NCL: 'NC',
          TON: 'TO', WSM: 'WS', KIR: 'KI', TUV: 'TV', NRU: 'NR',
          PLW: 'PW', MHL: 'MH', FSM: 'FM'
        };

        // Additional mappings for common name variations
        const nameMapping: Record<string, string> = {
          'Korea, Rep.': 'KR',
          'Korea, Republic of': 'KR',
          'South Korea': 'KR',
          'Russian Federation': 'RU',
          'United Kingdom': 'GB',
          'United States': 'US',
          'North Macedonia': 'MK',
          'Macedonia, FYR': 'MK',
          'Iran, Islamic Rep.': 'IR',
          'Egypt, Arab Rep.': 'EG',
          'Venezuela, RB': 'VE',
          'Yemen, Rep.': 'YE',
          'Congo, Dem. Rep.': 'CD',
          'Congo, Rep.': 'CG',
          'Slovak Republic': 'SK',
          'Czech Republic': 'CZ',
          'Kyrgyz Republic': 'KG',
          'Lao PDR': 'LA',
          'Brunei Darussalam': 'BN',
          'Cabo Verde': 'CV',
          'Gambia, The': 'GM',
          'Bahamas, The': 'BS',
          'Micronesia, Fed. Sts.': 'FM',
          'St. Lucia': 'LC',
          'St. Vincent and the Grenadines': 'VC',
          'St. Kitts and Nevis': 'KN'
        };

        const rankings: CountryRanking[] = [];
        
        data.data.forEach((entry: any) => {
          let matchingCountry = null;
          
          // Method 1: Try direct 3-letter to 2-letter mapping
          const twoLetterCode = countryCodeMap[entry.countryId];
          if (twoLetterCode) {
            matchingCountry = countries.find(c => c.code === twoLetterCode);
          }
          
          // Method 2: Try name-based mapping
          if (!matchingCountry && entry.countryName) {
            const mappedCode = nameMapping[entry.countryName];
            if (mappedCode) {
              matchingCountry = countries.find(c => c.code === mappedCode);
            }
          }
          
          // Method 3: Try exact name match
          if (!matchingCountry && entry.countryName) {
            matchingCountry = countries.find(c => 
              c.name.toLowerCase() === entry.countryName.toLowerCase()
            );
          }
          
          // Method 4: Try partial name match (restrictive)
          if (!matchingCountry && entry.countryName && entry.countryName.length > 5) {
            matchingCountry = countries.find(c => {
              const countryLower = c.name.toLowerCase();
              const entryLower = entry.countryName.toLowerCase();
              
              // Must be substantial match to avoid false positives
              return countryLower.includes(entryLower) || entryLower.includes(countryLower);
            });
          }

          if (matchingCountry && typeof entry.value === 'number' && entry.value > 0) {
            rankings.push({
              name: matchingCountry.name,
              code: matchingCountry.code,
              flag: matchingCountry.flag,
              value: entry.value,
              year: entry.year,
              source: 'World Bank'
            });
          } else if (!matchingCountry && entry.countryName) {
            // Only log if it's a significant economy we might care about
            if (entry.value && entry.value > 10000000000) { // > $10B GDP
              console.warn(`⚠️ No match for significant country: ${entry.countryName} (ID: ${entry.countryId}) - Value: ${entry.value}`);
            }
          }
        });

        // Ensure we have valid data and sort properly
        const validRankings = rankings.filter(r => r.value && r.value > 0);
        
        // Sort and get top 10 with proper numerical sorting
        const sortedRankings = validRankings
          .sort((a, b) => {
            // Ensure proper numerical comparison
            const valueA = Number(a.value);
            const valueB = Number(b.value);
            return metric.higherIsBetter ? valueB - valueA : valueA - valueB;
          })
          .slice(0, 10);

        // Debug for GDP metric
        if (metric.id === 'gdp') {
          console.log(`🔍 GDP Debug - Found ${validRankings.length} valid countries total:`);
          console.log('Top 10 by GDP:');
          sortedRankings.forEach((country, index) => {
            const gdpTrillions = country.value / 1000000000000;
            console.log(`${index + 1}. ${country.name} (${country.code}): $${gdpTrillions.toFixed(2)}T`);
          });
        }

        console.log(`✅ Loaded ${sortedRankings.length} rankings for ${metric.title}`);
        
        setLoadingState(prev => ({ 
          ...prev, 
          loadedMetrics: prev.loadedMetrics + 1
        }));

        return { metricId: metric.id, rankings: sortedRankings };

      } catch (error) {
        console.error(`❌ Failed to load ${metric.title}:`, error);
        failedMetrics.push(metric.id);
        setLoadingState(prev => ({ 
          ...prev, 
          loadedMetrics: prev.loadedMetrics + 1
        }));
        return { metricId: metric.id, rankings: [] };
      }
    });

    // Wait for all requests to complete
    console.log('⚡ Executing', allPromises.length, 'parallel API calls...');
    const results = await Promise.all(allPromises);
    
    // Build cache
    results.forEach(({ metricId, rankings }) => {
      newCache[metricId] = rankings;
    });

    // Calculate derived metrics (Rural Population %)
    if (newCache['urbanPopPct']) {
      console.log('📊 Calculating Rural Population % from Urban Population %...');
      console.log('Sample urban data before calculation:');
      newCache['urbanPopPct'].slice(0, 5).forEach(entry => {
        console.log(`${entry.name}: ${entry.value}% urban`);
      });
      
      const ruralRankings: CountryRanking[] = newCache['urbanPopPct'].map(urbanEntry => {
        const ruralPercent = Math.max(0, 100 - urbanEntry.value);
        
        // Debug for specific problematic countries
        if (urbanEntry.name === 'Iceland' || urbanEntry.name === 'Belgium') {
          console.log(`🔍 ${urbanEntry.name}: Urban ${urbanEntry.value}% → Rural ${ruralPercent}%`);
        }
        
        return {
          ...urbanEntry,
          value: ruralPercent, // Rural % = 100 - Urban %
          source: 'World Bank (Calculated)'
        };
      });
      
      // Sort rural population rankings (higher rural % first)
      const sortedRuralRankings = ruralRankings
        .sort((a, b) => b.value - a.value) // Highest rural % first
        .slice(0, 10);
      
      console.log('Top 10 Rural Population results:');
      sortedRuralRankings.forEach((country, index) => {
        console.log(`${index + 1}. ${country.name}: ${country.value.toFixed(1)}% rural`);
      });
      
      newCache['ruralPopPct'] = sortedRuralRankings;
      console.log('✅ Rural Population % calculated successfully');
    }

    // Use functional update to prevent race conditions
    setBulkCache(prevCache => {
      // Merge with existing cache to preserve any previous data
      return { ...prevCache, ...newCache };
    });
    
    setLoadingState(prev => ({ 
      ...prev, 
      isLoading: false, 
      failed: failedMetrics,
      currentMetric: ''
    }));

    const successCount = worldBankMetrics.length - failedMetrics.length;
    console.log(`🎉 Bulk loading complete! ${successCount}/${worldBankMetrics.length} metrics loaded successfully`);
    
    if (failedMetrics.length > 0) {
      console.warn('⚠️ Failed metrics:', failedMetrics);
    }
  };

  // Load all data on component mount
  useEffect(() => {
    loadAllWorldBankData();
  }, []);

  // Get current rankings (instant after initial load)
  const getCurrentRankings = (): CountryRanking[] => {
    const rankings = bulkCache[selectedMetric.id] || [];
    
    // Debug logging to track metric switching
    console.log(`Getting rankings for ${selectedMetric.title}: ${rankings.length} countries`);
    
    // Ensure we return a fresh copy to prevent mutation issues
    return [...rankings];
  };

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
    } else if (unit === '% of GDP') {
      return `${value.toFixed(1)}% of GDP`;
    } else if (unit === 'per 100 people') {
      return `${value.toFixed(1)} per 100`;
    } else if (unit === 'kg oil equivalent') {
      return `${value.toFixed(0)} kg oil eq.`;
    } else if (unit === 'people/km²') {
      return `${value.toFixed(1)} people/km²`;
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

  const currentRankings = getCurrentRankings();
  const displayedRankings = showTopPerformers ? currentRankings : [...currentRankings].reverse();
  const titlePrefix = showTopPerformers ? 'Top 10' : 'Bottom 10';
  const loadingProgress = loadingState.totalMetrics > 0 ? (loadingState.loadedMetrics / loadingState.totalMetrics) * 100 : 0;

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
                World Bank Rankings
                <span className="ml-3 text-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                  ⚡ Ultra-Fast
                </span>
              </h1>
            </div>
            <button
              onClick={loadAllWorldBankData}
              disabled={loadingState.isLoading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <RefreshCw size={16} className={loadingState.isLoading ? 'animate-spin' : ''} />
              <span>Refresh All Data</span>
            </button>
          </div>

          {/* Ultra-fast loading indicator */}
          {loadingState.isLoading && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Zap className="text-blue-500 animate-pulse" size={20} />
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    Ultra-Fast Bulk Loading: {loadingState.loadedMetrics}/{loadingState.totalMetrics} metrics
                  </span>
                </div>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  {loadingProgress.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              {loadingState.currentMetric && (
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Currently loading: {loadingState.currentMetric}
                </div>
              )}
            </div>
          )}

          {/* Success indicator */}
          {!loadingState.isLoading && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Database className="text-green-500" size={20} />
                <span className="font-semibold text-green-700 dark:text-green-300">
                  ✅ All data loaded! {worldBankMetrics.length - loadingState.failed.length}/{worldBankMetrics.length} metrics available
                </span>
                <span className="text-sm bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                  Instant switching enabled ⚡
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Metric Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Filter className="mr-2" size={20} />
                Select Metric ({worldBankMetrics.length} available)
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
                {filteredMetrics.map(metric => {
                  const hasData = bulkCache[metric.id] && bulkCache[metric.id].length > 0;
                  const isLoaded = !loadingState.isLoading;
                  const isFailed = loadingState.failed.includes(metric.id);
                  
                  return (
                    <button
                      key={metric.id}
                      onClick={() => {
                        console.log(`Switching to metric: ${metric.title} (${metric.id})`);
                        setSelectedMetric(metric);
                        // Reset show top performers to ensure consistent behavior
                        setShowTopPerformers(true);
                      }}
                      disabled={!isLoaded}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                        selectedMetric.id === metric.id
                          ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 text-blue-700 dark:text-blue-300'
                          : isLoaded
                          ? 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent text-gray-700 dark:text-gray-300'
                          : 'bg-gray-100 dark:bg-gray-800 border-2 border-transparent text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{metric.title}</div>
                        <div className="flex items-center space-x-1">
                          <span className="text-lg">🏦</span>
                          {isLoaded && hasData && (
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                          {isLoaded && isFailed && (
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                          {!isLoaded && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {metric.category} • {metric.unit}
                        {isLoaded && hasData && (
                          <span className="ml-2 text-green-600 dark:text-green-400">✓ Loaded</span>
                        )}
                        {isLoaded && isFailed && (
                          <span className="ml-2 text-red-600 dark:text-red-400">✗ Failed</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {filteredMetrics.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No metrics found matching your search.
                </div>
              )}
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
                        <span className="text-sm">🏦 World Bank</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{countries.length} countries analyzed</span>
                      </div>
                      {!loadingState.isLoading && (
                        <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded-full">
                          <Zap size={12} />
                          <span className="text-xs">Instant</span>
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
                {loadingState.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <div className="text-center">
                      <div className="text-gray-600 dark:text-gray-400 mb-2">
                        Loading all World Bank metrics in parallel...
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ⚡ Ultra-fast bulk loading: {loadingState.loadedMetrics}/{loadingState.totalMetrics} complete
                      </div>
                    </div>
                  </div>
                ) : currentRankings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400 mb-2">
                      No data available for this metric
                    </div>
                    <div className="text-sm text-gray-400 dark:text-gray-500">
                      This metric may not have sufficient data in the World Bank database
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4" key={`${selectedMetric.id}-${showTopPerformers}`}>
                    {displayedRankings.map((country, index) => {
                      const rank = showTopPerformers ? index + 1 : 10 - index;
                      return (
                        <div
                          key={`${selectedMetric.id}-${country.code}-${index}`}
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
                                  {country.code} • {country.source}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
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
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Data Source:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    🏦 World Bank
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