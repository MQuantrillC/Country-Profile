'use client';

// Where a country sits among all countries for one metric.
//
// A bare number cannot answer "is 5.7 homicides per 100k high?". This plots every
// country as a faint tick and marks the selected ones, so the answer is positional
// rather than numeric.
//
// The mass of countries is deliberately neutral: it is context, not identity. Only
// the selection carries a categorical hue, and each marked country is direct-
// labelled, so colour is never the sole channel.

import React, { useMemo, useState } from 'react';
import {
  AXIS_TEXT,
  NEUTRAL_MARK,
  compactNumber,
  linearScale,
  niceDomain,
  seriesVar,
} from '../../lib/chartTheme';

export interface StripMark {
  code: string;
  name: string;
  value: number;
  colorIndex: number;
}

interface DistributionStripProps {
  /** Every country's value for this metric, used as the backdrop. */
  all: Array<{ code: string; value: number }>;
  /** The countries currently being compared. */
  selected: StripMark[];
  format: (value: number) => string;
}

const WIDTH = 720;
const HEIGHT = 64;
const AXIS_Y = 38;

export function DistributionStrip({ all, selected, format }: DistributionStripProps) {
  const [hover, setHover] = useState<StripMark | null>(null);

  const scale = useMemo(() => {
    const values = all.map((d) => d.value);
    if (values.length === 0) return null;
    return linearScale(niceDomain(Math.min(...values), Math.max(...values)), [24, WIDTH - 24]);
  }, [all]);

  if (!scale || all.length === 0) return null;

  const [min, max] = scale.domain;

  /** How many countries this one is above, as a percentile. */
  const percentile = (value: number) =>
    Math.round((all.filter((d) => d.value < value).length / all.length) * 100);

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ height: HEIGHT }}
        role="img"
        aria-label={`Distribution across ${all.length} countries, with the selected countries marked`}
      >
        {/* Every country as a faint tick: the shape of the distribution. */}
        {all.map((d) => (
          <line
            key={d.code}
            x1={scale(d.value)}
            x2={scale(d.value)}
            y1={AXIS_Y - 9}
            y2={AXIS_Y + 9}
            stroke={NEUTRAL_MARK}
            strokeWidth={1}
            strokeOpacity={0.55}
          />
        ))}

        <line
          x1={24}
          x2={WIDTH - 24}
          y1={AXIS_Y}
          y2={AXIS_Y}
          stroke={NEUTRAL_MARK}
          strokeWidth={1}
        />

        {selected.map((mark) => (
          <g
            key={mark.code}
            onPointerEnter={() => setHover(mark)}
            onPointerLeave={() => setHover(null)}
          >
            <line
              x1={scale(mark.value)}
              x2={scale(mark.value)}
              y1={AXIS_Y - 14}
              y2={AXIS_Y + 14}
              stroke={seriesVar(mark.colorIndex)}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <text
              x={scale(mark.value)}
              y={AXIS_Y - 20}
              textAnchor="middle"
              fontSize={11}
              className="fill-gray-700 dark:fill-gray-200"
            >
              {mark.code}
            </text>
            {/* A generous invisible hit area - the visible mark is only 2.5px wide. */}
            <rect
              x={scale(mark.value) - 14}
              y={0}
              width={28}
              height={HEIGHT}
              fill="transparent"
            />
          </g>
        ))}

        <text x={24} y={HEIGHT - 4} fontSize={11} fill={AXIS_TEXT}>
          {compactNumber(min)}
        </text>
        <text x={WIDTH - 24} y={HEIGHT - 4} textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
          {compactNumber(max)}
        </text>
      </svg>

      <p className="min-h-[1.25rem] text-xs text-gray-500 dark:text-gray-400">
        {hover ? (
          <>
            <span className="font-medium text-gray-700 dark:text-gray-200">{hover.name}</span>{' '}
            {format(hover.value)} — higher than {percentile(hover.value)}% of {all.length} countries
          </>
        ) : (
          `Each tick is one of ${all.length} countries. Hover a marked country for its percentile.`
        )}
      </p>
    </div>
  );
}
