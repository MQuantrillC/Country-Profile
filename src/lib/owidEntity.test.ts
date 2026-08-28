import { describe, expect, it } from 'vitest';
import { countries } from './countries';
import { findOwidEntity, owidCountryName } from './owidEntity';

/** A stand-in for an OWID indicator's metadata, which stamps entities with ISO3. */
const metadata = {
  dimensions: {
    entities: {
      values: [
        { id: 15, name: 'Afghanistan', code: 'AFG' },
        { id: 106, name: 'New Zealand', code: 'NZL' },
        { id: 273, name: 'Africa', code: 'OWID_AFR' },
        { id: 999, name: 'Somewhere', code: null },
      ],
    },
  },
};

describe('findOwidEntity', () => {
  it('matches on ISO3', () => {
    expect(findOwidEntity(metadata, 'NZ')?.id).toBe(106);
  });

  it('reaches countries the old hand-written name table left out', () => {
    // The routes used to map ISO2 to an English name through a 124-entry table and
    // match on the name. New Zealand was one of 71 countries missing from it, so
    // its HDI rendered as "no data" even though OWID publishes it.
    expect(findOwidEntity(metadata, 'NZ')).not.toBeNull();
  });

  it('is case-insensitive about the code it is given', () => {
    expect(findOwidEntity(metadata, 'nz')?.id).toBe(106);
  });

  it('falls back to the name for an entity published without a code', () => {
    const named = { dimensions: { entities: { values: [{ id: 7, name: 'New Zealand' }] } } };
    expect(findOwidEntity(named, 'NZ')?.id).toBe(7);
  });

  it('returns null for an unknown country and for missing metadata', () => {
    expect(findOwidEntity(metadata, 'ZZ')).toBeNull();
    expect(findOwidEntity(null, 'NZ')).toBeNull();
    expect(findOwidEntity({}, 'NZ')).toBeNull();
  });

  it('does not match a country to an aggregate', () => {
    // OWID mixes regions and income groups into the same entity list.
    for (const country of countries) {
      const hit = findOwidEntity(metadata, country.code);
      expect(hit?.code?.startsWith('OWID_')).not.toBe(true);
    }
  });
});

describe('owidCountryName', () => {
  it('uses the common English name', () => {
    expect(owidCountryName('NZ')).toBe('New Zealand');
  });

  it('overrides the names OWID spells differently, for the CSV path', () => {
    expect(owidCountryName('CD')).toBe('Democratic Republic of Congo');
    expect(owidCountryName('TR')).toBe('Turkey');
  });

  it('returns null for an unknown code', () => {
    expect(owidCountryName('ZZ')).toBeNull();
  });
});
