// app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Globe, TrendingUp, Users, MapPin, Thermometer, Package, ShoppingCart, Handshake, AlertTriangle, BarChart3, DollarSign, Activity, LucideIcon } from "lucide-react";
import { fetchCountryStats } from '../utils/worldBank'

interface CountryStats {
  gdp: number | null;
  gdpPerCapita: number | null;
  population: number | null;
  area: number | null;
  inflation: number | null;
  populationGrowth: number | null;
  urbanPopPct: number | null;
  ruralPopPct: number | null;
  fertilityRate: number | null;
  lifeExpectancy: number | null;
  co2PerCapita: number | null;
  forestPct: number | null;
  literacyRate: number | null;
  schoolEnrollment: number | null;
  educationSpendPctGDP: number | null;
  healthSpendPerCapita: number | null;
  homicideRate: number | null;
}

interface Country {
  name: string;
  code: string;
  flag: string;
  data: {
    gdp: number;
    gdpPerCapita: number;
    population: number;
    area: number;
    avgTemp: string;
    topExports: string[];
    topImports: string[];
    tradingPartners: string[];
    homicideRate: number;
    crimeIndex: number;
    currency: string;
    continent: string;
  };
}

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  subtext?: string;
  color?: string;
  country: Country;
}

interface CountrySelectorProps {
  title: string;
  selectedCountry: Country;
  onSelect: (country: Country) => void;
  countries: Country[];
}

interface ListCardProps {
  title: string;
  items: string[];
  icon: LucideIcon;
  color: string;
  country: Country;
}

interface ComparisonBarProps {
  label: string;
  value1: number;
  value2: number;
  country1: Country;
  country2: Country;
  formatter?: (x: number) => string;
  color1?: string;
  color2?: string;
}

const countries = [
  { 
    name: "United States", 
    code: "US",
    flag: "🇺🇸",
    data: {
      gdp: 25.46,
      gdpPerCapita: 76329,
      population: 331.9,
      area: 9834,
      avgTemp: "8.5°C",
      topExports: ["Refined Petroleum", "Crude Petroleum", "Cars", "Integrated Circuits", "Aircraft"],
      topImports: ["Cars", "Crude Petroleum", "Computers", "Broadcasting Equipment", "Packaged Medicines"],
      tradingPartners: ["China", "Canada", "Mexico", "Japan", "Germany"],
      homicideRate: 6.3,
      crimeIndex: 47.8,
      currency: "USD",
      continent: "North America"
    }
  },
  { 
    name: "Peru", 
    code: "PE",
    flag: "🇵🇪",
    data: {
      gdp: 0.223,
      gdpPerCapita: 6692,
      population: 33.36,
      area: 1285,
      avgTemp: "19.5°C",
      topExports: ["Copper Ore", "Gold", "Refined Petroleum", "Zinc Ore", "Lead Ore"],
      topImports: ["Refined Petroleum", "Cars", "Crude Petroleum", "Broadcasting Equipment", "Delivery Trucks"],
      tradingPartners: ["China", "United States", "Brazil", "Argentina", "Chile"],
      homicideRate: 7.9,
      crimeIndex: 68.1,
      currency: "PEN",
      continent: "South America"
    }
  },
  { 
    name: "United Kingdom", 
    code: "GB",
    flag: "🇬🇧",
    data: {
      gdp: 3.13,
      gdpPerCapita: 46125,
      population: 67.89,
      area: 242.5,
      avgTemp: "9.8°C",
      topExports: ["Cars", "Gold", "Crude Petroleum", "Packaged Medicines", "Refined Petroleum"],
      topImports: ["Cars", "Gold", "Crude Petroleum", "Refined Petroleum", "Broadcasting Equipment"],
      tradingPartners: ["Germany", "United States", "Netherlands", "France", "China"],
      homicideRate: 1.2,
      crimeIndex: 44.5,
      currency: "GBP",
      continent: "Europe"
    }
  },
  { 
    name: "Japan", 
    code: "JP",
    flag: "🇯🇵",
    data: {
      gdp: 4.94,
      gdpPerCapita: 39285,
      population: 125.8,
      area: 377.9,
      avgTemp: "15.4°C",
      topExports: ["Cars", "Integrated Circuits", "Vehicle Parts", "Machinery", "Steel"],
      topImports: ["Crude Petroleum", "Coal Briquettes", "Natural Gas", "Refined Petroleum", "Integrated Circuits"],
      tradingPartners: ["China", "United States", "South Korea", "Taiwan", "Germany"],
      homicideRate: 0.3,
      crimeIndex: 22.9,
      currency: "JPY",
      continent: "Asia"
    }
  },
];

const StatCard = ({ icon: Icon, title, value, subtext, color = "blue", country }: StatCardProps) => {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500 text-blue-100",
    green: "bg-green-500 text-green-100",
    purple: "bg-purple-500 text-purple-100",
    orange: "bg-orange-500 text-orange-100",
    red: "bg-red-500 text-red-100",
    indigo: "bg-indigo-500 text-indigo-100",
    yellow: "bg-yellow-500 text-yellow-100"
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        <span className="text-2xl">{country.flag}</span>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {subtext && <p className="text-gray-500 text-sm">{subtext}</p>}
    </div>
  );
};

const CountrySelector = ({ title, selectedCountry, onSelect, countries }: CountrySelectorProps) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {countries.map((country) => (
        <button
          key={country.code}
          onClick={() => onSelect(country)}
          className={`p-4 rounded-lg text-left transition-all duration-200 ${
            selectedCountry.code === country.code
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-900 hover:shadow-md'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{country.flag}</span>
            <div>
              <p className={`font-medium ${selectedCountry.code === country.code ? 'text-white' : 'text-gray-900'}`}>
                {country.name}
              </p>
              <p className={`text-sm ${selectedCountry.code === country.code ? 'text-blue-100' : 'text-gray-500'}`}>
                {country.data.continent}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
);

const ListCard = ({ title, items, icon: Icon, color, country }: ListCardProps) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg bg-${color}-500 text-white`}>
          <Icon size={18} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <span className="text-2xl">{country.flag}</span>
    </div>
    <ul className="space-y-3">
      {items.slice(0, 5).map((item, index) => (
        <li key={index} className="flex items-center space-x-3">
          <span className={`w-7 h-7 rounded-full bg-${color}-100 text-${color}-600 flex items-center justify-center text-sm font-semibold`}>
            {index + 1}
          </span>
          <span className="text-gray-700 font-medium">{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const ComparisonBar = ({ label, value1, value2, country1, country2, formatter = (x: number) => x.toString(), color1 = "blue", color2 = "purple" }: ComparisonBarProps) => {
  const max = Math.max(value1 || 0, value2 || 0);
  const percentage1 = max > 0 ? (value1 / max) * 100 : 0;
  const percentage2 = max > 0 ? (value2 / max) * 100 : 0;

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
      <h4 className="font-semibold text-gray-900 mb-3">{label}</h4>
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{country1.flag}</span>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">{country1.name}</span>
              <span className="text-sm font-bold text-gray-900">{formatter(value1)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-${color1}-500 h-2 rounded-full transition-all duration-500`}
                style={{ width: `${percentage1}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-lg">{country2.flag}</span>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">{country2.name}</span>
              <span className="text-sm font-bold text-gray-900">{formatter(value2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-${color2}-500 h-2 rounded-full transition-all duration-500`}
                style={{ width: `${percentage2}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [selectedCountry1, setSelectedCountry1] = useState(countries[0]);
  const [selectedCountry2, setSelectedCountry2] = useState(countries[1]);
  const [country1Stats, setCountry1Stats] = useState<CountryStats | null>(null);
  const [country2Stats, setCountry2Stats] = useState<CountryStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Loading data for countries:', selectedCountry1.code, selectedCountry2.code);
        
        const [stats1, stats2] = await Promise.all([
          fetchCountryStats(selectedCountry1.code),
          fetchCountryStats(selectedCountry2.code)
        ]);
        
        console.log('Loaded stats:', { stats1, stats2 });
        
        setCountry1Stats(stats1);
        setCountry2Stats(stats2);
      } catch (err) {
        console.error('Error loading country data:', err);
        setError('Failed to load country data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedCountry1, selectedCountry2]);

  const formatNumber = (num: number | null): string => {
    if (!num) return "N/A";
    if (num >= 1000000000000) return `$${(num / 1000000000000).toFixed(2)}T`;
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    return `$${(num / 1000000).toFixed(0)}M`;
  };

  const formatCurrency = (num: number | null): string => {
    if (!num) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPopulation = (num: number | null): string => {
    if (!num) return "N/A";
    return `${(num / 1000000).toFixed(1)}M`;
  };

  const formatArea = (num: number | null): string => {
    if (!num) return "N/A";
    return `${num.toLocaleString()} km²`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'economy', label: 'Economy', icon: TrendingUp },
    { id: 'trade', label: 'Trade', icon: Package },
    { id: 'safety', label: 'Safety & Crime', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Country Profile Comparison
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Compare economic indicators, demographics, trade data, and safety metrics between countries around the world
            </p>
            {loading && (
              <div className="mt-4 text-blue-600">
                Loading country data...
              </div>
            )}
            {error && (
              <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-lg">
                Error: {error}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Country Selection */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Select Countries to Compare</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CountrySelector
              title="First Country"
              selectedCountry={selectedCountry1}
              onSelect={setSelectedCountry1}
              countries={countries}
            />
            <CountrySelector
              title="Second Country"
              selectedCountry={selectedCountry2}
              onSelect={setSelectedCountry2}
              countries={countries}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2 bg-white p-2 rounded-xl shadow-lg border border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Users}
                title="Population"
                value={
                  country1Stats?.population ? formatPopulation(country1Stats.population) : (loading ? "Loading..." : "N/A")
                }
                subtext={selectedCountry1.name}
                color="blue"
                country={selectedCountry1}
              />
              <StatCard
                icon={Users}
                title="Population"
                value={
                  country2Stats?.population ? formatPopulation(country2Stats.population) : (loading ? "Loading..." : "N/A")
                }
                subtext={selectedCountry2.name}
                color="purple"
                country={selectedCountry2}
              />
              <StatCard
                icon={MapPin}
                title="Area"
                value={
                  country1Stats?.area ? formatArea(country1Stats.area) : (loading ? "Loading..." : "N/A")
                }
                subtext={selectedCountry1.name}
                color="green"
                country={selectedCountry1}
              />
              <StatCard
                icon={MapPin}
                title="Area"
                value={
                  country2Stats?.area ? formatArea(country2Stats.area) : (loading ? "Loading..." : "N/A")
                }
                subtext={selectedCountry2.name}
                color="orange"
                country={selectedCountry2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ComparisonBar
                label="Population Comparison"
                value1={country1Stats?.population || 0}
                value2={country2Stats?.population || 0}
                country1={selectedCountry1}
                country2={selectedCountry2}
                formatter={formatPopulation}
              />
              <ComparisonBar
                label="Area Comparison"
                value1={country1Stats?.area || 0}
                value2={country2Stats?.area || 0}
                country1={selectedCountry1}
                country2={selectedCountry2}
                formatter={formatArea}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard
                icon={Thermometer}
                title="Average Temperature"
                value={selectedCountry1.data.avgTemp}
                subtext={selectedCountry1.name}
                color="yellow"
                country={selectedCountry1}
              />
              <StatCard
                icon={Thermometer}
                title="Average Temperature"
                value={selectedCountry2.data.avgTemp}
                subtext={selectedCountry2.name}
                color="red"
                country={selectedCountry2}
              />
            </div>
          </div>
        )}

        {activeTab === 'economy' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={BarChart3}
                title="GDP"
                value={
                  country1Stats?.gdp ? formatNumber(country1Stats.gdp) : (loading ? "Loading..." : "N/A")
                }
                subtext={selectedCountry1.name}
                color="blue"
                country={selectedCountry1}
              />
              <StatCard
                icon={BarChart3}
                title="GDP"
                value={
                  country2Stats?.gdp ? formatNumber(country2Stats.gdp) : (loading ? "Loading..." : "N/A")
                }
                subtext={selectedCountry2.name}
                color="purple"
                country={selectedCountry2}
              />
              <StatCard
                icon={DollarSign}
                title="GDP Per Capita"
                value={
                  country1Stats?.gdpPerCapita ? formatCurrency(country1Stats.gdpPerCapita) : (loading ? "Loading..." : "N/A")
                }
                subtext={selectedCountry1.name}
                color="green"
                country={selectedCountry1}
              />
              <StatCard
                icon={DollarSign}
                title="GDP Per Capita"
                value={
                  country2Stats?.gdpPerCapita ? formatCurrency(country2Stats.gdpPerCapita) : (loading ? "Loading..." : "N/A")
                }
                subtext={selectedCountry2.name}
                color="orange"
                country={selectedCountry2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ComparisonBar
                label="GDP Comparison"
                value1={country1Stats?.gdp || 0}
                value2={country2Stats?.gdp || 0}
                country1={selectedCountry1}
                country2={selectedCountry2}
                formatter={formatNumber}
              />
              <ComparisonBar
                label="GDP Per Capita Comparison"
                value1={country1Stats?.gdpPerCapita || 0}
                value2={country2Stats?.gdpPerCapita || 0}
                country1={selectedCountry1}
                country2={selectedCountry2}
                formatter={formatCurrency}
              />
            </div>
          </div>
        )}

        {activeTab === 'trade' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <ListCard
                  title="Top Exports"
                  items={selectedCountry1.data.topExports}
                  icon={Package}
                  color="blue"
                  country={selectedCountry1}
                />
                <ListCard
                  title="Top Imports"
                  items={selectedCountry1.data.topImports}
                  icon={ShoppingCart}
                  color="green"
                  country={selectedCountry1}
                />
                <ListCard
                  title="Trading Partners"
                  items={selectedCountry1.data.tradingPartners}
                  icon={Handshake}
                  color="purple"
                  country={selectedCountry1}
                />
              </div>
              <div className="space-y-6">
                <ListCard
                  title="Top Exports"
                  items={selectedCountry2.data.topExports}
                  icon={Package}
                  color="orange"
                  country={selectedCountry2}
                />
                <ListCard
                  title="Top Imports"
                  items={selectedCountry2.data.topImports}
                  icon={ShoppingCart}
                  color="red"
                  country={selectedCountry2}
                />
                <ListCard
                  title="Trading Partners"
                  items={selectedCountry2.data.tradingPartners}
                  icon={Handshake}
                  color="indigo"
                  country={selectedCountry2}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={AlertTriangle}
                title="Homicide Rate"
                value={`${selectedCountry1.data.homicideRate}/100k`}
                subtext={selectedCountry1.name}
                color="red"
                country={selectedCountry1}
              />
              <StatCard
                icon={AlertTriangle}
                title="Homicide Rate"
                value={`${selectedCountry2.data.homicideRate}/100k`}
                subtext={selectedCountry2.name}
                color="orange"
                country={selectedCountry2}
              />
              <StatCard
                icon={Activity}
                title="Crime Index"
                value={selectedCountry1.data.crimeIndex.toString()}
                subtext={selectedCountry1.name}
                color="purple"
                country={selectedCountry1}
              />
              <StatCard
                icon={Activity}
                title="Crime Index"
                value={selectedCountry2.data.crimeIndex.toString()}
                subtext={selectedCountry2.name}
                color="indigo"
                country={selectedCountry2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ComparisonBar
                label="Homicide Rate (per 100,000)"
                value1={selectedCountry1.data.homicideRate || 0}
                value2={selectedCountry2.data.homicideRate || 0}
                country1={selectedCountry1}
                country2={selectedCountry2}
                formatter={(x) => `${x}/100k`}
                color1="red"
                color2="orange"
              />
              <ComparisonBar
                label="Crime Index"
                value1={selectedCountry1.data.crimeIndex || 0}
                value2={selectedCountry2.data.crimeIndex || 0}
                country1={selectedCountry1}
                country2={selectedCountry2}
                formatter={(x) => x.toString()}
                color1="purple"
                color2="indigo"
              />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Interpretation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Homicide Rate Scale:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>0-2: Very Low</p>
                    <p><span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>2-5: Low</p>
                    <p><span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>5-10: Moderate</p>
                    <p><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>10+: High</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Crime Index Scale:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>0-20: Very Low</p>
                    <p><span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>20-40: Low</p>
                    <p><span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>40-60: Moderate</p>
                    <p><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>60+: High</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}