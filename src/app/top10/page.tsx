'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BarChart3, ChevronDown, ChevronUp, ArrowRight, Info, TrendingUp, Users, Package, AlertTriangle, Thermometer, Globe, Sun, Moon, ArrowUp, HelpCircle, Trophy, Medal, Award, TrendingDown, ArrowLeft, RefreshCw, Zap, Database, Filter, Search } from 'lucide-react';
import { countries, Country } from '@/utils/countries';

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

interface WorldBankEntry {
  countryId: string;
  countryName?: string;
  value?: number;
  year?: string;
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
  const [showHighest, setShowHighest] = useState(true);
  const [showMetricDropdown, setShowMetricDropdown] = useState(true);

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
    const allPromises = apiMetrics.map(async (metric) => {
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
        
        // Debug raw World Bank data for problematic metrics
        if (metric.id === 'gdp' || metric.id === 'gdpPerCapita' || metric.id === 'population') {
          let minValue;
          if (metric.id === 'gdp') minValue = 500000000000; // $500B for GDP
          else if (metric.id === 'gdpPerCapita') minValue = 10000; // $10k for GDP per capita  
          else minValue = 50000000; // 50M for population
          
          console.log(`🔍 Raw World Bank ${metric.title} data (top 20 by value):`);
          const topRawEntries = data.data
            .filter((entry: WorldBankEntry) => entry.value && entry.value > minValue)
            .sort((a: WorldBankEntry, b: WorldBankEntry) => (b.value || 0) - (a.value || 0))
            .slice(0, 20);
          
          topRawEntries.forEach((entry: WorldBankEntry, index: number) => {
            if (metric.id === 'gdp') {
              const gdpTrillions = ((entry.value || 0) / 1000000000000).toFixed(2);
              console.log(`  ${index + 1}. ${entry.countryName} (${entry.countryId}): $${gdpTrillions}T`);
            } else if (metric.id === 'population') {
              const populationM = ((entry.value || 0) / 1000000).toFixed(1);
              console.log(`  ${index + 1}. ${entry.countryName} (${entry.countryId}): ${populationM}M`);
            } else {
              console.log(`  ${index + 1}. ${entry.countryName} (${entry.countryId}): $${(entry.value || 0).toLocaleString()}`);
            }
          });
          
          // Look for ALL Pakistan entries (not just first one)
          const pakistanRawEntries = data.data.filter((entry: WorldBankEntry) => 
            entry.countryId === 'PAK' || entry.countryName?.includes('Pakistan')
          );
          console.log(`🔍 ALL Pakistan entries found (${pakistanRawEntries.length} total):`);
          pakistanRawEntries.forEach((entry: WorldBankEntry, index: number) => {
            if (metric.id === 'gdp') {
              console.log(`  ${index + 1}. ${entry.countryName} (${entry.countryId}): $${((entry.value || 0) / 1000000000).toFixed(1)}B (${entry.year})`);
            } else if (metric.id === 'population') {
              const populationM = ((entry.value || 0) / 1000000).toFixed(1);
              console.log(`  ${index + 1}. ${entry.countryName} (${entry.countryId}): ${populationM}M (${entry.year})`);
            } else {
              console.log(`  ${index + 1}. ${entry.countryName} (${entry.countryId}): $${(entry.value || 0).toLocaleString()} (${entry.year})`);
            }
          });
          
          // Look for China entries specifically
          const chinaRawEntries = data.data.filter((entry: WorldBankEntry) => 
            entry.countryId === 'CHN' || entry.countryId === 'HKG' || entry.countryId === 'MAC' ||
            entry.countryName?.includes('China')
          );
          console.log('🔍 Raw China entries:');
          chinaRawEntries.forEach((entry: WorldBankEntry) => {
            if (metric.id === 'gdp') {
              const gdpTrillions = ((entry.value || 0) / 1000000000000).toFixed(2);
              console.log(`  - ${entry.countryName} (${entry.countryId}): $${gdpTrillions}T`);
            } else if (metric.id === 'population') {
              const populationM = ((entry.value || 0) / 1000000).toFixed(1);
              console.log(`  - ${entry.countryName} (${entry.countryId}): ${populationM}M`);
            } else {
              console.log(`  - ${entry.countryName} (${entry.countryId}): $${(entry.value || 0).toLocaleString()}`);
            }
          });
        }
        
        data.data.forEach((entry: WorldBankEntry) => {
          let matchingCountry = null;
          
          // Skip World Bank regional aggregates and groups - these contain country names but aren't actual countries
          const isRegionalAggregate = entry.countryName && (
            // World Bank regional/income groups
            entry.countryName.includes('income') ||
            entry.countryName.includes('IDA & IBRD') ||
            entry.countryName.includes('OECD') ||
            entry.countryName.includes('World') ||
            entry.countryName.includes('demographic dividend') ||
            entry.countryName.includes('Arab World') ||
            entry.countryName.includes('Sub-Saharan Africa') ||
            entry.countryName.includes('Latin America') ||
            entry.countryName.includes('South Asia') ||
            entry.countryName.includes('East Asia') ||
            entry.countryName.includes('Europe & Central Asia') ||
            entry.countryName.includes('Middle East, North Africa') ||
            entry.countryName.includes('Caribbean') ||
            entry.countryName.includes('Pacific') ||
            entry.countryName.includes('excluding') ||
            entry.countryName.includes('total') ||
            // Specific aggregates that contain country names
            entry.countryName.includes(', ') && entry.countryName.includes(' & ') ||
            // Multi-character country IDs indicate aggregates
            entry.countryId && entry.countryId.length > 3
          );
          
          if (isRegionalAggregate) {
            // Log regional aggregates that might be confusing
            if (metric.id === 'gdp' || metric.id === 'population') {
              console.log(`🚫 Skipping regional aggregate: ${entry.countryName} (${entry.countryId})`);
            }
            return; // Skip this entry entirely
          }
          
          // Method 1: Try direct 3-letter to 2-letter mapping (most reliable)
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
              c.name.toLowerCase() === entry.countryName!.toLowerCase()
            );
          }
          
          // Method 4: Handle China specifically to avoid SAR confusion
          if (!matchingCountry && entry.countryName) {
            // For China, prioritize exact "China" match over SAR regions
            if (entry.countryName === 'China' || entry.countryId === 'CHN') {
              matchingCountry = countries.find(c => c.code === 'CN');
            }
            // For Hong Kong SAR, map to HK
            else if (entry.countryName === 'Hong Kong SAR, China' || entry.countryId === 'HKG') {
              matchingCountry = countries.find(c => c.code === 'HK');
            }
            // For Macao SAR, map to MO
            else if (entry.countryName === 'Macao SAR, China' || entry.countryId === 'MAC') {
              matchingCountry = countries.find(c => c.code === 'MO');
            }
          }
          
          // Method 5: Try partial name match (very restrictive to avoid false positives)
          if (!matchingCountry && entry.countryName && entry.countryName.length > 5) {
            // Skip partial matching for entries that might be aggregates or contain multiple country names
            if (!entry.countryName.includes('China') && 
                !entry.countryName.includes(',') && 
                !entry.countryName.includes('&') &&
                !entry.countryName.includes(' and ')) {
              matchingCountry = countries.find(c => {
                const countryLower = c.name.toLowerCase();
                const entryLower = entry.countryName!.toLowerCase();
                
                // Must be substantial match to avoid false positives
                return countryLower.includes(entryLower) || entryLower.includes(countryLower);
              });
            }
          }

          if (matchingCountry && typeof entry.value === 'number' && entry.value > 0) {
            // Debug specific countries during problematic metrics processing
            if ((metric.id === 'gdp' || metric.id === 'gdpPerCapita' || metric.id === 'population') && (
              entry.countryName?.includes('Pakistan') || 
              entry.countryName?.includes('China') || 
              entry.countryId === 'PAK' || 
              entry.countryId === 'CHN' || 
              entry.countryId === 'HKG' || 
              entry.countryId === 'MAC'
            )) {
              if (metric.id === 'gdp') {
                console.log(`🔍 Mapping: ${entry.countryName} (${entry.countryId}) → ${matchingCountry.name} (${matchingCountry.code}): $${(entry.value / 1000000000).toFixed(1)}B (${entry.year})`);
              } else if (metric.id === 'population') {
                const populationM = (entry.value / 1000000).toFixed(1);
                console.log(`🔍 Mapping: ${entry.countryName} (${entry.countryId}) → ${matchingCountry.name} (${matchingCountry.code}): ${populationM}M (${entry.year})`);
              } else {
                console.log(`🔍 Mapping: ${entry.countryName} (${entry.countryId}) → ${matchingCountry.name} (${matchingCountry.code}): $${entry.value.toLocaleString()} (${entry.year})`);
              }
            }
            
            rankings.push({
              name: matchingCountry.name,
              code: matchingCountry.code,
              flag: matchingCountry.flag,
              value: entry.value,
              year: entry.year || 'N/A',
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
        
        // Deduplicate by country code - keep the entry with the highest value for each country
        const deduplicatedRankings = validRankings.reduce((acc: CountryRanking[], current) => {
          const existingIndex = acc.findIndex(r => r.code === current.code);
          
          if (existingIndex === -1) {
            // New country, add it
            acc.push(current);
          } else {
            // Country exists, keep the one with higher value (or more recent year if values are equal)
            const existing = acc[existingIndex];
            const shouldReplace = current.value > existing.value || 
              (current.value === existing.value && parseInt(current.year) > parseInt(existing.year));
            
            if (shouldReplace) {
              // Debug duplicate detection
              if (metric.id === 'gdp' || metric.id === 'population') {
                console.log(`🔍 Duplicate detected for ${current.name} (${current.code}):`);
                console.log(`  Existing: ${existing.value} (${existing.year})`);
                console.log(`  New: ${current.value} (${current.year})`);
                console.log(`  Keeping: ${shouldReplace ? 'new' : 'existing'}`);
              }
              acc[existingIndex] = current;
            }
          }
          
          return acc;
        }, []);
        
        // Store the full, deduplicated list in the cache, NOT just the top 10
        const sortedRankings = deduplicatedRankings.sort((a, b) => b.value - a.value); // Default sort for consistency
        
        // Debug for problematic metrics
        if (metric.id === 'gdp' || metric.id === 'gdpPerCapita' || metric.id === 'population') {
          console.log(`🔍 ${metric.title} Debug - Found ${validRankings.length} valid countries total, ${deduplicatedRankings.length} after deduplication.`);
          console.log(`Top 10 by ${metric.title}:`);
          sortedRankings.forEach((country, index) => {
            if (metric.id === 'gdp') {
              const gdpTrillions = country.value / 1000000000000;
              console.log(`${index + 1}. ${country.name} (${country.code}): $${gdpTrillions.toFixed(2)}T (${country.year})`);
            } else if (metric.id === 'population') {
              const populationM = (country.value / 1000000).toFixed(1);
              console.log(`${index + 1}. ${country.name} (${country.code}): ${populationM}M (${country.year})`);
            } else {
              console.log(`${index + 1}. ${country.name} (${country.code}): $${country.value.toLocaleString()} (${country.year})`);
            }
          });
          
          // Debug Pakistan specifically - check for duplicates in validRankings
          const pakistanEntries = validRankings.filter(r => r.name === 'Pakistan' || r.code === 'PK');
          console.log(`🔍 Pakistan entries found: ${pakistanEntries.length}`);
          pakistanEntries.forEach((entry, index) => {
            if (metric.id === 'gdp') {
              console.log(`  ${index + 1}. Pakistan GDP: $${(entry.value / 1000000000).toFixed(1)}B (${entry.year})`);
            } else if (metric.id === 'population') {
              const populationM = (entry.value / 1000000).toFixed(1);
              console.log(`  ${index + 1}. Pakistan Population: ${populationM}M (${entry.year})`);
            } else {
              console.log(`  ${index + 1}. Pakistan GDP Per Capita: $${entry.value.toLocaleString()} (${entry.year})`);
            }
          });
          
          // Show final Pakistan entry after deduplication
          const finalPakistanEntry = deduplicatedRankings.find(r => r.name === 'Pakistan' || r.code === 'PK');
          if (finalPakistanEntry) {
            if (metric.id === 'gdp') {
              console.log(`🔍 Final Pakistan GDP after deduplication: $${(finalPakistanEntry.value / 1000000000).toFixed(1)}B (${finalPakistanEntry.year})`);
            } else if (metric.id === 'population') {
              const populationM = (finalPakistanEntry.value / 1000000).toFixed(1);
              console.log(`🔍 Final Pakistan Population after deduplication: ${populationM}M (${finalPakistanEntry.year})`);
            } else {
              console.log(`🔍 Final Pakistan GDP Per Capita after deduplication: $${finalPakistanEntry.value.toLocaleString()} (${finalPakistanEntry.year})`);
            }
          }
          
          // Debug China entries
          const chinaEntries = validRankings.filter(r => 
            r.name.includes('China') || r.code === 'CN' || r.code === 'HK' || r.code === 'MO'
          );
          console.log('🔍 China-related entries:');
          chinaEntries.forEach(entry => {
            if (metric.id === 'gdp') {
              const gdpTrillions = entry.value / 1000000000000;
              console.log(`  - ${entry.name} (${entry.code}): $${gdpTrillions.toFixed(2)}T (${entry.year})`);
            } else if (metric.id === 'population') {
              const populationM = (entry.value / 1000000).toFixed(1);
              console.log(`  - ${entry.name} (${entry.code}): ${populationM}M (${entry.year})`);
            } else {
              console.log(`  - ${entry.name} (${entry.code}): $${entry.value.toLocaleString()} (${entry.year})`);
            }
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
    if (!selectedMetric || !bulkCache[selectedMetric.id]) {
      return Array.from({ length: 10 }, (_, i) => ({
        name: 'Loading...',
        code: `LC${i}`,
        flag: '...',
        value: 0,
        year: '...',
        source: '...'
      }));
    }

    const currentData = bulkCache[selectedMetric.id];
    
    // Sort the full dataset based on the selected view (highest or lowest)
    const sortedData = [...currentData].sort((a, b) => {
      if (a.value === null || a.value === undefined) return 1;
      if (b.value === null || b.value === undefined) return -1;

      // When showing HIGHEST:
      // - If higher is better, sort descending (B-A) to get the largest values at the top.
      // - If lower is better, sort ascending (A-B) to get the smallest values at the top.
      if (showHighest) {
        return selectedMetric.higherIsBetter ? b.value - a.value : a.value - b.value;
      } 
      // When showing LOWEST:
      // - If higher is better, sort ascending (A-B) to get the smallest values at the top.
      // - If lower is better, sort descending (B-A) to get the largest values at the top.
      else {
        return selectedMetric.higherIsBetter ? a.value - b.value : b.value - a.value;
      }
    });

    // Then slice the top 10 from the sorted list
    return sortedData.slice(0, 10);
  };

  const formatValue = (value: number, unit: string) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
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
      case 1: return <Trophy className="text-yellow-400" size={24} />;
      case 2: return <Medal className="text-slate-400" size={24} />;
      case 3: return <Award className="text-orange-500" size={24} />;
      default: return <span className="text-xl font-bold text-gray-500">{rank}</span>;
    }
  };

  const currentRankings = getCurrentRankings();
  const loadingProgress = loadingState.totalMetrics > 0 ? (loadingState.loadedMetrics / loadingState.totalMetrics) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full p-4 bg-gray-900/70 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link 
                href="/"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">Back to Comparison</span>
                <span className="sm:hidden">Back</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="mr-2 sm:mr-3 text-blue-600" size={24} />
                <span className="hidden sm:inline">World Bank Rankings</span>
                <span className="sm:hidden">Rankings</span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={loadAllWorldBankData}
                disabled={loadingState.isLoading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <RefreshCw size={16} className={loadingState.isLoading ? 'animate-spin' : ''} />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
          </div>

          {/* Ultra-fast loading indicator */}
          {loadingState.isLoading && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Zap className="text-blue-500 animate-pulse" size={20} />
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    Loading data: {loadingState.loadedMetrics}/{loadingState.totalMetrics} metrics
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

              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Metric Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Filter className="mr-2" size={20} />
                  <span className="hidden sm:inline">Select Metric ({worldBankMetrics.length} available)</span>
                  <span className="sm:hidden">Metrics ({worldBankMetrics.length})</span>
                </h2>
                <button
                  onClick={() => setShowMetricDropdown(!showMetricDropdown)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-transform duration-200"
                  style={{ transform: showMetricDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  ▼
                </button>
              </div>
              
              {/* Current Selection Display */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Current:</span>
                    <span className="text-sm text-blue-800 dark:text-blue-200">{selectedMetric.title}</span>
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400">{selectedMetric.category}</span>
                </div>
              </div>

              {/* Collapsible Metric Selection */}
              <div className={`transition-all duration-300 overflow-hidden ${showMetricDropdown ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
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
                          setShowHighest(true);
                          // Auto-collapse dropdown after selection on mobile
                          if (window.innerWidth < 1024) {
                            setShowMetricDropdown(false);
                          }
                        }}
                        disabled={!isLoaded}
                        className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all duration-200 ${
                          selectedMetric.id === metric.id
                            ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 text-blue-700 dark:text-blue-300'
                            : isLoaded
                            ? 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent text-gray-700 dark:text-gray-300'
                            : 'bg-gray-100 dark:bg-gray-800 border-2 border-transparent text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm sm:text-base truncate pr-2">{metric.title}</div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <span className="text-base sm:text-lg">🏦</span>
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
          </div>

          {/* Main Content - Rankings */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">
                      {showHighest ? 'Top 10 Highest' : 'Top 10 Lowest'}: {selectedMetric.title}
                    </h2>
                    <p className="text-blue-100 mb-4 text-sm sm:text-base">{selectedMetric.description}</p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center space-x-2">
                        <Globe size={16} />
                        <span className="text-sm">🏦 World Bank</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{countries.length} countries analyzed</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowHighest(!showHighest)}
                      className="flex items-center justify-center space-x-2 bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      {showHighest ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                      <span className="text-sm">
                        {showHighest ? 'Show Lowest 10' : 'Show Highest 10'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Rankings List */}
              <div className="p-4 sm:p-6">
                {loadingState.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <div className="text-center">
                      <div className="text-gray-600 dark:text-gray-400 mb-2 text-sm sm:text-base">
                        Loading all World Bank metrics in parallel...
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Bulk loading: {loadingState.loadedMetrics}/{loadingState.totalMetrics} complete
                      </div>
                    </div>
                  </div>
                ) : currentRankings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400 mb-2 text-sm sm:text-base">
                      No data available for this metric
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                      This metric may not have sufficient data in the World Bank database
                    </div>
                  </div>
                ) : (
                  <div className="relative box-content py-2">
                    <div className="space-y-2 sm:space-y-3" key={`${selectedMetric.id}-${showHighest}`}>
                      {currentRankings.map((country, index) => {
                        return (
                          <div
                            key={country.code}
                            className="p-3 sm:p-4 rounded-lg bg-gray-800/50 hover:bg-gray-700/60 border border-transparent hover:border-indigo-500/50 transition-all duration-200"
                          >
                            <div className="flex items-center gap-2 sm:gap-4">
                              <div className="flex-none w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-base sm:text-lg font-bold">
                                {getRankIcon(index + 1)}
                              </div>
                              <div className="flex-shrink-0">
                                <Image
                                  src={`https://flagcdn.com/w160/${country.code.toLowerCase()}.png`}
                                  alt={`${country.name} flag`}
                                  width={64}
                                  height={40}
                                  className="h-6 w-8 sm:h-8 sm:w-12 rounded-sm object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm sm:text-base font-semibold text-white truncate">{country.name}</p>
                                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                                  Source: {country.source} ({country.year})
                                </p>
                                <p className="text-xs text-gray-400 sm:hidden">
                                  {country.year}
                                </p>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <p className="text-sm sm:text-base font-bold text-white">
                                  {formatValue(country.value, selectedMetric.unit)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-xs text-gray-500 mt-4 text-center px-4 sm:px-6 pb-4">
                {currentRankings.length > 0 && <p>Latest data from {currentRankings[0].year} via {currentRankings[0].source}. All values are for the most recent year available per country.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 