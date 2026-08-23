import { describe, expect, it } from 'vitest';
import { countries, getCountry, toIso3, toGec } from './countries';
import {
  countries as clientCountries,
  fromIso3,
  getCountry as getClientCountry,
  missingCoverage,
} from './countryList';

describe('the generated country table', () => {
  it('covers the UN member states', () => {
    expect(countries.length).toBeGreaterThan(180);
    expect(countries.length).toBeLessThan(210);
  });

  it('has no duplicate ISO2 or ISO3 codes', () => {
    expect(new Set(countries.map((c) => c.code)).size).toBe(countries.length);
    expect(new Set(countries.map((c) => c.iso3)).size).toBe(countries.length);
  });

  it('gives every country the fields the UI reads', () => {
    for (const country of countries) {
      expect(country.code, country.name).toMatch(/^[A-Z]{2}$/);
      expect(country.iso3, country.name).toMatch(/^[A-Z]{3}$/);
      expect(country.name, country.code).toBeTruthy();
      expect(country.flag, country.code).toBeTruthy();
      expect(Array.isArray(country.timezones), country.code).toBe(true);
      expect(Array.isArray(country.capital), country.code).toBe(true);
    }
  });

  it('formats timezones as UTC offsets', () => {
    for (const country of countries) {
      for (const zone of country.timezones) {
        expect(zone, `${country.code} ${zone}`).toMatch(/^UTC[+-]\d{2}:\d{2}$/);
      }
    }
  });

  it('stays in sync with the slim client list', () => {
    // The two are generated together; a mismatch means one was rebuilt alone.
    expect(clientCountries.length).toBe(countries.length);
    expect(clientCountries.map((c) => c.code)).toEqual(countries.map((c) => c.code));
  });

  it('keeps the client list free of the server-only fields', () => {
    // Shipping capital/currency/language/timezone would add ~75 kB to the bundle.
    const sample = clientCountries[0] as unknown as Record<string, unknown>;
    expect(sample.timezones).toBeUndefined();
    expect(sample.currencies).toBeUndefined();
    expect(sample.languages).toBeUndefined();
  });
});

describe('code lookups', () => {
  it('finds a country by ISO2', () => {
    expect(getCountry('PE')?.name).toBe('Peru');
  });

  it('is case-insensitive', () => {
    expect(getCountry('pe')?.iso3).toBe('PER');
  });

  it('returns undefined rather than throwing on unknown or empty input', () => {
    expect(getCountry('ZZ')).toBeUndefined();
    expect(getCountry('')).toBeUndefined();
    expect(getCountry(null)).toBeUndefined();
    expect(getCountry(undefined)).toBeUndefined();
  });

  it('converts ISO2 to ISO3', () => {
    expect(toIso3('BR')).toBe('BRA');
    expect(toIso3('de')).toBe('DEU');
  });

  it('passes an ISO3 code through unchanged', () => {
    expect(toIso3('BRA')).toBe('BRA');
  });

  it('returns undefined for a code it does not recognise', () => {
    expect(toIso3('XX')).toBeUndefined();
  });

  it('resolves ISO3 back to a country for World Bank rows', () => {
    expect(fromIso3('USA')?.code).toBe('US');
    expect(fromIso3('usa')?.code).toBe('US');
  });

  it('does not resolve World Bank aggregate codes', () => {
    // This is what keeps "Arab World", "OECD members" and the income groups out
    // of the rankings without pattern-matching their names.
    for (const aggregate of ['WLD', 'ARB', 'OED', 'EUU', 'LIC', 'HIC']) {
      expect(fromIso3(aggregate), aggregate).toBeUndefined();
    }
  });

  it('maps ISO2 to the CIA GEC code, which is unrelated to ISO', () => {
    // Germany is DE / DEU in ISO but "gm" in the CIA scheme.
    expect(toGec('DE')).toBe('gm');
    expect(toGec('US')).toBe('us');
  });

  it('returns undefined where the Factbook has no entry', () => {
    const uncovered = countries.find((c) => !c.coverage.factbook);
    expect(uncovered).toBeDefined();
    expect(toGec(uncovered!.code)).toBeUndefined();
  });
});

describe('coverage reporting', () => {
  it('reports nothing missing for a well-covered country', () => {
    expect(missingCoverage('US')).toEqual([]);
  });

  it('names the datasets that have no figures for a country', () => {
    const uncovered = clientCountries.find((c) => !c.coverage.factbook);
    expect(uncovered).toBeDefined();
    expect(missingCoverage(uncovered!.code)).toContain('factbook');
  });

  it('never reports World Bank as missing, since it accepts every ISO2 code', () => {
    for (const country of clientCountries) {
      expect(missingCoverage(country.code), country.code).not.toContain('worldBank');
    }
  });

  it('returns nothing for an unknown code', () => {
    expect(missingCoverage('ZZ')).toEqual([]);
  });

  it('exposes the same country through both lookups', () => {
    expect(getClientCountry('JP')?.name).toBe(getCountry('JP')?.name);
  });
});
