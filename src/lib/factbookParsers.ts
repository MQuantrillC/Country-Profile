// The Factbook publishes several figures as prose ("total: 9.5 liters of pure
// alcohol (2019 est.)"), so the numbers have to be pulled back out of the text.

export const parseAlcoholConsumption = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/total: ([\d.]+) liters of pure alcohol/);
  return match ? parseFloat(match[1]) : null;
};

export const parseTobaccoUse = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/total: ([\d.]+)%/);
  return match ? parseFloat(match[1]) : null;
};

export const parseTobaccoUseMale = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/male: ([\d.]+)%/);
  return match ? parseFloat(match[1]) : null;
};

export const parseTobaccoUseFemale = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/female: ([\d.]+)%/);
  return match ? parseFloat(match[1]) : null;
};

export const parseAlcoholBeer = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/beer: ([\d.]+) liters of pure alcohol/);
  return match ? parseFloat(match[1]) : null;
};

export const parseAlcoholWine = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/wine: ([\d.]+) liters of pure alcohol/);
  return match ? parseFloat(match[1]) : null;
};

export const parseAlcoholSpirits = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/spirits: ([\d.]+) liters of pure alcohol/);
  return match ? parseFloat(match[1]) : null;
};

export const parseAlcoholOther = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/other alcohols: ([\d.]+) liters of pure alcohol/);
  return match ? parseFloat(match[1]) : null;
};

/** Default view when the URL names no countries. */

/** One age band with its male and female headcounts. */
export interface AgeBand {
  label: string;
  male: number;
  female: number;
}

/**
 * Parse the Factbook's age-structure prose into bands.
 *
 * The source reads:
 *   "0-14 years: 25.8% (male 4,293,229/female 4,119,269); 15-64 years: ..."
 *
 * Band count varies by country - most give three, some five - so this returns
 * whatever it finds rather than assuming a fixed set.
 */
export function parseAgeBands(text: string | null | undefined): AgeBand[] {
  if (!text) return [];

  const bands: AgeBand[] = [];

  for (const part of text.split(';')) {
    const label = part.split(':')[0]?.trim();
    // Counts carry thousands separators and the pair is slash-delimited.
    const counts = part.match(/male\s+([\d,]+)\s*\/\s*female\s+([\d,]+)/i);
    if (!label || !counts) continue;

    const male = Number(counts[1].replace(/,/g, ''));
    const female = Number(counts[2].replace(/,/g, ''));
    if (!Number.isFinite(male) || !Number.isFinite(female)) continue;

    bands.push({ label, male, female });
  }

  return bands;
}
