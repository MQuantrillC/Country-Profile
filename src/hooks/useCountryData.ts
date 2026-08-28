'use client';

// Loads every data source for the selected countries.
//
// Two behaviours that the inline version in page.tsx lacked: results are cached per
// country, so widening a comparison only fetches what is new; and a superseded
// request cannot overwrite a newer one.

import { useState, useEffect, useRef } from 'react';
import type { Country } from '../utils/countries';
import type { CountryStats } from '../types/country';

/** Per-source loading flags, keyed by country code then source name. */
export type LoadingStates = Record<string, Record<string, boolean>>;

export interface CountryData {
  countryStats: Record<string, CountryStats>;
  loading: boolean;
  loadingStates: LoadingStates;
  error: string | null;
  /** Drop the cache and refetch the current selection. */
  reload: () => void;
}

export function useCountryData(
  selectedCountries: Country[],
  /**
   * Held false until the query string has been applied, so the default selection
   * does not trigger a fetch that is about to be replaced.
   */
  ready: boolean
): CountryData {
  const [countryStats, setCountryStats] = useState<Record<string, CountryStats>>({});
  /**
   * Every country fetched this session, keyed by code. Selecting a country that is
   * already here costs nothing.
   */
  const statsCacheRef = useRef<Record<string, CountryStats>>({});

  /** Narrow the session cache down to the countries currently on screen. */
  const pickStats = (selection: Country[]): Record<string, CountryStats> => {
    const picked: Record<string, CountryStats> = {};
    for (const country of selection) {
      const stats = statsCacheRef.current[country.code];
      if (stats) picked[country.code] = stats;
    }
    return picked;
  };
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, Record<string, boolean>>>({});
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = () => {
    statsCacheRef.current = {};
    setReloadToken((n) => n + 1);
  };

  /** Set one source's loading flag for one country. */
  const setMetricLoading = (countryCode: string, metricName: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [countryCode]: { ...prev[countryCode], [metricName]: isLoading },
    }));
  };

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      // Wait for the query string to be applied so the default selection does not
      // trigger a fetch that is about to be replaced.
      if (!ready) return;

      if (selectedCountries.length === 0) {
        setCountryStats({});
        return;
      }

      // Adding a country used to refetch every country from scratch, so building
      // up a five-way comparison cost five full rounds of requests. Only the
      // countries we have never loaded need fetching.
      const pending = selectedCountries.filter(c => !statsCacheRef.current[c.code]);

      if (pending.length === 0) {
        setCountryStats(pickStats(selectedCountries));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Initialize loading states for all countries and metrics
      const initialLoadingStates: Record<string, Record<string, boolean>> = { };
      pending.forEach(country => {
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
        
        const fetchPromises = pending.map(async (country) => {
          
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
              fetchWithLoading(`/api/worldbank?country=${country.code}`, 'worldBank'),
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
            if (factbookData?.militaryExpenditure) {
            }

            // The climate route returns nulls when the Portal has no coverage. There
            // used to be a hardcoded table of approximate temperatures here as a
            // fallback, disagreeing with a second invented table inside the route
            // itself; both are gone, so a gap now reads as a gap.
            const finalClimateData = climateData;

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
        if (cancelled) return;

        pending.forEach((country, index) => {
          if (statsResults[index]) {
            statsCacheRef.current[country.code] = statsResults[index];
          }
        });

        setCountryStats(pickStats(selectedCountries));
      } catch (error) {
        console.error('Error fetching data:', error);
        if (!cancelled) setError('Could not load country data. Check your connection and try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    // A fast sequence of selections must not let an earlier response overwrite a
    // later one.
    return () => {
      cancelled = true;
    };
    // Keyed on the codes rather than the array, so an identical selection
    // rendered as a new array does not retrigger the fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountries.map(c => c.code).join(','), ready, reloadToken]);


  return { countryStats, loading, loadingStates, error, reload };
}
