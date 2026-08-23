// Metrics available on the global rankings page.
//
// Shared by the API route (which needs the World Bank indicator codes) and the page
// (which needs titles, units and sort direction), so the two cannot drift apart.

export interface RankingMetric {
  id: string;
  title: string;
  category: string;
  unit: string;
  description: string;
  /** Whether a higher value is the "good" end of the scale, for sort labelling. */
  higherIsBetter: boolean;
  /** World Bank series code. Absent for metrics derived from another metric. */
  indicator?: string;
  /** Computed from another metric's value rather than fetched. */
  derivedFrom?: { metric: string; transform: 'complementPercent' };
}

export const rankingMetrics: RankingMetric[] = [
  // Economy
  { id: 'gdp', title: 'GDP', category: 'Economy', unit: 'USD', description: 'Gross Domestic Product', higherIsBetter: true, indicator: 'NY.GDP.MKTP.CD' },
  { id: 'gdpPerCapita', title: 'GDP Per Capita', category: 'Economy', unit: 'USD', description: 'GDP per person', higherIsBetter: true, indicator: 'NY.GDP.PCAP.CD' },
  { id: 'gniPerCapita', title: 'GNI Per Capita', category: 'Economy', unit: 'USD', description: 'Gross National Income per person', higherIsBetter: true, indicator: 'NY.GNP.PCAP.CD' },
  { id: 'tradeGDP', title: 'Trade as % of GDP', category: 'Economy', unit: '%', description: 'Trade as percentage of GDP', higherIsBetter: true, indicator: 'NE.TRD.GNFS.ZS' },
  { id: 'unemploymentRate', title: 'Unemployment Rate', category: 'Economy', unit: '%', description: 'Unemployment as % of labor force', higherIsBetter: false, indicator: 'SL.UEM.TOTL.ZS' },

  // Demographics
  { id: 'population', title: 'Population', category: 'Demographics', unit: 'people', description: 'Total population', higherIsBetter: true, indicator: 'SP.POP.TOTL' },
  { id: 'lifeExpectancy', title: 'Life Expectancy', category: 'Demographics', unit: 'years', description: 'Life expectancy at birth', higherIsBetter: true, indicator: 'SP.DYN.LE00.IN' },
  { id: 'fertilityRate', title: 'Fertility Rate', category: 'Demographics', unit: 'births/woman', description: 'Births per woman', higherIsBetter: true, indicator: 'SP.DYN.TFRT.IN' },
  { id: 'urbanPopPct', title: 'Urban Population %', category: 'Demographics', unit: '%', description: 'Urban population percentage', higherIsBetter: true, indicator: 'SP.URB.TOTL.IN.ZS' },
  {
    id: 'ruralPopPct',
    title: 'Rural Population %',
    category: 'Demographics',
    unit: '%',
    description: 'Rural population percentage (100 - Urban %)',
    higherIsBetter: true,
    derivedFrom: { metric: 'urbanPopPct', transform: 'complementPercent' },
  },

  // Education & technology
  { id: 'educationSpendPctGDP', title: 'Education Spending % of GDP', category: 'Education', unit: '%', description: 'Education expenditure as % of GDP', higherIsBetter: true, indicator: 'SE.XPD.TOTL.GD.ZS' },
  { id: 'internetUsers', title: 'Internet Users %', category: 'Technology', unit: '%', description: 'Internet users as % of population', higherIsBetter: true, indicator: 'IT.NET.USER.ZS' },

  // Environment
  { id: 'forestPct', title: 'Forest Coverage %', category: 'Environment', unit: '%', description: 'Forest area as % of land', higherIsBetter: true, indicator: 'AG.LND.FRST.ZS' },
  { id: 'agriculturalLandPct', title: 'Agricultural Land %', category: 'Environment', unit: '%', description: 'Agricultural land as % of total', higherIsBetter: true, indicator: 'AG.LND.AGRI.ZS' },

  // Safety
  { id: 'homicideRate', title: 'Homicide Rate', category: 'Safety', unit: 'per 100k', description: 'Intentional homicides per 100,000', higherIsBetter: false, indicator: 'VC.IHR.PSRC.P5' },
];

/** One country's value for one metric. Country name and flag come from the client's own table. */
export interface RankingEntry {
  /** ISO 3166-1 alpha-2. */
  code: string;
  value: number;
  year: string;
}

export interface RankingsPayload {
  /** Metric id -> full ranking, sorted highest value first. */
  metrics: Record<string, RankingEntry[]>;
  /** Metric ids the upstream returned nothing for. */
  unavailable: string[];
  source: string;
}
