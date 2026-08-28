'use client';

// A single metric's trend, small enough to sit inside a table cell.
//
// One series, so no legend and no categorical palette: the surrounding row names
// the metric and the cell beside it carries the current value. The last point is
// emphasised because "where it ended up" is the number the reader just read.

import React, { useId } from 'react';
import type { SeriesPoint } from '../../types/country';
import { linePath, linearScale, niceDomain } from '../../lib/chartTheme';

interface SparklineProps {
  series: SeriesPoint[];
  /** Accessible description; the visual is decorative next to the printed value. */
  label: string;
  width?: number;
  height?: number;
}

/** Below this many points a line says nothing a number has not already said. */
const MIN_POINTS = 3;

export function Sparkline({ series, label, width = 56, height = 20 }: SparklineProps) {
  const gradientId = useId();

  if (series.length < MIN_POINTS) return null;

  const pad = 2;
  const values = series.map((p) => p.value);
  const domain = niceDomain(Math.min(...values), Math.max(...values));

  const x = linearScale([series[0].year, series[series.length - 1].year], [pad, width - pad]);
  const y = linearScale(domain, [height - pad, pad]);

  const points = series.map((p) => ({ x: x(p.year), y: y(p.value) }));
  const last = points[points.length - 1];

  const first = series[0].value;
  const latest = series[series.length - 1].value;
  const direction = latest > first ? 'rising' : latest < first ? 'falling' : 'flat';

  // Area fill under the line, faded out, to give the line weight at this size
  // without adding a second colour.
  const area = `${linePath(points)} L${last.x.toFixed(2)},${height - pad} L${points[0].x.toFixed(2)},${height - pad} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible text-gray-400 dark:text-gray-500"
      role="img"
      aria-label={`${label}: ${direction} from ${series[0].year} to ${series[series.length - 1].year}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={linePath(points)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* The endpoint is the value printed beside it, so it gets the emphasis. */}
      <circle cx={last.x} cy={last.y} r={2} fill="currentColor" />
    </svg>
  );
}
