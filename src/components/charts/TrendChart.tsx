'use client';

// One metric over time, with a line per selected country.
//
// Up to five identities, and the pairs a reader compares are adjacent lines, so the
// validated categorical palette applies. Lines are also direct-labelled at their
// right-hand end, which both satisfies the light-mode contrast relief rule and
// removes the legend round-trip.

import React, { useMemo, useState } from 'react';
import type { SeriesPoint } from '../../types/country';
import {
  AXIS_TEXT,
  GRID_LINE,
  compactNumber,
  linePath,
  linearScale,
  niceDomain,
  seriesVar,
  ticks,
} from '../../lib/chartTheme';

export interface TrendSeries {
  code: string;
  name: string;
  /** Index into the categorical palette; fixed per country, never recycled. */
  colorIndex: number;
  points: SeriesPoint[];
}

interface TrendChartProps {
  series: TrendSeries[];
  /** Renders a value for the axis and tooltip, e.g. "80.1%". */
  format: (value: number) => string;
  height?: number;
}

const MARGIN = { top: 12, right: 84, bottom: 24, left: 52 };

export function TrendChart({ series, format, height = 220 }: TrendChartProps) {
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  // Rendered at a fixed viewBox width and scaled by CSS, so it stays sharp at any
  // container width without needing a resize observer.
  const width = 720;

  const withData = useMemo(() => series.filter((s) => s.points.length > 1), [series]);

  const scales = useMemo(() => {
    const allPoints = withData.flatMap((s) => s.points);
    if (allPoints.length === 0) return null;

    const years = allPoints.map((p) => p.year);
    const values = allPoints.map((p) => p.value);
    const yDomain = niceDomain(Math.min(...values), Math.max(...values));

    return {
      x: linearScale([Math.min(...years), Math.max(...years)], [MARGIN.left, width - MARGIN.right]),
      y: linearScale(yDomain, [height - MARGIN.bottom, MARGIN.top]),
      yDomain,
      years: [...new Set(years)].sort((a, b) => a - b),
    };
  }, [withData, height]);

  if (!scales) {
    return (
      <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        No time series is published for this metric.
      </p>
    );
  }

  const { x, y, yDomain, years } = scales;

  const yearFromPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    // The SVG is scaled by CSS, so map client pixels back into viewBox units.
    const vx = ((event.clientX - rect.left) / rect.width) * width;
    let closest = years[0];
    for (const year of years) {
      if (Math.abs(x(year) - vx) < Math.abs(x(closest) - vx)) closest = year;
    }
    return closest;
  };

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full touch-pan-y"
        style={{ height }}
        role="img"
        aria-label={`Trend over time for ${withData.map((s) => s.name).join(', ')}`}
        onPointerMove={(e) => setHoverYear(yearFromPointer(e))}
        onPointerLeave={() => setHoverYear(null)}
      >
        {/* Recessive grid: horizontal only, so it never competes with the lines. */}
        {ticks(yDomain, 4).map((value) => (
          <g key={value}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(value)}
              y2={y(value)}
              stroke={GRID_LINE}
              strokeWidth={1}
            />
            <text
              x={MARGIN.left - 8}
              y={y(value)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill={AXIS_TEXT}
            >
              {compactNumber(value)}
            </text>
          </g>
        ))}

        {/* First and last year only; intermediate ticks add noise at this width. */}
        {[years[0], years[years.length - 1]].map((year, i) => (
          <text
            key={`${year}-${i}`}
            x={x(year)}
            y={height - 6}
            textAnchor={i === 0 ? 'start' : 'end'}
            fontSize={11}
            fill={AXIS_TEXT}
          >
            {year}
          </text>
        ))}

        {hoverYear !== null && (
          <line
            x1={x(hoverYear)}
            x2={x(hoverYear)}
            y1={MARGIN.top}
            y2={height - MARGIN.bottom}
            stroke={AXIS_TEXT}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {withData.map((s) => {
          const projected = s.points.map((p) => ({ x: x(p.year), y: y(p.value) }));
          const end = projected[projected.length - 1];
          const hovered = hoverYear !== null ? s.points.find((p) => p.year === hoverYear) : null;

          return (
            <g key={s.code}>
              <path
                d={linePath(projected)}
                fill="none"
                stroke={seriesVar(s.colorIndex)}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Direct label at the line end - identity without a legend lookup. */}
              <text
                x={end.x + 8}
                y={end.y}
                dominantBaseline="middle"
                fontSize={11}
                className="fill-gray-700 dark:fill-gray-200"
              >
                {s.code}
              </text>
              {hovered && (
                <circle
                  cx={x(hovered.year)}
                  cy={y(hovered.value)}
                  r={4}
                  fill={seriesVar(s.colorIndex)}
                  // A surface ring keeps overlapping markers separable.
                  className="stroke-white dark:stroke-gray-900"
                  strokeWidth={2}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* The readout lives in HTML rather than SVG so it wraps and scales normally. */}
      <div className="mt-1 min-h-[2.5rem] text-xs">
        {hoverYear !== null ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-medium tabular-nums text-gray-700 dark:text-gray-200">
              {hoverYear}
            </span>
            {withData.map((s) => {
              const point = s.points.find((p) => p.year === hoverYear);
              return (
                <span key={s.code} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: seriesVar(s.colorIndex) }}
                  />
                  {s.name}
                  <span className="tabular-nums font-medium">
                    {point ? format(point.value) : 'no data'}
                  </span>
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 dark:text-gray-500">
            Hover or drag across the chart to read values by year.
          </p>
        )}
      </div>
    </div>
  );
}
