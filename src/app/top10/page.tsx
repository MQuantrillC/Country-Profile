'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BarChart3, TrendingUp, Globe, Trophy, Medal, Award, TrendingDown, ArrowLeft, RefreshCw, Zap, Database, Filter, Search, Heart, ExternalLink } from 'lucide-react';
import { getCountry } from '@/utils/countries';
import { rankingMetrics, type RankingMetric, type RankingsPayload } from '@/lib/rankingMetrics';

interface CountryRanking {
  name: string;
  code: string;
  flag: string;
  value: number;
  year: string;
  source: string;
}


interface BulkDataCache {
  [metricId: string]: CountryRanking[];
}

interface LoadingState {
  isLoading: boolean;
  /** Metric ids the World Bank returned nothing for. */
  failed: string[];
  /** Set when the whole request failed, as opposed to individual metrics. */
  error: string | null;
}

export default function Top10Page() {
  const [selectedMetric, setSelectedMetric] = useState<RankingMetric>(rankingMetrics[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkCache, setBulkCache] = useState<BulkDataCache>({});
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    failed: [],
    error: null,
  });
  const [showHighest, setShowHighest] = useState(true);
  const [showMetricDropdown, setShowMetricDropdown] = useState(true);

  const categories = ['All', ...Array.from(new Set(rankingMetrics.map(m => m.category)))];

  const filteredMetrics = rankingMetrics.filter(metric => {
    const matchesCategory = selectedCategory === 'All' || metric.category === selectedCategory;
    const matchesSearch = metric.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         metric.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // One request for every metric. The route batches the World Bank calls, strips
  // aggregates and sorts, so there is nothing left to sift through here.
  const loadRankings = async () => {
    setLoadingState({ isLoading: true, failed: [], error: null });

    try {
      const response = await fetch('/api/rankings');
      if (!response.ok) throw new Error(`Rankings request failed: ${response.status}`);

      const payload: RankingsPayload = await response.json();

      const cache: BulkDataCache = {};
      for (const [metricId, entries] of Object.entries(payload.metrics)) {
        cache[metricId] = entries
          .map((entry) => {
            const country = getCountry(entry.code);
            if (!country) return null;
            return {
              name: country.name,
              code: country.code,
              flag: country.flag,
              value: entry.value,
              year: entry.year,
              source: payload.source,
            };
          })
          .filter((r): r is CountryRanking => r !== null);
      }

      setBulkCache(cache);
      setLoadingState({ isLoading: false, failed: payload.unavailable, error: null });
    } catch (error) {
      console.error('Could not load rankings:', error);
      setLoadingState({
        isLoading: false,
        failed: [],
        error: 'Rankings could not be loaded. Check your connection and try again.',
      });
    }
  };

  // Load all data on component mount
  useEffect(() => {
    loadRankings();
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
  const rankedCount = selectedMetric ? (bulkCache[selectedMetric.id]?.length ?? 0) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full p-4 bg-gray-900/70 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link 
                href="/"
                className="flex min-h-11 items-center space-x-2 text-blue-600 transition-colors duration-200 hover:text-blue-800 touch-manipulation"
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
                onClick={loadRankings}
                disabled={loadingState.isLoading}
                className="flex min-h-11 items-center space-x-2 rounded-lg bg-blue-600 px-3 py-2 text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-gray-400 sm:px-4 touch-manipulation"
              >
                <RefreshCw size={16} className={loadingState.isLoading ? 'animate-spin' : ''} />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
          </div>

          {loadingState.isLoading && (
            <div className="mt-4 flex items-center space-x-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <Zap className="animate-pulse text-blue-500" size={20} />
              <span className="font-semibold text-blue-700 dark:text-blue-300">
                Loading rankings for {rankingMetrics.length} metrics...
              </span>
            </div>
          )}

          {loadingState.error && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
              <span className="text-amber-800 dark:text-amber-200">{loadingState.error}</span>
              <button
                onClick={loadRankings}
                className="ml-4 rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* Success indicator */}
          {!loadingState.isLoading && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Database className="text-green-500" size={20} />
                <span className="font-semibold text-green-700 dark:text-green-300">
                  ✅ All data loaded! {rankingMetrics.length - loadingState.failed.length}/{rankingMetrics.length} metrics available
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
                  <span className="hidden sm:inline">Select Metric ({rankingMetrics.length} available)</span>
                  <span className="sm:hidden">Metrics ({rankingMetrics.length})</span>
                </h2>
                <button
                  onClick={() => setShowMetricDropdown(!showMetricDropdown)}
                  className="flex items-center justify-center min-w-11 min-h-11 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-transform duration-200 touch-manipulation"
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
                        <span className="text-sm">{currentRankings.length > 0 ? rankedCount : 0} countries ranked</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowHighest(!showHighest)}
                      className="flex min-h-11 items-center justify-center space-x-2 rounded-lg bg-white/20 px-3 py-2 transition-colors duration-200 hover:bg-white/30 sm:px-4 touch-manipulation"
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
                        Loading rankings...
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

      {/* Footer */}
      <footer className="py-6 px-4 bg-gray-900 border-t border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-1 text-gray-400 text-sm mb-2">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-400 fill-current" />
            <span>by Marco Quantrill</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center">
            <a 
              href="https://marco-portfolio-azure.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-1 hover:text-gray-300 transition-colors"
            >
              <span>Personal Page</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            
            <span>•</span>
            
            <a 
              href="mailto:quantrillmarco@gmail.com"
              className="hover:text-gray-300 transition-colors"
            >
              quantrillmarco@gmail.com
            </a>
            
            <span>•</span>
            
            <a 
              href="https://github.com/MQuantrillC" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-1 hover:text-gray-300 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
} 