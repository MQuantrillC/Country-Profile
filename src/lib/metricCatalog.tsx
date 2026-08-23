// Metric presentation: which section a metric belongs to, its icon, its
// explanation, its source colour and how its value is rendered.
//
// This lived inside page.tsx, where adding a metric meant editing five places in a
// 3,286-line file. Keeping it together makes the catalogue readable on its own.

import React from 'react';
import {
  TrendingUp, Users, Package, AlertTriangle, Globe, Thermometer, BookOpen,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGlobe, faMoneyBillWave, faUsers, faChartLine, faShieldAlt, faSun,
  faLandmark, faBalanceScale, faCar, faPlane, faShip, faRulerVertical,
  faTemperatureHigh, faSnowflake, faUserFriends, faArrowRight, faMale, faFemale,
  faBaby, faBookReader, faGraduationCap, faHandHoldingUsd, faChartPie, faPercentage,
  faMapMarkedAlt, faWeightHanging, faGavel, faWineGlass, faSmoking, faSkullCrossbones,
  faExchangeAlt, faSignInAlt, faSignOutAlt, faTree, faTractor, faBeer, faGlassWhiskey,
} from '@fortawesome/free-solid-svg-icons';

/** Page sections, in the order they appear. */
export const sections = [
  { id: 'overview', label: 'Overview', icon: Globe },
  { id: 'economy', label: 'Economy & Development', icon: TrendingUp },
  { id: 'social', label: 'Social & Environment', icon: Users },
  { id: 'trade', label: 'Trade', icon: Package },
  { id: 'safety', label: 'Safety & Crime', icon: AlertTriangle },
  { id: 'climate', label: 'Climate', icon: Thermometer },
  { id: 'sources', label: 'Sources', icon: BookOpen },
];

/** Which metrics belong to which section. */
export const sectionMetrics: Record<string, string[]> = {
  overview: [
    'Total Population',
    'Area',
    'Population Density',
    'Urban Population %',
    'Rural Population %',
    'Net Migration Rate (per 1,000 people)',
    'International Migrants'
  ],
  economy: [
    'GDP',
    'GDP Per Capita', 
    'GNI Per Capita',
    'Trade as % of GDP',
    'Unemployment Rate',
    'Public Debt % of GDP',
    'Military Expenditure % of GDP',
    'Gini Index',
    'Tax Revenue as % of GDP',
    'Internet Users %',
    'Electricity Access %'
  ],
  social: [
    'Human Development Index (HDI)',
    'Life Expectancy',
    'Fertility Rate (births per woman)',
    'Literacy Rate',
    'Education Spending % of GDP',
    'Mean Years of Schooling',
    'Extreme Poverty Rate',
    'Daily Caloric Supply',
    'Income Share of Richest 1%',
    'Income Share of Poorest 50%',
    'Armed Forces Personnel',
    'Forest Coverage %',
    'Agricultural Land %',
    'Alcohol Consumption (liters pure alcohol/year)',
    'Beer Consumption (liters pure alcohol/year)',
    'Wine Consumption (liters pure alcohol/year)',
    'Spirits Consumption (liters pure alcohol/year)',
    'Other Alcohols Consumption (liters pure alcohol/year)',
    'Tobacco Use (%)',
    'Tobacco Use - Male (%)',
    'Tobacco Use - Female (%)'
  ],
  trade: [
    'Total Exports',
    'Total Imports',
    'Trade Balance',
    'International Tourist Arrivals',
    'Airports',
    'Railways (km)',
    'Ports'
  ],
  safety: [
    'Homicide Rate (per 100,000)',
    'Homicide Victims (Total)',
    'Homicide Arrests (Total)',
    'Male Arrests',
    'Female Arrests',
    'Male Victims',
    'Female Victims',
    'Prison Deaths',
    'Terrorism Deaths'
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

export const getMetricIcon = (title: string) => {
  switch (title) {
    // Overview
    case 'Total Population': return <FontAwesomeIcon icon={faUsers} />;
    case 'Area': return <FontAwesomeIcon icon={faMapMarkedAlt} />;
    case 'Population Density': return <FontAwesomeIcon icon={faUserFriends} />;
    case 'Urban Population %': return <FontAwesomeIcon icon={faLandmark} />;
    case 'Rural Population %': return <FontAwesomeIcon icon={faRulerVertical} />;
    case 'Net Migration Rate (per 1,000 people)': return <FontAwesomeIcon icon={faArrowRight} />;
    case 'International Migrants': return <FontAwesomeIcon icon={faGlobe} />;
    
    // Economy
    case 'GDP': return <FontAwesomeIcon icon={faMoneyBillWave} />;
    case 'GDP Per Capita': return <FontAwesomeIcon icon={faHandHoldingUsd} />;
    case 'GNI Per Capita': return <FontAwesomeIcon icon={faHandHoldingUsd} />;
    case 'Trade as % of GDP': return <FontAwesomeIcon icon={faChartPie} />;
    case 'Unemployment Rate': return <FontAwesomeIcon icon={faPercentage} />;
    case 'Public Debt % of GDP': return <FontAwesomeIcon icon={faBalanceScale} />;
    case 'Military Expenditure % of GDP': return <FontAwesomeIcon icon={faShieldAlt} />;
    case 'Gini Index': return <FontAwesomeIcon icon={faWeightHanging} />;
    case 'Tax Revenue as % of GDP': return <FontAwesomeIcon icon={faLandmark} />;
    case 'Internet Users %': return <FontAwesomeIcon icon={faGlobe} />;
    case 'Electricity Access %': return <FontAwesomeIcon icon={faSun} />;
    
    // Social
    case 'Human Development Index (HDI)': return <FontAwesomeIcon icon={faChartLine} />;
    case 'Life Expectancy': return <FontAwesomeIcon icon={faChartLine} />;
    case 'Fertility Rate (births per woman)': return <FontAwesomeIcon icon={faBaby} />;
    case 'Literacy Rate': return <FontAwesomeIcon icon={faBookReader} />;
    case 'Education Spending % of GDP': return <FontAwesomeIcon icon={faGraduationCap} />;
    case 'Mean Years of Schooling': return <FontAwesomeIcon icon={faGraduationCap} />;
    case 'Extreme Poverty Rate': return <FontAwesomeIcon icon={faUsers} />;
    case 'Daily Caloric Supply': return <FontAwesomeIcon icon={faUsers} />;
    case 'Income Share of Richest 1%': return <FontAwesomeIcon icon={faUsers} />;
    case 'Income Share of Poorest 50%': return <FontAwesomeIcon icon={faUsers} />;
    case 'Armed Forces Personnel': return <FontAwesomeIcon icon={faShieldAlt} />;
    case 'Forest Coverage %': return <FontAwesomeIcon icon={faTree} />;
    case 'Agricultural Land %': return <FontAwesomeIcon icon={faTractor} />;
    case 'Alcohol Consumption (liters pure alcohol/year)': return <FontAwesomeIcon icon={faWineGlass} />;
    case 'Beer Consumption (liters pure alcohol/year)': return <FontAwesomeIcon icon={faBeer} />;
    case 'Wine Consumption (liters pure alcohol/year)': return <FontAwesomeIcon icon={faWineGlass} />;
    case 'Spirits Consumption (liters pure alcohol/year)': return <FontAwesomeIcon icon={faGlassWhiskey} />;
    case 'Other Alcohols Consumption (liters pure alcohol/year)': return <FontAwesomeIcon icon={faWineGlass} />;
    case 'Tobacco Use (%)': return <FontAwesomeIcon icon={faSmoking} />;
    case 'Tobacco Use - Male (%)': return <FontAwesomeIcon icon={faMale} />;
    case 'Tobacco Use - Female (%)': return <FontAwesomeIcon icon={faFemale} />;
    
    // Safety
    case 'Homicide Rate (per 100,000)': return <FontAwesomeIcon icon={faSkullCrossbones} />;
    case 'Homicide Victims (Total)': return <FontAwesomeIcon icon={faUsers} />;
    case 'Homicide Arrests (Total)': return <FontAwesomeIcon icon={faGavel} />;
    case 'Male Arrests': return <FontAwesomeIcon icon={faMale} />;
    case 'Female Arrests': return <FontAwesomeIcon icon={faFemale} />;
    case 'Male Victims': return <FontAwesomeIcon icon={faMale} />;
    case 'Female Victims': return <FontAwesomeIcon icon={faFemale} />;
    case 'Prison Deaths': return <FontAwesomeIcon icon={faSkullCrossbones} />;
    case 'Terrorism Deaths': return <FontAwesomeIcon icon={faSkullCrossbones} />;
    
    // Trade
    case 'Total Exports': return <FontAwesomeIcon icon={faSignOutAlt} />;
    case 'Total Imports': return <FontAwesomeIcon icon={faSignInAlt} />;
    case 'Trade Balance': return <FontAwesomeIcon icon={faExchangeAlt} />;
    case 'International Tourist Arrivals': return <FontAwesomeIcon icon={faPlane} />;
    case 'Airports': return <FontAwesomeIcon icon={faPlane} />;
    case 'Railways (km)': return <FontAwesomeIcon icon={faCar} />;
    case 'Ports': return <FontAwesomeIcon icon={faShip} />;

    // Climate
    case 'Average Temperature': return <FontAwesomeIcon icon={faTemperatureHigh} />;
    case 'Hot Days (>30°C)': return <FontAwesomeIcon icon={faSun} />;
    case 'Very Hot Days (>35°C)': return <FontAwesomeIcon icon={faSun} />;
    case 'Cold Days (<0°C)': return <FontAwesomeIcon icon={faSnowflake} />;

    default: return <FontAwesomeIcon icon={faChartLine} />;
  }
};


export const getMetricTooltip = (title: string): string => {
  const tooltips: Record<string, string> = {
    "Human Development Index (HDI)": "A composite index measuring key dimensions of human development: health (life expectancy), education (schooling), and living standards (income). Scale: 0-1, where higher values indicate higher human development.",
    "International Tourist Arrivals": "Number of trips by people who arrive from abroad and stay overnight. When an individual visits multiple times within a year, each visit is counted separately.",
    "Mean Years of Schooling": "Average years of formal education for individuals aged 15-64. This includes primary, secondary, and higher education but does not count years spent repeating grades.",
    "Tax Revenue as % of GDP": "Direct and indirect taxes as well as social contributions as a percentage of gross domestic product. Includes compulsory payments to government following IMF and OECD definitions.",
    "Extreme Poverty Rate": "Share of population living below the International Poverty Line of $2.15 per day (2017 PPP). Data is adjusted for inflation and differences in living costs between countries.",
    "International Migrants": "People living in a given country who were born in another country. This includes all foreign-born residents regardless of citizenship status.",
    "Daily Caloric Supply": "Daily per capita caloric supply available for human consumption. Measured in kilocalories per day and represents the food available for consumption, not necessarily what is actually consumed.",
    "World Bank Income Group": "World Bank classification of countries based on Gross National Income (GNI) per capita. Categories include Low income, Lower middle income, Upper middle income, and High income countries.",
    "Income Share of Richest 1%": "Percentage of total income received by the richest 1% of the population before taxes and transfers. Higher values indicate greater income inequality at the top of the distribution.",
    "Income Share of Poorest 50%": "Percentage of total income received by the poorest 50% of the population before taxes and transfers. Lower values indicate greater income inequality at the bottom of the distribution.",
    "Armed Forces Personnel": "Active duty military personnel and paramilitary forces as a percentage of total population. Includes all servicemen and women on full-time duty, including conscripts.",
    "Terrorism Deaths": "Total number of deaths from terrorist attacks. Data from the Global Terrorism Database which tracks terrorist incidents worldwide.",
    "Political Regime": "Classification of political systems based on democratic institutions and freedoms. Categories: Closed Autocracy, Electoral Autocracy, Electoral Democracy, and Liberal Democracy.",
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
    "Homicide Victims (Total)": "Total number of people who were victims of intentional homicide based on UN crime statistics",
    "Homicide Arrests (Total)": "Total number of people arrested or suspected for intentional homicide crimes",
    "Male Arrests": "Number of male individuals arrested or suspected for intentional homicide",
    "Female Arrests": "Number of female individuals arrested or suspected for intentional homicide", 
    "Male Victims": "Number of male victims of intentional homicide",
    "Female Victims": "Number of female victims of intentional homicide",
    "Prison Deaths": "Number of deaths due to intentional homicide that occurred in prison facilities",
    "Average Temperature": "Mean annual temperature across the country in degrees Celsius",
    "Hot Days (>30°C)": "Average number of days per year with maximum temperature above 30°C (86°F)",
    "Very Hot Days (>35°C)": "Average number of days per year with maximum temperature above 35°C (95°F)",
    "Cold Days (<0°C)": "Average number of days per year with minimum temperature below 0°C (32°F)",
    "Total Exports": "Total value of goods and services exported by the country in US dollars",
    "Total Imports": "Total value of goods and services imported by the country in US dollars",
    "Trade Balance": "Difference between total exports and imports - positive indicates trade surplus, negative indicates trade deficit",
    "Gini Index": "Measure of income inequality - 0 means perfect equality, 100 means perfect inequality",
    "Airports": "Total number of airports in the country (including all types: international, domestic, military, etc.)",
          "Railways (km)": "Total length of railway lines in kilometers",
      "Ports": "Total number of ports in the country (including seaports, river ports, and lake ports)",
      "Exchange Rates (2024)": "Currency exchange rate to US Dollar for the most recent year available"
  
  };
  
  return tooltips[title] || "No description available for this metric";
};

// Source color mapping for visual indicators

export const sourceColors = {
  'World Bank': '#3B82F6',        // Blue
  'Our World in Data': '#10B981', // Green
  'CIA World Factbook': '#F59E0B', // Amber
  'RestCountries': '#8B5CF6',     // Purple
  'Climate API': '#EF4444',       // Red
  'UN Comtrade': '#6366F1',       // Indigo
  'CTS/NSO': '#EC4899',          // Pink
  'UN HDI': '#14B8A6',           // Teal
  'UN DESA': '#0891B2',          // Cyan
  'UNU-WIDER': '#65A30D',         // Lime
  'Barro-Lee': '#BE185D',         // Fuchsia
  'FAO': '#FB923C',               // Orange
  'WID': '#D946EF',               // Violet
  'UNWTO': '#4F46E5',              // Indigo
  'GTD': '#DC2626',               // Red
  'Default': '#6B7280'           // Gray
};

// Function to get source color based on source organization
export const getSourceColor = (source: string | undefined): string => {
  if (!source) return sourceColors.Default;
  
  if (source.includes('Climate')) return sourceColors['Climate API'];
  if (source.includes('World Bank')) return sourceColors['World Bank'];
  if (source.includes('UN DESA')) return sourceColors['UN DESA'];
  if (source.includes('UNU-WIDER')) return sourceColors['UNU-WIDER'];
  if (source.includes('Barro-Lee')) return sourceColors['Barro-Lee'];
  if (source.includes('FAO')) return sourceColors['FAO'];
  if (source.includes('World Inequality Database')) return sourceColors['WID'];
  if (source.includes('UNWTO')) return sourceColors['UNWTO'];
  if (source.includes('Global Terrorism Database')) return sourceColors['GTD'];
  if (source.includes('Our World in Data')) return sourceColors['Our World in Data'];
  if (source.includes('CIA') || source.includes('Factbook')) return sourceColors['CIA World Factbook'];
  if (source.includes('RestCountries')) return sourceColors['RestCountries'];
  if (source.includes('Comtrade')) return sourceColors['UN Comtrade'];
  if (source.includes('CTS') || source.includes('NSO')) return sourceColors['CTS/NSO'];
  if (source.includes('HDI') || source.includes('UNDP')) return sourceColors['UN HDI'];
  
  return sourceColors.Default;
};

// Compact Section Table Component

/** Render a metric value for display. */
export const formatMetricValue = (metric: string, value: number | null): string => {
  // `== null` catches undefined too - a metric that is genuinely 0 must still render as 0.
  if (value == null || Number.isNaN(value)) return 'N/A';
  
  switch (metric) {
    // Overview metrics
    case 'Total Population':
      return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${value.toLocaleString()}`;
    case 'Area':
      return `${value.toLocaleString()} km²`;
    case 'Population Density':
      return `${value.toFixed(1)}/km²`;
    case 'Urban Population %':
    case 'Rural Population %':
      return `${value.toFixed(1)}%`;
    case 'Net Migration Rate (per 1,000 people)':
      return `${value.toFixed(1)}/1000`;
    case 'International Migrants':
      return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${value.toLocaleString()}`;
    
    // Economy metrics
    case 'GDP':
      if (value >= 1000000000) {
        return `$${(value / 1000000000).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}B`;
      }
      return `$${(value / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}M`;
    case 'GDP Per Capita':
    case 'GNI Per Capita':
      return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    case 'Trade as % of GDP':
    case 'Unemployment Rate':
    case 'Public Debt % of GDP':
    case 'Military Expenditure % of GDP':
    case 'Tax Revenue as % of GDP':
    case 'Internet Users %':
    case 'Electricity Access %':
    case 'Education Spending % of GDP':
    case 'Forest Coverage %':
    case 'Agricultural Land %':
    case 'Extreme Poverty Rate':
    case 'Income Share of Richest 1%':
    case 'Income Share of Poorest 50%':
    case 'Tobacco Use (%)':
      return `${value.toFixed(1)}%`;
    case 'Gini Index':
      return value.toFixed(1);
    
    // Social metrics
    case 'Human Development Index (HDI)':
      return value.toFixed(3);
    case 'Life Expectancy':
      return `${value.toFixed(1)} years`;
    case 'Fertility Rate (births per woman)':
      return `${value.toFixed(1)} births/woman`;
    case 'Literacy Rate':
      return `${value.toFixed(1)}%`;
    case 'Mean Years of Schooling':
      return `${value.toFixed(1)} years`;
    case 'Daily Caloric Supply':
      return `${value.toLocaleString()} kcal`;
    case 'Armed Forces Personnel':
      return `${value.toFixed(1)}%`;
    case 'Alcohol Consumption (liters pure alcohol/year)':
    case 'Beer Consumption (liters pure alcohol/year)':
    case 'Wine Consumption (liters pure alcohol/year)':
    case 'Spirits Consumption (liters pure alcohol/year)':
    case 'Other Alcohols Consumption (liters pure alcohol/year)':
      return `${value.toFixed(1)}L`;
    case 'Tobacco Use - Male (%)':
    case 'Tobacco Use - Female (%)':
      return `${value.toFixed(1)}%`;
    
    // Safety metrics
    case 'Homicide Rate (per 100,000)':
      return value.toFixed(1);
    case 'Homicide Victims (Total)':
    case 'Homicide Arrests (Total)':
    case 'Male Arrests':
    case 'Female Arrests':
    case 'Male Victims':
    case 'Female Victims':
    case 'Prison Deaths':
      return value.toLocaleString();
    case 'Terrorism Deaths':
      return value.toLocaleString();
    
    // Climate metrics
    case 'Average Temperature':
      return `${value.toFixed(1)}°C`;
    case 'Hot Days (>30°C)':
    case 'Very Hot Days (>35°C)':
    case 'Cold Days (<0°C)':
      return `${value.toFixed(0)} days`;
    
    // Trade metrics
    case 'Total Exports':
    case 'Total Imports':
      if (value >= 1000000000) {
        return `$${(value / 1000000000).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}B`;
      }
      return `$${(value / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}M`;
    case 'Trade Balance':
      const tradeBalanceValue = value;
      if (tradeBalanceValue === null) return 'N/A';
      const formattedValue = (Math.abs(tradeBalanceValue / 1e9)).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
      return tradeBalanceValue >= 0 ? `+$${formattedValue}B` : `-$${formattedValue}B`;
    case 'International Tourist Arrivals':
      return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${value.toLocaleString()}`;
    case 'Airports':
    case 'Ports':
      return value.toLocaleString();
    case 'Railways (km)':
      return `${value.toLocaleString()} km`;
    
    default:
      return value.toLocaleString();
  }
};
