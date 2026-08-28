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
  parseAgeBands,
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

describe('age band parsing', () => {
  // The real shape of the Factbook's age-structure field.
  const PERU = '0-14 years: 25.8% (male 4,293,229/female 4,119,269); ' +
    '15-64 years: 66.2% (male 10,546,502/female 11,041,106); ' +
    '65 years and over: 8% (2024 est.) (male 1,112,825/female 1,487,318)';

  it('reads every band with its counts', () => {
    const bands = parseAgeBands(PERU);
    expect(bands).toHaveLength(3);
    expect(bands[0]).toEqual({ label: '0-14 years', male: 4_293_229, female: 4_119_269 });
    expect(bands[2].female).toBe(1_487_318);
  });

  it('strips thousands separators', () => {
    expect(parseAgeBands(PERU)[1].male).toBe(10_546_502);
  });

  it('keeps bands in source order, youngest first', () => {
    expect(parseAgeBands(PERU).map((b) => b.label)).toEqual([
      '0-14 years',
      '15-64 years',
      '65 years and over',
    ]);
  });

  it('tolerates the parenthetical year that only some bands carry', () => {
    // The third band has "(2024 est.)" between the percentage and the counts.
    expect(parseAgeBands(PERU)[2].male).toBe(1_112_825);
  });

  it('returns nothing for absent or unparseable input', () => {
    expect(parseAgeBands(null)).toEqual([]);
    expect(parseAgeBands(undefined)).toEqual([]);
    expect(parseAgeBands('')).toEqual([]);
    expect(parseAgeBands('no age data published')).toEqual([]);
  });

  it('skips bands with no counts rather than emitting NaN', () => {
    const bands = parseAgeBands('0-14 years: 25.8%; 15-64 years: 66.2% (male 10/female 11)');
    expect(bands).toHaveLength(1);
    expect(bands[0].male).toBe(10);
  });

  it('handles a five-band country', () => {
    const five =
      '0-14 years: 18% (male 1/female 2); 15-24 years: 13% (male 3/female 4); ' +
      '25-54 years: 39% (male 5/female 6); 55-64 years: 13% (male 7/female 8); ' +
      '65 years and over: 17% (male 9/female 10)';
    expect(parseAgeBands(five)).toHaveLength(5);
  });
});
