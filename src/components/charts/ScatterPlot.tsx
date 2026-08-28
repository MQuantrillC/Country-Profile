'use client';

// Two metrics against each other, every country plotted.
//
// This is an all-pairs form: a reader compares any dot with any other, not just
// neighbours. The validated palette does not clear all-pairs floors at five slots -
// a search over every 5-of-8 combination of the documented hues found none that
// does - so identity is NOT carried by colour here. Every country is drawn in the
// neutral, the selection is drawn in one accent, and each highlighted dot is
// direct-labelled. Colour marks "this is one of yours"; the label says which.

import React, { useMemo, useState } from 'react';
import {
  ACCENT_MARK,
  AXIS_TEXT,
  GRID_LINE,
  NEUTRAL_MARK,
  compactNumber,
  linearScale,
  niceDomain,
  ticks,
} from '../../lib/chartTheme';

export interface ScatterDatum {
  code: string;
  name: string;
  x: number;
  y: number;
  highlighted: boolean;
}

interface ScatterPlotProps {
  data: ScatterDatum[];
  xLabel: string;
  yLabel: string;
  formatX: (v: number) => string;
  formatY: (v: number) => string;
  /** Log scale suits heavily skewed measures such as GDP or population. */
  logX?: boolean;
}

const WIDTH = 720;
const HEIGHT = 420;
const MARGIN = { top: 16, right: 20, bottom: 46, left: 60 };

export function ScatterPlot({
  data,
  xLabel,
  yLabel,
  formatX,
  formatY,
  logX = false,
}: ScatterPlotProps) {
  const [hover, setHover] = useState<ScatterDatum | null>(null);

  const scales = useMemo(() => {
    // A log scale cannot represent zero or negatives; drop those points rather
    // than silently plotting them at the axis.
    const usable = data.filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y) && (!logX || d.x > 0));
    if (usable.length < 2) return null;

    const project = (v: number) => (logX ? Math.log10(v) : v);
    const xs = usable.map((d) => project(d.x));
    const ys = usable.map((d) => d.y);

    return {
      usable,
      project,
      x: linearScale(
        logX ? [Math.min(...xs), Math.max(...xs)] : niceDomain(Math.min(...xs), Math.max(...xs)),
        [MARGIN.left, WIDTH - MARGIN.right]
      ),
      y: linearScale(niceDomain(Math.min(...ys), Math.max(...ys)), [HEIGHT - MARGIN.bottom, MARGIN.top]),
    };
  }, [data, logX]);

  if (!scales) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Not enough countries report both measures to plot them against each other.
      </p>
    );
  }

  const { usable, project, x, y } = scales;
  const highlighted = usable.filter((d) => d.highlighted);

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`${yLabel} against ${xLabel} for ${usable.length} countries`}
      >
        {ticks(y.domain, 4).map((v) => (
          <g key={`y${v}`}>
            <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(v)} y2={y(v)} stroke={GRID_LINE} />
            <text x={MARGIN.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={AXIS_TEXT}>
              {compactNumber(v)}
            </text>
          </g>
        ))}
        {ticks(x.domain, 4).map((v) => (
          <text key={`x${v}`} x={x(v)} y={HEIGHT - MARGIN.bottom + 16} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
            {compactNumber(logX ? 10 ** v : v)}
          </text>
        ))}

        <text x={WIDTH / 2} y={HEIGHT - 6} textAnchor="middle" fontSize={12} fill={AXIS_TEXT}>
          {xLabel}
          {logX ? ' (log scale)' : ''}
        </text>
        <text
          transform={`translate(14 ${HEIGHT / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={12}
          fill={AXIS_TEXT}
        >
          {yLabel}
        </text>

        {/* The unselected mass first, so highlights always paint on top. */}
        {usable
          .filter((d) => !d.highlighted)
          .map((d) => (
            <circle
              key={d.code}
              cx={x(project(d.x))}
              cy={y(d.y)}
              r={hover?.code === d.code ? 6 : 4}
              fill={NEUTRAL_MARK}
              fillOpacity={0.75}
              onPointerEnter={() => setHover(d)}
              onPointerLeave={() => setHover(null)}
            />
          ))}

        {highlighted.map((d) => (
          <g key={d.code} onPointerEnter={() => setHover(d)} onPointerLeave={() => setHover(null)}>
            <circle
              cx={x(project(d.x))}
              cy={y(d.y)}
              r={6}
              fill={ACCENT_MARK}
              // Surface ring so overlapping highlights stay separable.
              className="stroke-white dark:stroke-gray-900"
              strokeWidth={2}
            />
            <text
              x={x(project(d.x)) + 10}
              y={y(d.y) - 8}
              fontSize={11}
              className="fill-gray-800 dark:fill-gray-100"
            >
              {d.name}
            </text>
          </g>
        ))}
      </svg>

      <p className="min-h-[1.25rem] text-xs text-gray-500 dark:text-gray-400">
        {hover ? (
          <>
            <span className="font-medium text-gray-700 dark:text-gray-200">{hover.name}</span> —{' '}
            {xLabel} {formatX(hover.x)}, {yLabel} {formatY(hover.y)}
          </>
        ) : (
          `${usable.length} countries plotted. Hover any point for its values.`
        )}
      </p>
    </div>
  );
}
