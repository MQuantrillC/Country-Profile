'use client';

// Age structure, male left and female right.
//
// Two series, so slots 1 and 2 of the categorical palette, and each side is
// labelled in the header rather than by colour alone. The Factbook publishes three
// to five bands depending on the country, so the chart sizes itself to whatever it
// is given instead of assuming a fixed set.
//
// Bars are drawn as a share of the country's own population so two countries with
// very different totals stay comparable side by side.

import React from 'react';
import type { AgeBand } from '../../lib/factbookParsers';
import { AXIS_TEXT, seriesVar } from '../../lib/chartTheme';

interface PopulationPyramidProps {
  bands: AgeBand[];
  countryName: string;
}

const WIDTH = 360;
const ROW_HEIGHT = 30;
const GUTTER = 74; // centre column holding the band labels
const BAR_GAP = 2; // the surface gap the mark spec asks for between fills

export function PopulationPyramid({ bands, countryName }: PopulationPyramidProps) {
  if (bands.length === 0) return null;

  const total = bands.reduce((sum, b) => sum + b.male + b.female, 0);
  if (total === 0) return null;

  const height = bands.length * ROW_HEIGHT + 28;
  const half = (WIDTH - GUTTER) / 2;
  // Scale to the widest single bar so the largest band fills the space.
  const widest = Math.max(...bands.flatMap((b) => [b.male, b.female])) / total;
  const barWidth = (count: number) => (widest === 0 ? 0 : (count / total / widest) * half);

  const pct = (count: number) => ((count / total) * 100).toFixed(1);

  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: seriesVar(0) }}
          />
          Male
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: seriesVar(1) }}
          />
          Female
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full"
        role="img"
        aria-label={`Age structure of ${countryName} by sex, ${bands.length} bands`}
      >
        {bands.map((band, i) => {
          const y = i * ROW_HEIGHT + 4;
          const maleW = barWidth(band.male);
          const femaleW = barWidth(band.female);
          const centre = WIDTH / 2;

          return (
            <g key={band.label}>
              {/* Male extends left from the gutter edge. */}
              <rect
                x={centre - GUTTER / 2 - BAR_GAP - maleW}
                y={y}
                width={maleW}
                height={ROW_HEIGHT - 10}
                rx={4}
                fill={seriesVar(0)}
              />
              <rect
                x={centre + GUTTER / 2 + BAR_GAP}
                y={y}
                width={femaleW}
                height={ROW_HEIGHT - 10}
                rx={4}
                fill={seriesVar(1)}
              />
              <text
                x={centre}
                y={y + (ROW_HEIGHT - 10) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                className="fill-gray-600 dark:fill-gray-300"
              >
                {band.label.replace(/\s*years?\s*/i, '').replace('and over', '+')}
              </text>
            </g>
          );
        })}

        <text x={4} y={height - 6} fontSize={10} fill={AXIS_TEXT}>
          {pct(bands.reduce((s, b) => s + b.male, 0))}% male
        </text>
        <text x={WIDTH - 4} y={height - 6} textAnchor="end" fontSize={10} fill={AXIS_TEXT}>
          {pct(bands.reduce((s, b) => s + b.female, 0))}% female
        </text>
      </svg>
    </figure>
  );
}
