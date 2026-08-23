'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart3, DollarSign, Users, Activity, Globe, MapPin, Sun, Moon, ArrowUp,
  Heart, ExternalLink, BookOpen,
} from 'lucide-react';
import { countries, getCountry, type Country } from '../utils/countries';
import { CountryPicker, MAX_COMPARISON } from '../components/CountryPicker';
import { useCountryData } from '../hooks/useCountryData';
import { MetricSection } from '../components/MetricSection';
import { CollapsibleInfoSection } from '../components/CollapsibleInfoSection';
import { sections, sectionMetrics, sourceColors, getSourceColor } from '../lib/metricCatalog';

const DEFAULT_SELECTION = ['US'];

/**
 * Read a country selection out of the query string, e.g. `?countries=US,BR,JP`.
 *
 * Unknown or duplicate codes are dropped rather than rejected, so a hand-edited or
 * out-of-date link still opens on whatever it got right.
 */
function selectionFromSearch(search: string): Country[] {
  const raw = new URLSearchParams(search).get('countries');
  const codes = (raw ? raw.split(',') : DEFAULT_SELECTION)
    .map(code => code.trim().toUpperCase())
    .filter(Boolean);

  const seen = new Set<string>();
  const resolved: Country[] = [];
  for (const code of codes) {
    if (seen.has(code)) continue;
    const country = getCountry(code);
    if (country) {
      seen.add(code);
      resolved.push(country);
    }
    if (resolved.length === MAX_COMPARISON) break;
  }

  return resolved.length ? resolved : [getCountry(DEFAULT_SELECTION[0])!];
}

export default function HomePage() {
  // Starts at the default rather than reading the URL here: this page is
  // statically prerendered, so the first client render has to match the server's
  // HTML. The URL is adopted on mount instead, just below.
  const [selectedCountries, setSelectedCountries] = useState<Country[]>(
    () => [getCountry(DEFAULT_SELECTION[0])!]
  );
  /**
   * False until the query string has been read. The data effect waits on this:
   * otherwise the default selection would kick off a full fetch that the URL's
   * selection immediately supersedes.
   */
  const [urlAdopted, setUrlAdopted] = useState(false);

  const { countryStats, loading, error, reload } = useCountryData(
    selectedCountries,
    urlAdopted
  );
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

  // Adopt the selection named in the query string, once, after hydration.
  useEffect(() => {
    setSelectedCountries(selectionFromSearch(window.location.search));
    setUrlAdopted(true);
  }, []);

  // Keep the query string in step with the selection so a comparison can be
  // bookmarked, shared or reloaded. `replaceState` rather than `pushState`: each
  // added country should not become its own back-button step.
  useEffect(() => {
    if (!urlAdopted) return;

    const codes = selectedCountries.map(c => c.code).join(',');
    const url = new URL(window.location.href);

    if (url.searchParams.get('countries') === codes) return;

    url.searchParams.set('countries', codes);
    window.history.replaceState(null, '', url);
  }, [selectedCountries, urlAdopted]);

  // Back/forward should move between comparisons, not just scroll position.
  useEffect(() => {
    const handlePopState = () => {
      setSelectedCountries(selectionFromSearch(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
    // Only the two scroll-position toggles need the scroll event, and reading
    // `scrollY` alone does not force layout. Coalesce to one read per frame.
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const scrollY = window.scrollY;
        setShowScrollTop(scrollY > 400);
        setShowStickyNav(scrollY > 600);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Which section is currently in view. This used to be recomputed inside the
  // scroll handler, calling getElementById and reading offsetTop for all seven
  // sections on every scroll event - a forced synchronous layout per frame.
  // IntersectionObserver gets the same answer from the browser for free.
  useEffect(() => {
    const elements = sections
      .map(section => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.intersectionRatio);
          } else {
            visible.delete(entry.target.id);
          }
        }

        if (visible.size === 0) return;

        // Nearest to the top of the viewport wins, matching document order.
        const active = sections.find(section => visible.has(section.id));
        if (active) setActiveSection(active.id);
      },
      // Bias the band towards the upper part of the viewport so the highlighted
      // section is the one the reader is actually looking at.
      { rootMargin: '-20% 0px -70% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [selectedCountries.length]);

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
      {/* Header */ }
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="text-center relative">
            <div className="absolute top-0 right-0 flex items-center space-x-1 sm:space-x-2">
              <Link
                href="/top10"
                className="flex min-h-11 items-center space-x-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors duration-200 hover:bg-blue-700 sm:space-x-2 sm:px-4 sm:text-sm touch-manipulation"
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Top 10 Rankings</span>
                <span className="sm:hidden">Top 10</span>
              </Link>
              <button
                onClick={() => setDarkMode(!darkMode) }
                className="flex items-center justify-center min-w-11 min-h-11 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 touch-manipulation"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                ) }
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
            ) }
            {error && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300 sm:text-base">
                <span>{error}</span>
                <button
                  onClick={reload}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700"
                >
                  Try again
                </button>
              </div>
            ) }
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Country Selection */ }
        <div className="mb-8">
          <CountryPicker
            selectedCountries={selectedCountries }
            onSelect={handleCountrySelect }
            countries={countries }
          />
        </div>

        {/* Expandable Navigation (Desktop) */ }
        <div className="mb-8 hidden lg:block">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {sections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSections[section.id];
              const metrics = sectionMetrics[section.id as keyof typeof sectionMetrics] || [];
              
              return (
                <div key={section.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  {/* Section Header */ }
                  <div className="flex items-center">
                    <button
                      onClick={() => scrollToSection(section.id) }
                      className="flex-1 flex items-center space-x-3 px-6 py-4 text-left font-medium transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Icon size={18} />
                      <span>{section.label}</span>
                    </button>
                    
                    {/* Expand/Collapse Button */ }
                    <button
                      onClick={() => toggleSectionExpansion(section.id) }
                      className="flex items-center justify-center min-w-11 min-h-11 px-4 py-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 touch-manipulation"
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${section.label} metrics` }
                    >
                      <svg 
                        className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}` }
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Expandable Metrics List */ }
                  {isExpanded && (
                    <div className="px-6 pb-4 bg-gray-50 dark:bg-gray-700/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {metrics.map((metric, index) => (
                          <button
                            key={index }
                            onClick={() => scrollToMetric(metric) }
                            className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 py-1 px-2 rounded-md hover:bg-white dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 text-left group"
                          >
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0 group-hover:bg-blue-500"></div>
                            <span className="group-hover:underline">{metric}</span>
                          </button>
                        )) }
                      </div>
                      {metrics.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No specific metrics available
                        </p>
                      ) }
                    </div>
                  ) }
                </div>
              );
            }) }
          </div>
        </div>

        {/* Mobile Navigation */ }
        <div className="mb-8 lg:hidden">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {sections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSections[section.id];
              const metrics = sectionMetrics[section.id as keyof typeof sectionMetrics] || [];
              
              return (
                <div key={section.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  {/* Section Header */ }
                  <div className="flex items-center">
                    <button
                      onClick={() => scrollToSection(section.id) }
                      className="flex-1 flex items-center space-x-3 px-4 py-3 text-left font-medium transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Icon size={16} />
                      <span className="text-sm">{section.label}</span>
                    </button>
                    
                    {/* Expand/Collapse Button */ }
                    <button
                      onClick={() => toggleSectionExpansion(section.id) }
                      className="flex items-center justify-center min-w-11 min-h-11 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 touch-manipulation"
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${section.label} metrics` }
                    >
                      <svg 
                        className={`w-3 h-3 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}` }
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Expandable Metrics List */ }
                  {isExpanded && (
                    <div className="px-4 pb-3 bg-gray-50 dark:bg-gray-700/30">
                      <div className="grid grid-cols-1 gap-1">
                        {metrics.map((metric, index) => (
                          <button
                            key={index }
                            onClick={() => scrollToMetric(metric) }
                            className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 py-1 px-2 rounded-md hover:bg-white dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 text-left group"
                          >
                            <div className="w-1 h-1 bg-blue-400 rounded-full flex-shrink-0 group-hover:bg-blue-500"></div>
                            <span className="group-hover:underline">{metric}</span>
                          </button>
                        )) }
                      </div>
                      {metrics.length === 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                          No specific metrics available
                        </p>
                      ) }
                    </div>
                  ) }
                </div>
              );
            }) }
          </div>
        </div>

        {/* Collapsible Country Info */ }
        {selectedCountries.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setCountryInfoExpanded(!countryInfoExpanded) }
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
                  {/* Desktop view: Show flags and country names */ }
                  <div className="hidden sm:flex space-x-2">
                    {selectedCountries.slice(0, 3).map((country) => (
                      <div key={country.code} className="flex items-center space-x-1">
                        <Image 
                          src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png` }
                          alt={`${country.name} flag` }
                          width={20 }
                          height={15 }
                          className="w-5 h-auto mr-1"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {country.name }
                        </span>
                      </div>
                    )) }
                    {selectedCountries.length > 3 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        +{selectedCountries.length - 3} more
                      </span>
                    ) }
                  </div>
                  
                  {/* Mobile view: Show flags only */ }
                  <div className="sm:hidden flex space-x-1">
                    {selectedCountries.slice(0, 5).map((country) => (
                      <Image 
                        key={country.code }
                        src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png` }
                        alt={`${country.name} flag` }
                        width={16 }
                        height={12 }
                        className="w-4 h-auto"
                      />
                    )) }
                    {selectedCountries.length > 5 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        +{selectedCountries.length - 5 }
                      </span>
                    ) }
                  </div>
                  
                  <div className={`transform transition-transform duration-200 ${countryInfoExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </div>
              </div>
            </button>
            
            {countryInfoExpanded && (
              <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                {/* Country Selection Cards */ }
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Select a country to view detailed information:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                    {selectedCountries.map((country) => {
                      const isSelected = selectedCountryInfo === country.code;
                      return (
                        <button
                          key={country.code }
                          onClick={() => setSelectedCountryInfo(country.code) }
                          className={`
                            relative flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 
                            ${isSelected 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg transform scale-105' 
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                            }
                          ` }
                        >
                          {/* Selection Indicator */ }
                          <div className={`
                            flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                            ${isSelected 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300 dark:border-gray-500 bg-transparent'
                            }
                          `}>
                            {isSelected && (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>
                            ) }
                          </div>
                          
                          {/* Country Info */ }
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <Image 
                              src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png` }
                              alt={`${country.name} flag` }
                              width={24 }
                              height={18 }
                              className="w-5 h-auto sm:w-6"
                            />
                            <span className={`
                              text-xs sm:text-sm font-medium truncate transition-colors duration-200
                              ${isSelected 
                                ? 'text-blue-700 dark:text-blue-300' 
                                : 'text-gray-900 dark:text-white'
                              }
                            `}>
                              {country.name }
                            </span>
                          </div>
                          
                          {/* Selected Badge */ }
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) }
                        </button>
                      );
                    }) }
                  </div>
                </div>

                {/* Country Information Display */ }
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
                          src={`https://flagcdn.com/w40/${selectedCountry?.code.toLowerCase()}.png` }
                          alt={`${selectedCountry?.name} flag` }
                          width={32 }
                          height={24 }
                          className="w-8 h-auto"
                        />
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCountry?.name}</h3>
                      </div>
                      
                      {/* Basic Information */ }
                      <CollapsibleInfoSection title="Basic Information" isExpanded={infoSectionsExpanded.basic} onToggle={() => toggleInfoSection('basic')}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center text-sm sm:text-base">
                              <Globe className="mr-2" size={14} />
                              Region
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                              {restData?.region || 'N/A'} {restData?.subregion && `/ ${restData.subregion}` }
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center text-sm sm:text-base">
                              <MapPin className="mr-2" size={14} />
                              Capital
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                              {restData?.capital?.join(', ') || 'N/A' }
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
                            ) }
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center text-sm sm:text-base">
                              <DollarSign className="mr-2" size={14} />
                              Currency
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                              {restData?.currencies ? Object.entries(restData.currencies).map(([code, currency]) => 
                                `${currency.name} (${code})`
                              ).join(', ') : 'N/A' }
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center text-sm sm:text-base">
                              <Globe className="mr-2" size={14} />
                              Internet Country Code
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                              {factbook?.internetCountryCode || 'N/A' }
                              {factbook?.internetCountryCode && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                  Top-level domain
                                </span>
                              ) }
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                              <Users className="mr-2" size={16} />
                              Population
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300">
                              {totalPopulation ? formatPopulation(totalPopulation) : 'N/A' }
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                              <MapPin className="mr-2" size={16} />
                              Area
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300">
                              {factbook?.area ? formatArea(factbook.area) : 'N/A' }
                            </p>
                          </div>

                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white flex items-center">
                              <Activity className="mr-2" size={16} />
                              Population Density
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300">
                              {totalPopulation && factbook?.area ? 
                                formatPopulationDensity(totalPopulation / factbook.area) : 'N/A' }
                            </p>
                          </div>
                        </div>
                      </CollapsibleInfoSection>

                      {/* Demographics */ }
                      {(factbook?.malePopulation || factbook?.femalePopulation || factbook?.ethnicGroups || factbook?.religions) && (
                        <CollapsibleInfoSection title="Demographics" isExpanded={infoSectionsExpanded.demographics} onToggle={() => toggleInfoSection('demographics')}>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {factbook?.malePopulation && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Male Population</h5>
                                <p className="text-gray-700 dark:text-gray-300">{formatPopulation(factbook.malePopulation)}</p>
                              </div>
                            ) }
                            
                            {factbook?.femalePopulation && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Female Population</h5>
                                <p className="text-gray-700 dark:text-gray-300">{formatPopulation(factbook.femalePopulation)}</p>
                              </div>
                            ) }
                            
                            {factbook?.medianAge && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Median Age</h5>
                                <p className="text-gray-700 dark:text-gray-300">{factbook.medianAge}</p>
                              </div>
                            ) }
                            
                            {factbook?.ethnicGroups && (
                              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Ethnic Groups</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.ethnicGroups}</p>
                              </div>
                            ) }
                            
                            {factbook?.religions && (
                              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Religions</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.religions}</p>
                              </div>
                            ) }
                          </div>
                        </CollapsibleInfoSection>
                      ) }

                      {/* Geography & Climate */ }
                      {(factbook?.location || factbook?.climate || factbook?.naturalResources) && (
                        <CollapsibleInfoSection title="Geography & Climate" isExpanded={infoSectionsExpanded.geography} onToggle={() => toggleInfoSection('geography')}>
                          <div className="space-y-4">
                            {factbook?.location && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Location</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.location}</p>
                              </div>
                            ) }
                            
                            {factbook?.climate && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Climate</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.climate}</p>
                              </div>
                            ) }
                            
                            {factbook?.naturalResources && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Natural Resources</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.naturalResources}</p>
                              </div>
                            ) }
                          </div>
                        </CollapsibleInfoSection>
                      ) }

                      {/* Government & Politics */ }
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
                                  })() }
                                </p>
                              </div>
                            ) }
                            
                            {factbook?.etymology && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Etymology</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.etymology}</p>
                              </div>
                            ) }
                            
                            {factbook?.suffrage && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Suffrage</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.suffrage}</p>
                              </div>
                            ) }
                          </div>
                        </CollapsibleInfoSection>
                      ) }

                      {/* Languages & Timezones */ }
                      {(restData?.languages || restData?.timezones) && (
                        <CollapsibleInfoSection title="Languages & Timezones" isExpanded={infoSectionsExpanded.languages} onToggle={() => toggleInfoSection('languages')}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {restData?.languages && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Languages</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">
                                  {Object.values(restData.languages).join(', ') }
                                </p>
                              </div>
                            ) }
                            
                            {restData?.timezones && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Timezones</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">
                                  {restData.timezones.join(', ') }
                                </p>
                              </div>
                            ) }
                          </div>
                        </CollapsibleInfoSection>
                      ) }

                      {/* Economic Information */ }
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
                                  {stats.enhancedInfo.incomeGroupData.value || 'N/A' }
                                </p>
                              </div>
                            ) }
                            
                            {factbook?.industries && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Industries</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.industries}</p>
                              </div>
                            ) }
                            
                            {factbook?.agriculturalProducts && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">Agricultural Products</h5>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{factbook.agriculturalProducts}</p>
                              </div>
                            ) }
                          </div>
                        </CollapsibleInfoSection>
                      ) }

                      {/* Sources Section */ }
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                        <CollapsibleInfoSection 
                          title={
                            <span className="flex items-center">
                              <BookOpen className="mr-2" size={16} />
                              Data Sources
                            </span>
                          } 
                          isExpanded={infoSectionsExpanded.sources} 
                          onToggle={() => toggleInfoSection('sources') }
                          titleClassName="border-none"
                        >
                          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                            <div className="space-y-3">
                              {/* Rest Countries API */ }
                              {restData && (
                                <div className="flex items-start space-x-3">
                                  <div 
                                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                    style={{ backgroundColor: getSourceColor('RestCountries') } }
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
                              ) }
                              
                              {/* CIA World Factbook Source */ }
                              {factbook && (
                                <div className="flex items-start space-x-3">
                                  <div 
                                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                    style={{ backgroundColor: getSourceColor(factbook.source) } }
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
                              ) }
                              
                              {/* Political Regime Source */ }
                              {stats?.enhancedInfo?.politicalRegimeData && (
                                <div className="flex items-start space-x-3">
                                  <div 
                                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                    style={{ backgroundColor: getSourceColor(stats.enhancedInfo.politicalRegimeData.source) } }
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
                              ) }
                              
                              {/* World Bank Income Group Source */ }
                              {stats?.enhancedInfo?.incomeGroupData && (
                                <div className="flex items-start space-x-3">
                                  <div 
                                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                    style={{ backgroundColor: getSourceColor(stats.enhancedInfo.incomeGroupData.source) } }
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
                              ) }
                            </div>
                          </div>
                        </CollapsibleInfoSection>
                      </div>
                    </div>
                  );
                })() }
              </div>
            ) }
          </div>
        ) }

        {/* Content */ }
        {selectedCountries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500 dark:text-gray-400">
              Please select at least one country to view data
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Overview Section */ }
            <MetricSection
              sectionId="overview"
              title="Overview"
              metrics={sectionMetrics.overview }
              countries={selectedCountries }
              countryStats={countryStats }
              loading={loading }
              activeTooltip={activeTooltip }
              toggleTooltip={toggleTooltip }
              isExpanded={contentSectionsExpanded.overview }
              onToggle={() => toggleContentSectionExpansion('overview') }
            />

            {/* Economy & Development Section */ }
            <MetricSection
              sectionId="economy"
              title="Economy & Development"
              metrics={sectionMetrics.economy }
              countries={selectedCountries }
              countryStats={countryStats }
              loading={loading }
              activeTooltip={activeTooltip }
              toggleTooltip={toggleTooltip }
              isExpanded={contentSectionsExpanded.economy }
              onToggle={() => toggleContentSectionExpansion('economy') }
            />

            {/* Social & Environment Section */ }
            <MetricSection
              sectionId="social"
              title="Social & Environment"
              metrics={sectionMetrics.social }
              countries={selectedCountries }
              countryStats={countryStats }
              loading={loading }
              activeTooltip={activeTooltip }
              toggleTooltip={toggleTooltip }
              isExpanded={contentSectionsExpanded.social }
              onToggle={() => toggleContentSectionExpansion('social') }
            />

            {/* Trade Section */ }
            <MetricSection
              sectionId="trade"
              title="Trade"
              metrics={sectionMetrics.trade }
              countries={selectedCountries }
              countryStats={countryStats }
              loading={loading }
              activeTooltip={activeTooltip }
              toggleTooltip={toggleTooltip }
              isExpanded={contentSectionsExpanded.trade }
              onToggle={() => toggleContentSectionExpansion('trade') }
            />

            {/* Detailed Trade Dashboard */ }
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
                {/* Country Selection for Trade Data */ }
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
                            key={country.code }
                            onClick={() => setSelectedTradeCountry(country.code) }
                            className={`
                              relative flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200 
                              ${isSelected 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg transform scale-105' 
                                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                              }
                            ` }
                          >
                            {/* Selection Indicator */ }
                            <div className={`
                              flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                              ${isSelected 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300 dark:border-gray-500 bg-transparent'
                              }
                            `}>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              ) }
                            </div>
                            
                            {/* Country Info */ }
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <Image 
                                src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png` }
                                alt={`${country.name} flag` }
                                width={20 }
                                height={15 }
                                className="w-5 h-auto mr-3"
                              />
                              <span className={`
                                text-sm font-medium truncate transition-colors duration-200
                                ${isSelected 
                                  ? 'text-blue-700 dark:text-blue-300' 
                                  : 'text-gray-900 dark:text-white'
                                }
                              `}>
                                {country.name }
                              </span>
                            </div>
                            
                            {/* Selected Badge */ }
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            ) }
                          </button>
                        );
                      }) }
                    </div>
                  </div>
                ) }

                {/* Detailed Trade Data Display */ }
                {selectedTradeCountry && (() => {
                  const stats = countryStats[selectedTradeCountry];
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const factbook = stats?.enhancedInfo?.factbookData;
                  const comtrade = stats?.enhancedInfo?.comtradeData;
                  const selectedCountry = selectedCountries.find(c => c.code === selectedTradeCountry);
                  
                  return (
                    <div key={selectedTradeCountry} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                      {/* Country Header */ }
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Image 
                              src={`https://flagcdn.com/w40/${selectedCountry?.code.toLowerCase()}.png` }
                              alt={`${selectedCountry?.name} flag` }
                              width={24 }
                              height={18 }
                              className="w-6 h-auto mr-3"
                            />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedCountry?.name}</h3>
                          </div>
                          {comtrade && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Data from {comtrade.year} • UN Comtrade
                            </div>
                          ) }
                        </div>
                      </div>
                      
                      <div className="p-6">
                        {/* Trade Overview */ }
                        {comtrade && (
                          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                              <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">Total Exports</h4>
                              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                {comtrade.totalExports?.formatted || 'N/A' }
                              </p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Total Imports</h4>
                              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                {comtrade.totalImports?.formatted || 'N/A' }
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
                                {comtrade.tradeBalance?.status === 'surplus' ? '+' : '-' }
                                {comtrade.tradeBalance?.formatted || 'N/A' }
                              </p>
                            </div>
                          </div>
                        ) }

                        {/* Trade Commodities Section */ }
                        {((comtrade?.topExportCommodities && comtrade.topExportCommodities.length > 0) || (comtrade?.topImportCommodities && comtrade.topImportCommodities.length > 0)) && (
                          <div className="mb-8">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                              <span className="text-base mr-2">📦</span>
                              Trade Commodities
                            </h4>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Export Commodities */ }
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
                                            {index + 1 }
                                          </span>
                                          <span className="text-gray-900 dark:text-white font-medium">
                                            {commodity.commodity }
                                          </span>
                                        </div>
                                      </div>
                                    )) }
                                  </div>
                                </div>
                              ) }
                              
                              {/* Import Commodities */ }
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
                                            {index + 1 }
                                          </span>
                                          <span className="text-gray-900 dark:text-white font-medium">
                                            {commodity.commodity }
                                          </span>
                                        </div>
                                      </div>
                                    )) }
                                  </div>
                                </div>
                              ) }
                            </div>
                          </div>
                        ) }

                        {/* Trade Partners and Traditional Commodities Grid */ }
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Top Export Partners */ }
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
                                        {index + 1 }
                                      </span>
                                      <span className="font-medium text-gray-900 dark:text-white">{partner.country}</span>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-gray-900 dark:text-white">
                                        {partner.formatted || 'N/A' }
                                      </div>
                                    </div>
                                  </div>
                                )) }
                              </div>
                            </div>
                          ) }

                          {/* Top Import Partners */ }
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
                                        {index + 1 }
                                      </span>
                                      <span className="font-medium text-gray-900 dark:text-white">{partner.country}</span>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-gray-900 dark:text-white">
                                        {partner.formatted || 'N/A' }
                                      </div>
                                    </div>
                                  </div>
                                )) }
                              </div>
                            </div>
                          ) }
                        </div>

                        {/* Show message if no data */ }
                        {!comtrade && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            {loading ? (
                              <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                Loading trade data...
                              </span>
                            ) : (
                              "Trade data not available"
                            ) }
                          </div>
                        ) }
                      </div>
                    </div>
                  );
                })() }
              </div>
            </section>

            {/* Safety & Crime Section */ }
            <MetricSection
              sectionId="safety"
              title="Safety & Crime"
              metrics={sectionMetrics.safety }
              countries={selectedCountries }
              countryStats={countryStats }
              loading={loading }
              activeTooltip={activeTooltip }
              toggleTooltip={toggleTooltip }
              isExpanded={contentSectionsExpanded.safety }
              onToggle={() => toggleContentSectionExpansion('safety') }
            />

            {/* Climate Section */ }
            <MetricSection
              sectionId="climate"
              title="Climate"
              metrics={sectionMetrics.climate }
              countries={selectedCountries }
              countryStats={countryStats }
              loading={loading }
              activeTooltip={activeTooltip }
              toggleTooltip={toggleTooltip }
              isExpanded={contentSectionsExpanded.climate }
              onToggle={() => toggleContentSectionExpansion('climate') }
            />

            {/* Sources Section */ }
            <section id="sources" className="scroll-mt-8">
              <div className="mb-12">
                <button
                  onClick={() => toggleSectionExpansion('sources') }
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
              ) }
            </section>
          </div>
        ) }
      </div>

      {/* Floating Sticky Navigation */ }
      {showStickyNav && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full shadow-xl border border-gray-200/50 dark:border-gray-700/50 px-2 py-2">
            <div className="flex items-center gap-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id }
                    onClick={() => scrollToSection(section.id) }
                    className={`
                      group relative flex items-center justify-center p-3 rounded-full transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-500 text-white shadow-lg scale-110' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
                      }
                    ` }
                    title={section.label }
                  >
                    <Icon size={18} />
                    
                    {/* Tooltip */ }
                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {section.label }
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
                      </div>
                    </div>
                  </button>
                );
              }) }
            </div>
          </div>
        </div>
      ) }

      {/* Scroll to Top Button */ }
      {/* Footer */ }
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

      {showScrollTop && (
        <button
          onClick={scrollToTop }
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      ) }
    </div>
  );
} 