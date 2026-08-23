'use client';

// The country selector: search, multi-select up to a limit, and a note on which
// datasets have no figures for a given country.

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { missingCoverage, type Country, type CountryCoverage } from '../utils/countries';

/** How many countries can be compared at once. */
export const MAX_COMPARISON = 5;

/** Short human labels for the datasets, for the coverage note in the picker. */
const datasetLabel = (dataset: keyof CountryCoverage): string =>
  ({ worldBank: 'World Bank', factbook: 'Factbook', crime: 'crime' })[dataset];

interface CountryDropdownProps {
  selectedCountries: Country[];
  onSelect: (countries: Country[]) => void;
  countries: Country[];
}




export const CountryPicker = ({ selectedCountries, onSelect, countries }: CountryDropdownProps) => {
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
      if (selectedCountries.length < MAX_COMPARISON) {
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
                src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png` }
                alt={`${country.name} flag` }
                width={20 }
                height={15 }
                className="w-4 h-auto sm:w-5 mr-1.5 sm:mr-2"
              />
              <span className="text-xs sm:text-sm font-medium">{country.name}</span>
              <button
                onClick={() => handleRemoveCountry(country.code)}
                aria-label={`Remove ${country.name} from the comparison`}
                className="relative p-1 ml-1 sm:ml-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm sm:text-base touch-manipulation after:absolute after:-inset-3 after:content-['']"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          )) }
        </div>
        
        <div className="relative">
          <button onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }
          }}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="country-picker-list"
          className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              {selectedCountries.length === 0 ? `Select countries to compare (max ${MAX_COMPARISON})` : `Add more countries (${selectedCountries.length}/${MAX_COMPARISON})` }
            </span>
            <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
            {/* Search Input */ }
            <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-600">
              <input
                ref={searchInputRef }
                type="text"
                placeholder="Search countries..."
                value={searchTerm }
                onChange={(e) => setSearchTerm(e.target.value) }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredCountries.length > 0) {
                    // Select the first filtered country on Enter
                    const firstCountry = filteredCountries[0];
                    const isSelected = selectedCountries.some(c => c.code === firstCountry.code);
                    const isDisabled = selectedCountries.length >= MAX_COMPARISON && !isSelected;
                    if (!isDisabled) {
                      handleCountryToggle(firstCountry);
                    }
                  }
                } }
                className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            {/* Countries List */ }
            <div id="country-picker-list" role="listbox" aria-label="Countries" className="max-h-48 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="px-3 sm:px-4 py-3 text-gray-500 dark:text-gray-400 text-center text-xs sm:text-sm">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country) => {
              const isSelected = selectedCountries.some(c => c.code === country.code);
              const isDisabled = selectedCountries.length >= MAX_COMPARISON && !isSelected;
              // Say up front which datasets have nothing for this country, rather
              // than letting whole sections render as N/A with no explanation.
              const gaps = missingCoverage(country.code);

              return (
                <button key={country.code} role="option" aria-selected={isSelected} onClick={() => !isDisabled && handleCountryToggle(country)} disabled={isDisabled} className={`w-full flex items-center min-h-11 touch-manipulation px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Image 
                    src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png` }
                    alt={`${country.name} flag` }
                    width={20 }
                    height={15 }
                    className="w-4 h-auto sm:w-5 mr-2 sm:mr-3"
                  />
                  <span className="text-xs sm:text-sm text-gray-900 dark:text-white">{country.name}</span>
                    {gaps.length > 0 && (
                      <span
                        className="ml-2 text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap"
                        title={`No ${gaps.map(datasetLabel).join(' or ')} data is published for ${country.name}`}
                      >
                        {'·'} no {gaps.map(datasetLabel).join('/')}
                      </span>
                    ) }
                    {isSelected && <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span> }
                  </button>
                );
              })
              ) }
            </div>
          </div>
        ) }
      </div>
    </div>
  );
};

// Helper function to get icon for metric title
