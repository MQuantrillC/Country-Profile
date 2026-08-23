'use client';

// One collapsible section of the comparison: a table of metrics by country, with a
// raw/percentage toggle and the sources behind the figures.

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { MetricTooltip } from './MetricTooltip';
import type { Country } from '../utils/countries';
import type { CountryStats, DataWithSource, MetricReading, PartialReading } from '../types/country';
import { getMetricIcon, getMetricTooltip, getSourceColor, formatMetricValue } from '../lib/metricCatalog';
import {
  parseAlcoholConsumption, parseTobaccoUse, parseTobaccoUseMale, parseTobaccoUseFemale,
  parseAlcoholBeer, parseAlcoholWine, parseAlcoholSpirits, parseAlcoholOther,
} from '../lib/factbookParsers';

export const MetricSection = ({ 
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
  
  const getWorldBankMetricValue = (data: DataWithSource | undefined | null): MetricReading => {
    return {
      value: data?.value ?? null,
      source: 'World Bank Open Data',
      sourceDetail: data?.source ?? null,
      year: data?.year ?? null,
      status: data?.status ?? 'no-data',
    };
  };

  // Get value function for each metric
  /**
   * Resolve a metric to a value plus its provenance.
   *
   * Cases may omit `year`/`status`; `getMetricValue` fills those in so every
   * caller sees the same complete shape.
   */
  const resolveMetric = (metric: string, country: Country): PartialReading => {
    const stats = countryStats[country.code];
    if (!stats) return { value: null, source: null, sourceDetail: null, status: 'no-data' };

    switch (metric) {
      // Overview metrics
      case 'Total Population':
        return getWorldBankMetricValue(stats.population);
      case 'Area':
        return getWorldBankMetricValue(stats.area);
      case 'Population Density':
        return getWorldBankMetricValue(stats.populationDensity);
      case 'Urban Population %':
        return getWorldBankMetricValue(stats.urbanPopPct);
      case 'Rural Population %':
        return getWorldBankMetricValue(stats.ruralPopPct);
      case 'Net Migration Rate (per 1,000 people)':
        return { value: stats.enhancedInfo?.factbookData?.netMigrationRate ?? null, source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook' };
      case 'International Migrants':
        return { value: stats.enhancedInfo?.migrantsData?.value ?? null, source: 'UN DESA', sourceDetail: stats.enhancedInfo?.migrantsData?.source ?? null };
      
      // Economy metrics
      case 'GDP':
        return getWorldBankMetricValue(stats.gdp);
      case 'GDP Per Capita':
        return getWorldBankMetricValue(stats.gdpPerCapita);
      case 'GNI Per Capita':
        return getWorldBankMetricValue(stats.gniPerCapita);
      case 'Trade as % of GDP':
        return getWorldBankMetricValue(stats.tradeGDP);
      case 'Unemployment Rate':
        return getWorldBankMetricValue(stats.unemploymentRate);
      case 'Public Debt % of GDP': {
        const wbData = stats.publicDebtGDP;
        if (wbData?.value != null) {
          return getWorldBankMetricValue(wbData);
        }
        const fbValue = stats.enhancedInfo?.factbookData?.publicDebt;
        return {
          value: fbValue ?? null,
          source: fbValue != null ? 'CIA World Factbook' : null,
          sourceDetail: fbValue != null ? 'CIA World Factbook' : null };
      }
      case 'Military Expenditure % of GDP':
        return { value: stats.enhancedInfo?.factbookData?.militaryExpenditure ?? null, source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook' };
      case 'Gini Index':
        return { value: stats.enhancedInfo?.factbookData?.giniIndex ?? null, source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook' };
      case 'Tax Revenue as % of GDP':
        return { value: stats.enhancedInfo?.taxRevenueData?.value ?? null, source: 'UNU-WIDER', sourceDetail: stats.enhancedInfo?.taxRevenueData?.source ?? null };
      case 'Internet Users %':
        return getWorldBankMetricValue(stats.internetUsers);
      case 'Electricity Access %':
        return getWorldBankMetricValue(stats.electricityAccess);
      
      // Social metrics
      case 'Human Development Index (HDI)':
        return { value: stats.enhancedInfo?.hdiData?.hdi ?? null, source: 'UN HDI', sourceDetail: stats.enhancedInfo?.hdiData?.source ?? null };
      case 'Life Expectancy':
        return getWorldBankMetricValue(stats.lifeExpectancy);
      case 'Fertility Rate (births per woman)':
        return getWorldBankMetricValue(stats.fertilityRate);
      case 'Literacy Rate': {
        const wbData = stats.literacyRate;
        if (wbData?.value != null) {
          return getWorldBankMetricValue(wbData);
        }
        const fbValue = stats.enhancedInfo?.factbookData?.literacyRate;
        return {
          value: fbValue ?? null,
          source: fbValue != null ? 'CIA World Factbook' : null,
          sourceDetail: fbValue != null ? 'CIA World Factbook' : null };
      }
      case 'Education Spending % of GDP':
        return getWorldBankMetricValue(stats.educationSpendPctGDP);
      case 'Mean Years of Schooling':
        return { value: stats.enhancedInfo?.schoolingYearsData?.value ?? null, source: 'Barro-Lee', sourceDetail: stats.enhancedInfo?.schoolingYearsData?.source ?? null };
      case 'Extreme Poverty Rate':
        return { value: stats.enhancedInfo?.extremePovertyData?.value ?? null, source: 'Our World in Data', sourceDetail: stats.enhancedInfo?.extremePovertyData?.source ?? null };
      case 'Daily Caloric Supply':
        return { value: stats.enhancedInfo?.caloricSupplyData?.value ?? null, source: 'FAO', sourceDetail: stats.enhancedInfo?.caloricSupplyData?.source ?? null };
      case 'Income Share of Richest 1%':
        return { value: stats.enhancedInfo?.incomeShareRichest1Data?.value ?? null, source: 'World Inequality Database', sourceDetail: stats.enhancedInfo?.incomeShareRichest1Data?.source ?? null };
      case 'Income Share of Poorest 50%':
        return { value: stats.enhancedInfo?.incomeSharePoorest50Data?.value ?? null, source: 'World Inequality Database', sourceDetail: stats.enhancedInfo?.incomeSharePoorest50Data?.source ?? null };
      case 'Armed Forces Personnel':
        return { value: stats.enhancedInfo?.armedForcesPersonnelData?.value ?? null, source: 'Our World in Data', sourceDetail: stats.enhancedInfo?.armedForcesPersonnelData?.source ?? null };
      case 'Forest Coverage %':
        return getWorldBankMetricValue(stats.forestPct);
      case 'Agricultural Land %':
        return getWorldBankMetricValue(stats.agriculturalLandPct);
      case 'Alcohol Consumption (liters pure alcohol/year)':
        return { value: parseAlcoholConsumption(stats.enhancedInfo?.factbookData?.alcoholConsumption), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook' };
      case 'Beer Consumption (liters pure alcohol/year)':
        return { value: parseAlcoholBeer(stats.enhancedInfo?.factbookData?.alcoholConsumption), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook' };
      case 'Wine Consumption (liters pure alcohol/year)':
        return { value: parseAlcoholWine(stats.enhancedInfo?.factbookData?.alcoholConsumption), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook' };
      case 'Spirits Consumption (liters pure alcohol/year)':
        return { value: parseAlcoholSpirits(stats.enhancedInfo?.factbookData?.alcoholConsumption), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook' };
      case 'Other Alcohols Consumption (liters pure alcohol/year)':
        return { value: parseAlcoholOther(stats.enhancedInfo?.factbookData?.alcoholConsumption), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook' };
      case 'Tobacco Use (%)':
        return { value: parseTobaccoUse(stats.enhancedInfo?.factbookData?.tobaccoUse), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook' };
      case 'Tobacco Use - Male (%)':
        return { value: parseTobaccoUseMale(stats.enhancedInfo?.factbookData?.tobaccoUse), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook' };
      case 'Tobacco Use - Female (%)':
        return { value: parseTobaccoUseFemale(stats.enhancedInfo?.factbookData?.tobaccoUse), source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook' };
      
      // Safety metrics
      case 'Homicide Rate (per 100,000)':
        return getWorldBankMetricValue(stats.homicideRate);
      case 'Homicide Victims (Total)':
        return { value: stats.enhancedInfo?.crimeData?.victimData?.totalVictims ?? null, source: 'CTS/NSO', sourceDetail: stats.enhancedInfo?.crimeData?.source ?? null };
      case 'Homicide Arrests (Total)':
        return { value: stats.enhancedInfo?.crimeData?.totalArrests ?? null, source: 'CTS/NSO', sourceDetail: stats.enhancedInfo?.crimeData?.source ?? null };
      case 'Male Arrests':
        return { value: stats.enhancedInfo?.crimeData?.arrestsBySex?.male ?? null, source: 'CTS/NSO', sourceDetail: stats.enhancedInfo?.crimeData?.source ?? null };
      case 'Female Arrests':
        return { value: stats.enhancedInfo?.crimeData?.arrestsBySex?.female ?? null, source: 'CTS/NSO', sourceDetail: stats.enhancedInfo?.crimeData?.source ?? null };
      case 'Male Victims':
        return { value: stats.enhancedInfo?.crimeData?.victimData?.maleVictims ?? null, source: 'CTS/NSO', sourceDetail: stats.enhancedInfo?.crimeData?.source ?? null };
      case 'Female Victims':
        return { value: stats.enhancedInfo?.crimeData?.victimData?.femaleVictims ?? null, source: 'CTS/NSO', sourceDetail: stats.enhancedInfo?.crimeData?.source ?? null };
      case 'Prison Deaths':
        return { value: stats.enhancedInfo?.crimeData?.prisonDeaths ?? null, source: 'CTS/NSO', sourceDetail: stats.enhancedInfo?.crimeData?.source ?? null };
      case 'Terrorism Deaths':
        return { value: stats.enhancedInfo?.terrorismDeathsData?.value ?? null, source: 'Global Terrorism Database', sourceDetail: stats.enhancedInfo?.terrorismDeathsData?.source ?? null };
      
      // Climate metrics
      case 'Average Temperature':
        return { value: stats.enhancedInfo?.climateData?.averageTemperature ?? null, source: 'World Bank Climate Knowledge Portal', sourceDetail: stats.enhancedInfo?.climateData?.source ?? null };
      case 'Hot Days (>30°C)':
        return { value: stats.enhancedInfo?.climateData?.hotDays30 ?? null, source: 'World Bank Climate Knowledge Portal', sourceDetail: stats.enhancedInfo?.climateData?.source ?? null };
      case 'Very Hot Days (>35°C)':
        return { value: stats.enhancedInfo?.climateData?.hotDays35 ?? null, source: 'World Bank Climate Knowledge Portal', sourceDetail: stats.enhancedInfo?.climateData?.source ?? null };
      case 'Cold Days (<0°C)':
        return { value: stats.enhancedInfo?.climateData?.coldDays ?? null, source: 'World Bank Climate Knowledge Portal', sourceDetail: stats.enhancedInfo?.climateData?.source ?? null };
      
      // Trade metrics
      case 'Total Exports':
        return { value: stats.enhancedInfo?.comtradeData?.totalExports?.value ?? null, source: 'UN Comtrade', sourceDetail: stats.enhancedInfo?.comtradeData?.source ?? null };
      case 'Total Imports':
        return { value: stats.enhancedInfo?.comtradeData?.totalImports?.value ?? null, source: 'UN Comtrade', sourceDetail: stats.enhancedInfo?.comtradeData?.source ?? null };
      case 'Trade Balance':
        return { value: stats.enhancedInfo?.comtradeData?.tradeBalance?.value ?? null, source: 'UN Comtrade', sourceDetail: stats.enhancedInfo?.comtradeData?.source ?? null };
      case 'International Tourist Arrivals':
        return { value: stats.enhancedInfo?.touristsData?.value ?? null, source: 'UNWTO', sourceDetail: stats.enhancedInfo?.touristsData?.source ?? null };
      case 'Airports':
        return { value: stats.enhancedInfo?.factbookData?.airports ?? null, source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook' };
      case 'Railways (km)':
        return { value: stats.enhancedInfo?.factbookData?.railways ?? null, source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook' };
      case 'Ports':
        return { value: stats.enhancedInfo?.factbookData?.ports ?? null, source: 'CIA World Factbook', sourceDetail: 'CIA World Factbook' };
      
      default:
        return { value: null, source: null, sourceDetail: null };
    }
  };

  const getMetricValue = (metric: string, country: Country): MetricReading => {
    const reading = resolveMetric(metric, country);
    return {
      value: reading.value ?? null,
      source: reading.source ?? null,
      sourceDetail: reading.sourceDetail ?? null,
      year: reading.year ?? null,
      status: reading.status ?? (reading.value != null ? 'ok' : 'no-data'),
    };
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
        onClick={onToggle }
        aria-expanded={isExpanded}
        className="w-full text-left mb-6 group"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
            {title }
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
                      onClick={() => setShowAsPercentage(false) }
                      className={`px-4 py-2 text-sm font-medium rounded-l-lg border transition-colors ${
                          !showAsPercentage
                              ? 'bg-blue-600 text-white border-blue-600 z-10 ring-2 ring-blue-300'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }` }
                  >
                      Raw Value
                  </button>
                  <button
                      type="button"
                      onClick={() => setShowAsPercentage(true) }
                      className={`px-4 py-2 text-sm font-medium rounded-r-lg border transition-colors ${
                          showAsPercentage
                              ? 'bg-blue-600 text-white border-blue-600 z-10 ring-2 ring-blue-300'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }` }
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
                            src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png` }
                            alt={`${country.name} flag` }
                            width={20 }
                            height={15 }
                            className="w-5 h-auto"
                          />
                          <span className="text-xs font-medium truncate max-w-[120px]">{country.name}</span>
                        </div>
                      </th>
                    )) }
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
                              style={{ backgroundColor: getSourceColor(countries.find(c => getMetricValue(metric, c).source)?.code ? getMetricValue(metric, countries.find(c => getMetricValue(metric, c).source)!).source || undefined : undefined) } }
                            />
                            <div className="flex items-center space-x-2">
                              <span className="text-sm sm:text-base mr-2 opacity-70">{getMetricIcon(metric)}</span>
                              <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{metric}</span>
                              <MetricTooltip
                                label={metric}
                                text={getMetricTooltip(metric)}
                                open={activeTooltip === `tooltip-${metricId}`}
                                onToggle={() => toggleTooltip(`tooltip-${metricId}`)}
                                onClose={() => toggleTooltip(`tooltip-${metricId}`)}
                              />
                            </div>
                          </div>
                        </td>
                        {countries.map(country => {
                          const { value, year, status } = getMetricValue(metric, country);
                          const percentage = value !== null && maxValue > 0 ? (value / maxValue) * 100 : 0;
                          // Only worth showing when the figure is old enough to mislead.
                          const staleYear = year && Number(year) < new Date().getFullYear() - 2 ? year : null;

                          return (
                            <td key={country.code} className="px-3 sm:px-4 py-3 sm:py-4">
                              <div className="flex flex-col items-center space-y-2">
                                <span className={`text-xs sm:text-sm font-medium text-center ${
                                  value !== null ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {loading ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                                  ) : status === 'failed' ? (
                                    <span
                                      className="text-amber-600 dark:text-amber-400"
                                      title="This source could not be reached. The value may exist - reload to try again."
                                    >
                                      Unavailable
                                    </span>
                                  ) : showAsPercentage ? (
                                    value !== null ? `${percentage.toFixed(1)}%` : 'N/A'
                                  ) : (
                                    formatMetricValue(metric, value)
                                  ) }
                                </span>
                                {!loading && value !== null && staleYear && (
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
                                    {staleYear}
                                  </span>
                                ) }
                                {value !== null && value > 0 && maxValue > 0 && countries.length > 1 && (
                                  <div className="w-full max-w-[100px] bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                    <div 
                                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out" 
                                      style={{ width: `${Math.max(4, percentage)}%` } }
                                    />
                                  </div>
                                ) }
                              </div>
                            </td>
                          );
                        }) }
                      </tr>
                    );
                  }) }
                </tbody>
              </table>
            </div>
            
            {/* Section Sources */ }
            {isExpanded && sectionSources.size > 0 && (
              <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowSources(!showSources) }
                  className="w-full flex justify-between items-center min-h-11 -my-2 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white touch-manipulation"
                  aria-expanded={showSources}
                >
                  <span>{showSources ? 'Hide' : 'Show'} Sources ({sectionSources.size})</span>
                  <ChevronDown
                    className={`w-4 h-4 transform transition-transform duration-200 ${
                      showSources ? 'rotate-180' : ''
                    }` }
                  />
                </button>
                {showSources && (
                  <div className="mt-3 space-y-3">
                  {Array.from(sectionSources.entries()).map(([organization, details]) => (
                      <div key={organization} className="flex items-start space-x-2">
                      <div 
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" 
                        style={{ backgroundColor: getSourceColor(organization) } }
                      />
                        <div className="text-xs">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{organization}</span>
                          {details.size > 0 && (
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {Array.from(details).map((detail, index) => (
                                <li key={index} className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {detail }
                                </li>
                            )) }
                          </ul>
                          ) }
                        </div>
                    </div>
                  )) }
                </div>
                ) }
              </div>
            ) }
          </div>
        </div>
      ) }
    </div>
  );
};

