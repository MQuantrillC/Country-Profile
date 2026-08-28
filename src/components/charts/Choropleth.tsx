'use client';

// A world map shaded by one metric.
//
// The job here is magnitude, not identity, so this uses a sequential single-hue
// ramp rather than the categorical palette - light for low, dark for high, never a
// rainbow. Bins are quantiles rather than equal intervals because most of these
// measures are heavily skewed: on GDP, equal intervals would put 180 countries in
// the first bin and tell the reader nothing.
//
// Boundaries are pre-projected into SVG paths at build time (scripts/generate-map.js),
// so no projection or TopoJSON library ships to the browser. The file is fetched
// only when this view is opened.

import React, { useEffect, useMemo, useState } from 'react';
import { countries as countryList } from '../../lib/countryList';
import { AXIS_TEXT } from '../../lib/chartTheme';

interface WorldPaths {
  width: number;
  height: number;
  /** M49 numeric code -> SVG path data. */
  paths: Record<string, string>;
}

/** Shared across mounts so switching metrics never refetches the geometry. */
let worldPromise: Promise<WorldPaths | null> | null = null;

function loadWorld(): Promise<WorldPaths | null> {
  worldPromise ??= fetch('/world-countries.json')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return worldPromise;
}

const RAMP = ['var(--ramp-0)', 'var(--ramp-1)', 'var(--ramp-2)', 'var(--ramp-3)', 'var(--ramp-4)', 'var(--ramp-5)'];
const UNMAPPED = 'var(--chart-neutral)';

interface ChoroplethProps {
  /** Metric values by ISO2 country code. */
  values: Map<string, number>;
  format: (value: number) => string;
  /** True when a low value is the good end, which flips the ramp's meaning. */
  lowerIsBetter?: boolean;
}

export function Choropleth({ values, format, lowerIsBetter = false }: ChoroplethProps) {
  const [world, setWorld] = useState<WorldPaths | null>(null);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<{ name: string; value: number | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadWorld().then((data) => {
      if (cancelled) return;
      if (data) setWorld(data);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Quantile thresholds, so each band holds roughly the same number of countries. */
  const bins = useMemo(() => {
    const sorted = [...values.values()].filter(Number.isFinite).sort((a, b) => a - b);
    if (sorted.length === 0) return [];
    return Array.from(
      { length: RAMP.length - 1 },
      (_, i) => sorted[Math.floor((sorted.length * (i + 1)) / RAMP.length)]
    );
  }, [values]);

  const colorFor = (value: number): string => {
    let index = bins.findIndex((threshold) => value < threshold);
    if (index === -1) index = RAMP.length - 1;
    return RAMP[lowerIsBetter ? RAMP.length - 1 - index : index];
  };

  // Numeric map code -> the country record, so a hovered shape can be named.
  const byNumeric = useMemo(() => {
    const map = new Map<string, { name: string; code: string }>();
    for (const c of countryList) {
      if (c.ccn3) map.set(c.ccn3, { name: c.name, code: c.code });
    }
    return map;
  }, []);

  const unmapped = useMemo(
    () => (world ? [...values.keys()].filter((code) => {
      const country = countryList.find((c) => c.code === code);
      return !country?.ccn3 || !world.paths[country.ccn3];
    }) : []),
    [world, values]
  );

  if (failed) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        The map outlines could not be loaded.
      </p>
    );
  }

  if (!world) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading map…</p>
    );
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${world.width} ${world.height}`}
        className="w-full"
        role="img"
        aria-label={`World map shaded by value, ${values.size} countries with data`}
      >
        {Object.entries(world.paths).map(([numeric, d]) => {
          const country = byNumeric.get(numeric);
          const value = country ? values.get(country.code) : undefined;
          const hasValue = value !== undefined && Number.isFinite(value);

          return (
            <path
              key={numeric}
              d={d}
              fill={hasValue ? colorFor(value) : UNMAPPED}
              fillOpacity={hasValue ? 1 : 0.28}
              // A hairline in the surface colour separates adjacent fills.
              className="stroke-white dark:stroke-gray-900"
              strokeWidth={0.3}
              onPointerEnter={() =>
                country && setHover({ name: country.name, value: hasValue ? value : null })
              }
              onPointerLeave={() => setHover(null)}
            />
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{lowerIsBetter ? 'High' : 'Low'}</span>
          <div className="flex" role="img" aria-label="Colour scale from low to high">
            {RAMP.map((c, i) => (
              <span
                key={i}
                className="h-3 w-6 first:rounded-l last:rounded-r"
                style={{ backgroundColor: lowerIsBetter ? RAMP[RAMP.length - 1 - i] : c }}
              />
            ))}
          </div>
          <span>{lowerIsBetter ? 'Low' : 'High'}</span>
        </div>

        <p className="text-xs tabular-nums" style={{ color: AXIS_TEXT }}>
          {hover
            ? `${hover.name}: ${hover.value === null ? 'no data' : format(hover.value)}`
            : 'Hover a country for its value'}
        </p>
      </div>

      {unmapped.length > 0 && (
        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
          {unmapped.length} countries have data but are too small to appear at this map
          resolution ({unmapped.slice(0, 6).join(', ')}
          {unmapped.length > 6 ? '…' : ''}).
        </p>
      )}
    </div>
  );
}
