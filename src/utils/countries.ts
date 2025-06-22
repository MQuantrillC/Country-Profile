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

// Default data template for countries without specific data
const defaultData = {
  gdp: 0,
  gdpPerCapita: 0,
  population: 0,
  area: 0,
  avgTemp: "N/A",
  topExports: [],
  topImports: [],
  tradingPartners: [],
  homicideRate: 0,
  crimeIndex: 0,
  currency: "N/A",
  continent: "Unknown"
};

export const countries: Country[] = [
  // Major economies and G20 countries with detailed data
  {
    name: "United States", code: "US", flag: "🇺🇸",
    data: { gdp: 23315080, gdpPerCapita: 70248, population: 331002651, area: 9833517, avgTemp: "12.0°C",
      topExports: ["Petroleum", "Machinery", "Vehicles"], topImports: ["Petroleum", "Electronics", "Vehicles"],
      tradingPartners: ["China", "Mexico", "Canada"], homicideRate: 5.8, crimeIndex: 47.7, currency: "USD", continent: "North America" }
  },
  {
    name: "China", code: "CN", flag: "🇨🇳",
    data: { gdp: 17734063, gdpPerCapita: 12556, population: 1439323776, area: 9596960, avgTemp: "8.5°C",
      topExports: ["Electronics", "Machinery", "Textiles"], topImports: ["Energy", "Semiconductors", "Machinery"],
      tradingPartners: ["United States", "Japan", "South Korea"], homicideRate: 0.5, crimeIndex: 54.1, currency: "CNY", continent: "Asia" }
  },
  {
    name: "Japan", code: "JP", flag: "🇯🇵",
    data: { gdp: 4940878, gdpPerCapita: 39285, population: 125836021, area: 377930, avgTemp: "14.0°C",
      topExports: ["Vehicles", "Machinery", "Electronics"], topImports: ["Petroleum", "Natural Gas", "Coal"],
      tradingPartners: ["China", "United States", "South Korea"], homicideRate: 0.3, crimeIndex: 22.2, currency: "JPY", continent: "Asia" }
  },
  {
    name: "Germany", code: "DE", flag: "🇩🇪",
    data: { gdp: 4259935, gdpPerCapita: 51203, population: 83240525, area: 357114, avgTemp: "9.3°C",
      topExports: ["Vehicles", "Machinery", "Chemicals"], topImports: ["Energy", "Electronics", "Vehicles"],
      tradingPartners: ["China", "United States", "France"], homicideRate: 0.9, crimeIndex: 34.5, currency: "EUR", continent: "Europe" }
  },
  {
    name: "India", code: "IN", flag: "🇮🇳",
    data: { gdp: 3385090, gdpPerCapita: 2389, population: 1380004385, area: 3287263, avgTemp: "25.0°C",
      topExports: ["Pharmaceuticals", "Textiles", "IT Services"], topImports: ["Energy", "Electronics", "Machinery"],
      tradingPartners: ["United States", "China", "United Arab Emirates"], homicideRate: 2.8, crimeIndex: 46.8, currency: "INR", continent: "Asia" }
  },
  {
    name: "United Kingdom", code: "GB", flag: "🇬🇧",
    data: { gdp: 3131378, gdpPerCapita: 46344, population: 67586011, area: 242495, avgTemp: "9.8°C",
      topExports: ["Services", "Machinery", "Chemicals"], topImports: ["Energy", "Electronics", "Vehicles"],
      tradingPartners: ["United States", "Germany", "China"], homicideRate: 1.2, crimeIndex: 44.5, currency: "GBP", continent: "Europe" }
  },
  {
    name: "France", code: "FR", flag: "🇫🇷",
    data: { gdp: 2937473, gdpPerCapita: 43659, population: 67391582, area: 643801, avgTemp: "12.2°C",
      topExports: ["Machinery", "Vehicles", "Aerospace"], topImports: ["Energy", "Electronics", "Machinery"],
      tradingPartners: ["Germany", "Spain", "Italy"], homicideRate: 1.2, crimeIndex: 46.8, currency: "EUR", continent: "Europe" }
  },
  {
    name: "Italy", code: "IT", flag: "🇮🇹",
    data: { gdp: 2107703, gdpPerCapita: 35551, population: 59301681, area: 301340, avgTemp: "13.9°C",
      topExports: ["Machinery", "Vehicles", "Pharmaceuticals"], topImports: ["Energy", "Electronics", "Vehicles"],
      tradingPartners: ["Germany", "France", "United States"], homicideRate: 0.6, crimeIndex: 47.8, currency: "EUR", continent: "Europe" }
  },
  {
    name: "Brazil", code: "BR", flag: "🇧🇷",
    data: { gdp: 2055506, gdpPerCapita: 9638, population: 212559417, area: 8514877, avgTemp: "25.0°C",
      topExports: ["Soybeans", "Iron Ore", "Petroleum"], topImports: ["Electronics", "Machinery", "Vehicles"],
      tradingPartners: ["China", "United States", "Argentina"], homicideRate: 27.4, crimeIndex: 68.8, currency: "BRL", continent: "South America" }
  },
  {
    name: "Canada", code: "CA", flag: "🇨🇦",
    data: { gdp: 1988336, gdpPerCapita: 51987, population: 38246108, area: 9984670, avgTemp: "1.4°C",
      topExports: ["Energy", "Minerals", "Forestry"], topImports: ["Machinery", "Electronics", "Vehicles"],
      tradingPartners: ["United States", "China", "Mexico"], homicideRate: 2.0, crimeIndex: 39.0, currency: "CAD", continent: "North America" }
  },
  {
    name: "Russia", code: "RU", flag: "🇷🇺",
    data: { gdp: 1829050, gdpPerCapita: 12259, population: 145912025, area: 17098242, avgTemp: "-5.1°C",
      topExports: ["Energy", "Metals", "Grain"], topImports: ["Machinery", "Electronics", "Pharmaceuticals"],
      tradingPartners: ["China", "Germany", "Turkey"], homicideRate: 7.3, crimeIndex: 53.7, currency: "RUB", continent: "Europe" }
  },
  {
    name: "South Korea", code: "KR", flag: "🇰🇷",
    data: { gdp: 1811048, gdpPerCapita: 34998, population: 51780579, area: 100210, avgTemp: "12.5°C",
      topExports: ["Electronics", "Vehicles", "Machinery"], topImports: ["Energy", "Electronics", "Machinery"],
      tradingPartners: ["China", "United States", "Japan"], homicideRate: 0.6, crimeIndex: 27.9, currency: "KRW", continent: "Asia" }
  },
  {
    name: "Australia", code: "AU", flag: "🇦🇺",
    data: { gdp: 1552667, gdpPerCapita: 60443, population: 25687041, area: 7692024, avgTemp: "21.9°C",
      topExports: ["Iron Ore", "Coal", "Gold"], topImports: ["Machinery", "Electronics", "Vehicles"],
      tradingPartners: ["China", "Japan", "South Korea"], homicideRate: 0.9, crimeIndex: 42.7, currency: "AUD", continent: "Oceania" }
  },
  {
    name: "Spain", code: "ES", flag: "🇪🇸",
    data: { gdp: 1419821, gdpPerCapita: 29565, population: 47394837, area: 505992, avgTemp: "16.3°C",
      topExports: ["Machinery", "Vehicles", "Food"], topImports: ["Energy", "Machinery", "Electronics"],
      tradingPartners: ["France", "Germany", "Portugal"], homicideRate: 0.6, crimeIndex: 32.4, currency: "EUR", continent: "Europe" }
  },
  {
    name: "Mexico", code: "MX", flag: "🇲🇽",
    data: { gdp: 1293038, gdpPerCapita: 10045, population: 128932753, area: 1964375, avgTemp: "21.0°C",
      topExports: ["Vehicles", "Electronics", "Machinery"], topImports: ["Electronics", "Machinery", "Petroleum"],
      tradingPartners: ["United States", "China", "Germany"], homicideRate: 28.4, crimeIndex: 54.3, currency: "MXN", continent: "North America" }
  },
  {
    name: "Indonesia", code: "ID", flag: "🇮🇩",
    data: { gdp: 1319100, gdpPerCapita: 4798, population: 273523615, area: 1904569, avgTemp: "26.0°C",
      topExports: ["Coal", "Palm Oil", "Textiles"], topImports: ["Machinery", "Electronics", "Energy"],
      tradingPartners: ["China", "Japan", "United States"], homicideRate: 0.4, crimeIndex: 43.5, currency: "IDR", continent: "Asia" }
  },
  {
    name: "Netherlands", code: "NL", flag: "🇳🇱",
    data: { gdp: 909887, gdpPerCapita: 52331, population: 17407585, area: 41850, avgTemp: "10.2°C",
      topExports: ["Machinery", "Chemicals", "Food"], topImports: ["Energy", "Machinery", "Electronics"],
      tradingPartners: ["Germany", "Belgium", "United Kingdom"], homicideRate: 0.6, crimeIndex: 27.3, currency: "EUR", continent: "Europe" }
  },
  {
    name: "Saudi Arabia", code: "SA", flag: "🇸🇦",
    data: { gdp: 833541, gdpPerCapita: 23566, population: 34813871, area: 2149690, avgTemp: "25.0°C",
      topExports: ["Petroleum", "Chemicals", "Plastics"], topImports: ["Machinery", "Electronics", "Vehicles"],
      tradingPartners: ["China", "India", "Japan"], homicideRate: 1.5, crimeIndex: 23.3, currency: "SAR", continent: "Asia" }
  },
  {
    name: "Switzerland", code: "CH", flag: "🇨🇭",
    data: { gdp: 812867, gdpPerCapita: 93457, population: 8693700, area: 41285, avgTemp: "8.5°C",
      topExports: ["Pharmaceuticals", "Machinery", "Watches"], topImports: ["Energy", "Electronics", "Vehicles"],
      tradingPartners: ["Germany", "United States", "Italy"], homicideRate: 0.5, crimeIndex: 21.8, currency: "CHF", continent: "Europe" }
  },
  {
    name: "Turkey", code: "TR", flag: "🇹🇷",
    data: { gdp: 761425, gdpPerCapita: 9126, population: 84339067, area: 783562, avgTemp: "11.1°C",
      topExports: ["Textiles", "Machinery", "Vehicles"], topImports: ["Energy", "Machinery", "Electronics"],
      tradingPartners: ["Germany", "United Kingdom", "Iraq"], homicideRate: 2.6, crimeIndex: 33.5, currency: "TRY", continent: "Asia" }
  },

  // European countries with simplified data
  { name: "Denmark", code: "DK", flag: "🇩🇰", data: { ...defaultData, continent: "Europe", currency: "DKK" } },
  { name: "Finland", code: "FI", flag: "🇫🇮", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Belgium", code: "BE", flag: "🇧🇪", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Austria", code: "AT", flag: "🇦🇹", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Ireland", code: "IE", flag: "🇮🇪", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Portugal", code: "PT", flag: "🇵🇹", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Greece", code: "GR", flag: "🇬🇷", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Poland", code: "PL", flag: "🇵🇱", data: { ...defaultData, continent: "Europe", currency: "PLN" } },
  { name: "Czech Republic", code: "CZ", flag: "🇨🇿", data: { ...defaultData, continent: "Europe", currency: "CZK" } },
  { name: "Hungary", code: "HU", flag: "🇭🇺", data: { ...defaultData, continent: "Europe", currency: "HUF" } },
  { name: "Slovakia", code: "SK", flag: "🇸🇰", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Slovenia", code: "SI", flag: "🇸🇮", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Croatia", code: "HR", flag: "🇭🇷", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Romania", code: "RO", flag: "🇷🇴", data: { ...defaultData, continent: "Europe", currency: "RON" } },
  { name: "Bulgaria", code: "BG", flag: "🇧🇬", data: { ...defaultData, continent: "Europe", currency: "BGN" } },
  { name: "Lithuania", code: "LT", flag: "🇱🇹", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Latvia", code: "LV", flag: "🇱🇻", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Estonia", code: "EE", flag: "🇪🇪", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Luxembourg", code: "LU", flag: "🇱🇺", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Malta", code: "MT", flag: "🇲🇹", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Cyprus", code: "CY", flag: "🇨🇾", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "Iceland", code: "IS", flag: "🇮🇸", data: { ...defaultData, continent: "Europe", currency: "ISK" } },
  { name: "Sweden", code: "SE", flag: "🇸🇪", data: { ...defaultData, continent: "Europe", currency: "SEK" } },
  { name: "Norway", code: "NO", flag: "🇳🇴", data: { ...defaultData, continent: "Europe", currency: "NOK" } },
  { name: "Ukraine", code: "UA", flag: "🇺🇦", data: { ...defaultData, continent: "Europe", currency: "UAH" } },
  { name: "Belarus", code: "BY", flag: "🇧🇾", data: { ...defaultData, continent: "Europe", currency: "BYN" } },
  { name: "Serbia", code: "RS", flag: "🇷🇸", data: { ...defaultData, continent: "Europe", currency: "RSD" } },
  { name: "Bosnia and Herzegovina", code: "BA", flag: "🇧🇦", data: { ...defaultData, continent: "Europe", currency: "BAM" } },
  { name: "Montenegro", code: "ME", flag: "🇲🇪", data: { ...defaultData, continent: "Europe", currency: "EUR" } },
  { name: "North Macedonia", code: "MK", flag: "🇲🇰", data: { ...defaultData, continent: "Europe", currency: "MKD" } },
  { name: "Albania", code: "AL", flag: "🇦🇱", data: { ...defaultData, continent: "Europe", currency: "ALL" } },
  { name: "Moldova", code: "MD", flag: "🇲🇩", data: { ...defaultData, continent: "Europe", currency: "MDL" } },
  { name: "Georgia", code: "GE", flag: "🇬🇪", data: { ...defaultData, continent: "Asia", currency: "GEL" } },
  { name: "Armenia", code: "AM", flag: "🇦🇲", data: { ...defaultData, continent: "Asia", currency: "AMD" } },
  { name: "Azerbaijan", code: "AZ", flag: "🇦🇿", data: { ...defaultData, continent: "Asia", currency: "AZN" } },

  // Asian countries
  { name: "Singapore", code: "SG", flag: "🇸🇬", data: { ...defaultData, continent: "Asia", currency: "SGD" } },
  { name: "Thailand", code: "TH", flag: "🇹🇭", data: { ...defaultData, continent: "Asia", currency: "THB" } },
  { name: "Malaysia", code: "MY", flag: "🇲🇾", data: { ...defaultData, continent: "Asia", currency: "MYR" } },
  { name: "Vietnam", code: "VN", flag: "🇻🇳", data: { ...defaultData, continent: "Asia", currency: "VND" } },
  { name: "Philippines", code: "PH", flag: "🇵🇭", data: { ...defaultData, continent: "Asia", currency: "PHP" } },
  { name: "Bangladesh", code: "BD", flag: "🇧🇩", data: { ...defaultData, continent: "Asia", currency: "BDT" } },
  { name: "Pakistan", code: "PK", flag: "🇵🇰", data: { ...defaultData, continent: "Asia", currency: "PKR" } },
  { name: "Sri Lanka", code: "LK", flag: "🇱🇰", data: { ...defaultData, continent: "Asia", currency: "LKR" } },
  { name: "Myanmar", code: "MM", flag: "🇲🇲", data: { ...defaultData, continent: "Asia", currency: "MMK" } },
  { name: "Cambodia", code: "KH", flag: "🇰🇭", data: { ...defaultData, continent: "Asia", currency: "KHR" } },
  { name: "Laos", code: "LA", flag: "🇱🇦", data: { ...defaultData, continent: "Asia", currency: "LAK" } },
  { name: "Brunei", code: "BN", flag: "🇧🇳", data: { ...defaultData, continent: "Asia", currency: "BND" } },
  { name: "Mongolia", code: "MN", flag: "🇲🇳", data: { ...defaultData, continent: "Asia", currency: "MNT" } },
  { name: "Kazakhstan", code: "KZ", flag: "🇰🇿", data: { ...defaultData, continent: "Asia", currency: "KZT" } },
  { name: "Uzbekistan", code: "UZ", flag: "🇺🇿", data: { ...defaultData, continent: "Asia", currency: "UZS" } },
  { name: "Kyrgyzstan", code: "KG", flag: "🇰🇬", data: { ...defaultData, continent: "Asia", currency: "KGS" } },
  { name: "Tajikistan", code: "TJ", flag: "🇹🇯", data: { ...defaultData, continent: "Asia", currency: "TJS" } },
  { name: "Turkmenistan", code: "TM", flag: "🇹🇲", data: { ...defaultData, continent: "Asia", currency: "TMT" } },
  { name: "Afghanistan", code: "AF", flag: "🇦🇫", data: { ...defaultData, continent: "Asia", currency: "AFN" } },
  { name: "Nepal", code: "NP", flag: "🇳🇵", data: { ...defaultData, continent: "Asia", currency: "NPR" } },
  { name: "Bhutan", code: "BT", flag: "🇧🇹", data: { ...defaultData, continent: "Asia", currency: "BTN" } },
  { name: "Maldives", code: "MV", flag: "🇲🇻", data: { ...defaultData, continent: "Asia", currency: "MVR" } },

  // Middle Eastern countries
  { name: "United Arab Emirates", code: "AE", flag: "🇦🇪", data: { ...defaultData, continent: "Asia", currency: "AED" } },
  { name: "Israel", code: "IL", flag: "🇮🇱", data: { ...defaultData, continent: "Asia", currency: "ILS" } },
  { name: "Iran", code: "IR", flag: "🇮🇷", data: { ...defaultData, continent: "Asia", currency: "IRR" } },
  { name: "Iraq", code: "IQ", flag: "🇮🇶", data: { ...defaultData, continent: "Asia", currency: "IQD" } },
  { name: "Jordan", code: "JO", flag: "🇯🇴", data: { ...defaultData, continent: "Asia", currency: "JOD" } },
  { name: "Lebanon", code: "LB", flag: "🇱🇧", data: { ...defaultData, continent: "Asia", currency: "LBP" } },
  { name: "Syria", code: "SY", flag: "🇸🇾", data: { ...defaultData, continent: "Asia", currency: "SYP" } },
  { name: "Kuwait", code: "KW", flag: "🇰🇼", data: { ...defaultData, continent: "Asia", currency: "KWD" } },
  { name: "Qatar", code: "QA", flag: "🇶🇦", data: { ...defaultData, continent: "Asia", currency: "QAR" } },
  { name: "Bahrain", code: "BH", flag: "🇧🇭", data: { ...defaultData, continent: "Asia", currency: "BHD" } },
  { name: "Oman", code: "OM", flag: "🇴🇲", data: { ...defaultData, continent: "Asia", currency: "OMR" } },
  { name: "Yemen", code: "YE", flag: "🇾🇪", data: { ...defaultData, continent: "Asia", currency: "YER" } },

  // African countries
  { name: "South Africa", code: "ZA", flag: "🇿🇦", data: { ...defaultData, continent: "Africa", currency: "ZAR" } },
  { name: "Nigeria", code: "NG", flag: "🇳🇬", data: { ...defaultData, continent: "Africa", currency: "NGN" } },
  { name: "Egypt", code: "EG", flag: "🇪🇬", data: { ...defaultData, continent: "Africa", currency: "EGP" } },
  { name: "Morocco", code: "MA", flag: "🇲🇦", data: { ...defaultData, continent: "Africa", currency: "MAD" } },
  { name: "Kenya", code: "KE", flag: "🇰🇪", data: { ...defaultData, continent: "Africa", currency: "KES" } },
  { name: "Ethiopia", code: "ET", flag: "🇪🇹", data: { ...defaultData, continent: "Africa", currency: "ETB" } },
  { name: "Ghana", code: "GH", flag: "🇬🇭", data: { ...defaultData, continent: "Africa", currency: "GHS" } },
  { name: "Tanzania", code: "TZ", flag: "🇹🇿", data: { ...defaultData, continent: "Africa", currency: "TZS" } },
  { name: "Uganda", code: "UG", flag: "🇺🇬", data: { ...defaultData, continent: "Africa", currency: "UGX" } },
  { name: "Rwanda", code: "RW", flag: "🇷🇼", data: { ...defaultData, continent: "Africa", currency: "RWF" } },
  { name: "Senegal", code: "SN", flag: "🇸🇳", data: { ...defaultData, continent: "Africa", currency: "XOF" } },
  { name: "Ivory Coast", code: "CI", flag: "🇨🇮", data: { ...defaultData, continent: "Africa", currency: "XOF" } },
  { name: "Cameroon", code: "CM", flag: "🇨🇲", data: { ...defaultData, continent: "Africa", currency: "XAF" } },
  { name: "Tunisia", code: "TN", flag: "🇹🇳", data: { ...defaultData, continent: "Africa", currency: "TND" } },
  { name: "Algeria", code: "DZ", flag: "🇩🇿", data: { ...defaultData, continent: "Africa", currency: "DZD" } },
  { name: "Libya", code: "LY", flag: "🇱🇾", data: { ...defaultData, continent: "Africa", currency: "LYD" } },
  { name: "Sudan", code: "SD", flag: "🇸🇩", data: { ...defaultData, continent: "Africa", currency: "SDG" } },
  { name: "Zambia", code: "ZM", flag: "🇿🇲", data: { ...defaultData, continent: "Africa", currency: "ZMW" } },
  { name: "Zimbabwe", code: "ZW", flag: "🇿🇼", data: { ...defaultData, continent: "Africa", currency: "ZWL" } },
  { name: "Botswana", code: "BW", flag: "🇧🇼", data: { ...defaultData, continent: "Africa", currency: "BWP" } },
  { name: "Namibia", code: "NA", flag: "🇳🇦", data: { ...defaultData, continent: "Africa", currency: "NAD" } },
  { name: "Mozambique", code: "MZ", flag: "🇲🇿", data: { ...defaultData, continent: "Africa", currency: "MZN" } },
  { name: "Madagascar", code: "MG", flag: "🇲🇬", data: { ...defaultData, continent: "Africa", currency: "MGA" } },
  { name: "Mauritius", code: "MU", flag: "🇲🇺", data: { ...defaultData, continent: "Africa", currency: "MUR" } },
  { name: "Seychelles", code: "SC", flag: "🇸🇨", data: { ...defaultData, continent: "Africa", currency: "SCR" } },

  // North American countries
  { name: "Guatemala", code: "GT", flag: "🇬🇹", data: { ...defaultData, continent: "North America", currency: "GTQ" } },
  { name: "Belize", code: "BZ", flag: "🇧🇿", data: { ...defaultData, continent: "North America", currency: "BZD" } },
  { name: "El Salvador", code: "SV", flag: "🇸🇻", data: { ...defaultData, continent: "North America", currency: "USD" } },
  { name: "Honduras", code: "HN", flag: "🇭🇳", data: { ...defaultData, continent: "North America", currency: "HNL" } },
  { name: "Nicaragua", code: "NI", flag: "🇳🇮", data: { ...defaultData, continent: "North America", currency: "NIO" } },
  { name: "Costa Rica", code: "CR", flag: "🇨🇷", data: { ...defaultData, continent: "North America", currency: "CRC" } },
  { name: "Panama", code: "PA", flag: "🇵🇦", data: { ...defaultData, continent: "North America", currency: "PAB" } },
  { name: "Jamaica", code: "JM", flag: "🇯🇲", data: { ...defaultData, continent: "North America", currency: "JMD" } },
  { name: "Cuba", code: "CU", flag: "🇨🇺", data: { ...defaultData, continent: "North America", currency: "CUP" } },
  { name: "Dominican Republic", code: "DO", flag: "🇩🇴", data: { ...defaultData, continent: "North America", currency: "DOP" } },
  { name: "Haiti", code: "HT", flag: "🇭🇹", data: { ...defaultData, continent: "North America", currency: "HTG" } },
  { name: "Trinidad and Tobago", code: "TT", flag: "🇹🇹", data: { ...defaultData, continent: "North America", currency: "TTD" } },
  { name: "Barbados", code: "BB", flag: "🇧🇧", data: { ...defaultData, continent: "North America", currency: "BBD" } },
  { name: "Bahamas", code: "BS", flag: "🇧🇸", data: { ...defaultData, continent: "North America", currency: "BSD" } },

  // South American countries
  { name: "Peru", code: "PE", flag: "🇵🇪", data: { ...defaultData, continent: "South America", currency: "PEN" } },
  { name: "Argentina", code: "AR", flag: "🇦🇷", data: { ...defaultData, continent: "South America", currency: "ARS" } },
  { name: "Chile", code: "CL", flag: "🇨🇱", data: { ...defaultData, continent: "South America", currency: "CLP" } },
  { name: "Colombia", code: "CO", flag: "🇨🇴", data: { ...defaultData, continent: "South America", currency: "COP" } },
  { name: "Venezuela", code: "VE", flag: "🇻🇪", data: { ...defaultData, continent: "South America", currency: "VES" } },
  { name: "Ecuador", code: "EC", flag: "🇪🇨", data: { ...defaultData, continent: "South America", currency: "USD" } },
  { name: "Bolivia", code: "BO", flag: "🇧🇴", data: { ...defaultData, continent: "South America", currency: "BOB" } },
  { name: "Paraguay", code: "PY", flag: "🇵🇾", data: { ...defaultData, continent: "South America", currency: "PYG" } },
  { name: "Uruguay", code: "UY", flag: "🇺🇾", data: { ...defaultData, continent: "South America", currency: "UYU" } },
  { name: "Guyana", code: "GY", flag: "🇬🇾", data: { ...defaultData, continent: "South America", currency: "GYD" } },
  { name: "Suriname", code: "SR", flag: "🇸🇷", data: { ...defaultData, continent: "South America", currency: "SRD" } },

  // Oceania
  { name: "New Zealand", code: "NZ", flag: "🇳🇿", data: { ...defaultData, continent: "Oceania", currency: "NZD" } },
  { name: "Fiji", code: "FJ", flag: "🇫🇯", data: { ...defaultData, continent: "Oceania", currency: "FJD" } },
  { name: "Papua New Guinea", code: "PG", flag: "🇵🇬", data: { ...defaultData, continent: "Oceania", currency: "PGK" } },
  { name: "Solomon Islands", code: "SB", flag: "🇸🇧", data: { ...defaultData, continent: "Oceania", currency: "SBD" } },
  { name: "Vanuatu", code: "VU", flag: "🇻🇺", data: { ...defaultData, continent: "Oceania", currency: "VUV" } },
  { name: "Samoa", code: "WS", flag: "🇼🇸", data: { ...defaultData, continent: "Oceania", currency: "WST" } },
  { name: "Tonga", code: "TO", flag: "🇹🇴", data: { ...defaultData, continent: "Oceania", currency: "TOP" } },
  { name: "Palau", code: "PW", flag: "🇵🇼", data: { ...defaultData, continent: "Oceania", currency: "USD" } },
  { name: "Micronesia", code: "FM", flag: "🇫🇲", data: { ...defaultData, continent: "Oceania", currency: "USD" } },
  { name: "Marshall Islands", code: "MH", flag: "🇲🇭", data: { ...defaultData, continent: "Oceania", currency: "USD" } },
  { name: "Kiribati", code: "KI", flag: "🇰🇮", data: { ...defaultData, continent: "Oceania", currency: "AUD" } },
  { name: "Nauru", code: "NR", flag: "🇳🇷", data: { ...defaultData, continent: "Oceania", currency: "AUD" } },
  { name: "Tuvalu", code: "TV", flag: "🇹🇻", data: { ...defaultData, continent: "Oceania", currency: "AUD" } }
];

export type { Country }; 