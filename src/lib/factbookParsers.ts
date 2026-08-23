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
