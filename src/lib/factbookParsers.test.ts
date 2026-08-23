import { describe, expect, it } from 'vitest';
import {
  parseAlcoholBeer,
  parseAlcoholConsumption,
  parseAlcoholOther,
  parseAlcoholSpirits,
  parseAlcoholWine,
  parseTobaccoUse,
  parseTobaccoUseFemale,
  parseTobaccoUseMale,
} from './factbookParsers';

// The Factbook publishes these as prose, so the parsers work on real-shaped text.
const ALCOHOL = `total: 9.87 liters of pure alcohol (2019 est.)
beer: 4.51 liters of pure alcohol (2019 est.)
wine: 1.71 liters of pure alcohol (2019 est.)
spirits: 3.32 liters of pure alcohol (2019 est.)
other alcohols: 0.32 liters of pure alcohol (2019 est.)`;

const TOBACCO = `total: 23.2% (2020 est.)
male: 27.6% (2020 est.)
female: 18.8% (2020 est.)`;

describe('alcohol consumption parsing', () => {
  it('reads the total', () => {
    expect(parseAlcoholConsumption(ALCOHOL)).toBe(9.87);
  });

  it('reads each category separately', () => {
    expect(parseAlcoholBeer(ALCOHOL)).toBe(4.51);
    expect(parseAlcoholWine(ALCOHOL)).toBe(1.71);
    expect(parseAlcoholSpirits(ALCOHOL)).toBe(3.32);
    expect(parseAlcoholOther(ALCOHOL)).toBe(0.32);
  });

  it('does not confuse "other alcohols" with the total', () => {
    // Both lines contain "alcohol"; a loose pattern would collide.
    expect(parseAlcoholOther(ALCOHOL)).not.toBe(parseAlcoholConsumption(ALCOHOL));
  });

  it('returns null for absent input rather than throwing', () => {
    expect(parseAlcoholConsumption(null)).toBeNull();
    expect(parseAlcoholConsumption(undefined)).toBeNull();
    expect(parseAlcoholConsumption('')).toBeNull();
  });

  it('returns null when the text has no matching figure', () => {
    expect(parseAlcoholConsumption('no data available')).toBeNull();
    expect(parseAlcoholBeer('total: 9.87 liters of pure alcohol')).toBeNull();
  });

  it('handles a zero, which is a real value', () => {
    expect(parseAlcoholWine('wine: 0 liters of pure alcohol (2019 est.)')).toBe(0);
  });
});

describe('tobacco use parsing', () => {
  it('reads total, male and female separately', () => {
    expect(parseTobaccoUse(TOBACCO)).toBe(23.2);
    expect(parseTobaccoUseMale(TOBACCO)).toBe(27.6);
    expect(parseTobaccoUseFemale(TOBACCO)).toBe(18.8);
  });

  it('does not read the male figure as the female one', () => {
    expect(parseTobaccoUseMale(TOBACCO)).not.toBe(parseTobaccoUseFemale(TOBACCO));
  });

  it('returns null for absent input', () => {
    expect(parseTobaccoUse(null)).toBeNull();
    expect(parseTobaccoUseMale(undefined)).toBeNull();
  });

  it('returns null when a category is missing from the text', () => {
    expect(parseTobaccoUseFemale('total: 23.2% (2020 est.)')).toBeNull();
  });

  it('handles a zero percentage', () => {
    expect(parseTobaccoUse('total: 0% (2020 est.)')).toBe(0);
  });
});
