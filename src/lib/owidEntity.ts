import { getCountry } from './countries';

export interface OwidEntity {
  id: number;
  name: string;
  code?: string | null;
}

export interface OwidMetadata {
  dimensions?: { entities?: { values?: OwidEntity[] } };
}

/**
 * Locate a country in an Our World in Data indicator's entity list.
 *
 * OWID stamps every country entity with its ISO 3166-1 alpha-3 code, so alpha-3 is
 * the match. The routes used to resolve the alpha-2 code to an English name
 * through a hand-maintained table of about 124 entries and match on that name -
 * which meant the 71 countries nobody had extended the table to cover returned
 * null regardless of whether OWID published them. New Zealand, Kazakhstan, Cuba,
 * Uzbekistan, DR Congo, Angola and Yemen were all in that group.
 *
 * Matching on alpha-3 against the HDI indicator reaches 191 of the app's 194
 * countries; the three that miss (Monaco, North Korea, the Vatican) are genuine
 * UNDP gaps rather than lookup failures.
 *
 * The name comparison is kept as a fallback for the handful of entities OWID
 * publishes without a code.
 */
export function findOwidEntity(
  metadata: OwidMetadata | null | undefined,
  code: string
): OwidEntity | null {
  const entities = metadata?.dimensions?.entities?.values;
  if (!Array.isArray(entities)) return null;

  const country = getCountry(code);
  if (!country) return null;

  const byCode = entities.find((entity) => entity.code === country.iso3);
  if (byCode) return byCode;

  const name = country.name.toLowerCase();
  return entities.find((entity) => entity.name?.toLowerCase() === name) ?? null;
}

/**
 * Names OWID spells differently from the bundled country table.
 *
 * Only needed on the CSV path, where there is no code column to match on. The
 * JSON indicators are matched by ISO3 and never consult this.
 */
const OWID_NAME_OVERRIDES: Record<string, string> = {
  CD: 'Democratic Republic of Congo',
  CI: "Cote d'Ivoire",
  FM: 'Micronesia (country)',
  ST: 'Sao Tome and Principe',
  TL: 'East Timor',
  TR: 'Turkey',
};

/** The country's common English name, which is how OWID labels rows in its CSVs. */
export function owidCountryName(code: string): string | null {
  const country = getCountry(code);
  if (!country) return null;
  return OWID_NAME_OVERRIDES[country.code] ?? country.name;
}
