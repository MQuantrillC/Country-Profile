'use client';

// Two metrics against each other, every country plotted.
//
// This is an all-pairs form: a reader compares any dot with any other, not just
// neighbours. The validated palette does not clear all-pairs floors at five slots -
// a search over every 5-of-8 combination of the documented hues found none that
// does - so identity is NOT carried by colour here. Every country is drawn in the
// neutral, the selection is drawn in one accent, and each highlighted dot is
// direct-labelled. Colour marks "this is one of yours"; the label says which.
//
// Ten countries can be highlighted at once and they are usually the ten at one
// extreme, so their labels arrive already stacked on top of each other. They are
// pushed apart vertically and given leader lines rather than dropped, because
// dropping them would leave identity resting on colour alone.

import React, { useId, useMemo, useState } from 'react';
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
  /** Appended to the axis label, so the reader never has to guess the units. */
  xUnit?: string;
  yUnit?: string;
  /** Log scale suits heavily skewed measures such as GDP or population. */
  logX?: boolean;
}

const WIDTH = 720;
const HEIGHT = 420;
const MARGIN = { top: 10, right: 24, bottom: 48, left: 62 };

/** Line height for a direct label, and so the minimum gap between two of them. */
const LABEL_GAP = 13;
/** Rough advance width per character at fontSize 11, for edge detection. */
const CHAR_WIDTH = 5.7;

/**
 * Tick values for a log axis, at 1 and 3 per decade.
 *
 * Evenly spaced ticks on a log domain land on values like $1.2k and $28k, which
 * read as an arbitrary linear axis. Decade steps are what make the axis legible
 * as logarithmic.
 */
export function logTicks(min: number, max: number): number[] {
  const out: number[] = [];
  for (let exponent = Math.floor(min); exponent <= Math.ceil(max); exponent += 1) {
    for (const mantissa of [1, 3]) {
      const value = Math.log10(mantissa * 10 ** exponent);
      if (value >= min && value <= max) out.push(value);
    }
  }
  return out.length >= 3 ? out : ticks([min, max], 4);
}

/** Decade labels read as "1k, 3k, 10k" rather than "1.0k, 3.0k, 10.0k". */
function tickLabel(value: number): string {
  return compactNumber(value).replace(/\.0(?=[kMBT]?$)/, '');
}

/**
 * Push stacked labels apart, keeping them inside the plot and in their original
 * vertical order.
 *
 * A single downward sweep opens the gaps, then an upward sweep pulls back anything
 * driven past the bottom edge.
 */
export function spreadLabels(anchors: number[], top: number, bottom: number): number[] {
  const order = anchors.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const placed = order.map((o) => o.y);

  for (let i = 1; i < placed.length; i += 1) {
    if (placed[i] - placed[i - 1] < LABEL_GAP) placed[i] = placed[i - 1] + LABEL_GAP;
  }
  if (placed.length > 0 && placed[placed.length - 1] > bottom) {
    placed[placed.length - 1] = bottom;
    for (let i = placed.length - 2; i >= 0; i -= 1) {
      if (placed[i + 1] - placed[i] < LABEL_GAP) placed[i] = placed[i + 1] - LABEL_GAP;
    }
  }

  const result = new Array<number>(anchors.length);
  order.forEach((o, rank) => {
    result[o.i] = Math.max(top, placed[rank]);
  });
  return result;
}

/** Least-squares fit and Pearson r over the projected coordinates. */
export function fitLine(points: Array<{ x: number; y: number }>) {
  const n = points.length;
  if (n < 10) return null;

  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
    sxx += p.x * p.x;
    syy += p.y * p.y;
    sxy += p.x * p.y;
  }

  const varX = n * sxx - sx * sx;
  const varY = n * syy - sy * sy;
  if (varX === 0 || varY === 0) return null;

  const r = (n * sxy - sx * sy) / Math.sqrt(varX * varY);
  // Below this the line would suggest a relationship the data does not support.
  if (!Number.isFinite(r) || Math.abs(r) < 0.3) return null;

  const slope = (n * sxy - sx * sy) / varX;
  return { slope, intercept: (sy - slope * sx) / n, r };
}

export function ScatterPlot({
  data,
  xLabel,
  yLabel,
  formatX,
  formatY,
  xUnit,
  yUnit,
  logX = false,
}: ScatterPlotProps) {
  const [hover, setHover] = useState<ScatterDatum | null>(null);
  const clipId = useId();

  const scales = useMemo(() => {
    // A log scale cannot represent zero or negatives; drop those points rather
    // than silently plotting them at the axis.
    const usable = data.filter(
      (d) => Number.isFinite(d.x) && Number.isFinite(d.y) && (!logX || d.x > 0)
    );
    if (usable.length < 2) return null;

    const project = (v: number) => (logX ? Math.log10(v) : v);
    const xs = usable.map((d) => project(d.x));
    const ys = usable.map((d) => d.y);

    const xDomain: [number, number] = logX
      ? [Math.min(...xs), Math.max(...xs)]
      : niceDomain(Math.min(...xs), Math.max(...xs));

    return {
      usable,
      project,
      x: linearScale(xDomain, [MARGIN.left, WIDTH - MARGIN.right]),
      y: linearScale(niceDomain(Math.min(...ys), Math.max(...ys)), [
        HEIGHT - MARGIN.bottom,
        MARGIN.top,
      ]),
      fit: fitLine(usable.map((d) => ({ x: project(d.x), y: d.y }))),
    };
  }, [data, logX]);

  const labels = useMemo(() => {
    if (!scales) return [];
    const { usable, project, x, y } = scales;
    const highlighted = usable.filter((d) => d.highlighted);

    const anchors = highlighted.map((d) => y(d.y));
    const spread = spreadLabels(anchors, MARGIN.top + 4, HEIGHT - MARGIN.bottom);

    return highlighted.map((d, i) => {
      const cx = x(project(d.x));
      const width = d.name.length * CHAR_WIDTH;
      // Flip to the left of the dot when the label would run off the plot.
      const flip = cx + 10 + width > WIDTH - MARGIN.right;
      return {
        datum: d,
        cx,
        cy: y(d.y),
        labelX: flip ? cx - 10 : cx + 10,
        labelY: spread[i],
        anchor: flip ? ('end' as const) : ('start' as const),
      };
    });
  }, [scales]);

  if (!scales) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Not enough countries report both measures to plot them against each other.
      </p>
    );
  }

  const { usable, project, x, y, fit } = scales;
  const xTicks = logX ? logTicks(x.domain[0], x.domain[1]) : ticks(x.domain, 4);

  const axisLabel = (label: string, unit?: string) => {
    const parts = [unit, logX ? 'log scale' : null].filter(Boolean);
    return parts.length > 0 ? `${label} (${parts.join(', ')})` : label;
  };

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`${yLabel} against ${xLabel} for ${usable.length} countries`}
      >
        <defs>
          <clipPath id={clipId}>
            <rect
              x={MARGIN.left}
              y={MARGIN.top}
              width={WIDTH - MARGIN.left - MARGIN.right}
              height={HEIGHT - MARGIN.top - MARGIN.bottom}
            />
          </clipPath>
        </defs>

        {/* Recessive grid: the data should be the brightest thing on the chart. */}
        {ticks(y.domain, 4).map((v) => (
          <g key={`y${v}`}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={y(v)}
              y2={y(v)}
              stroke={GRID_LINE}
              strokeOpacity={0.6}
            />
            <text
              x={MARGIN.left - 8}
              y={y(v)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill={AXIS_TEXT}
            >
              {compactNumber(v)}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <g key={`x${v}`}>
            <line
              x1={x(v)}
              x2={x(v)}
              y1={MARGIN.top}
              y2={HEIGHT - MARGIN.bottom}
              stroke={GRID_LINE}
              strokeOpacity={0.35}
            />
            <text
              x={x(v)}
              y={HEIGHT - MARGIN.bottom + 16}
              textAnchor="middle"
              fontSize={11}
              fill={AXIS_TEXT}
            >
              {tickLabel(logX ? 10 ** v : v)}
            </text>
          </g>
        ))}

        <text x={WIDTH / 2} y={HEIGHT - 8} textAnchor="middle" fontSize={12} fill={AXIS_TEXT}>
          {axisLabel(xLabel, xUnit)}
        </text>
        <text
          transform={`translate(14 ${(HEIGHT - MARGIN.bottom + MARGIN.top) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={12}
          fill={AXIS_TEXT}
        >
          {yUnit ? `${yLabel} (${yUnit})` : yLabel}
        </text>

        {/* Least-squares fit, kept faint so it never competes with the points. */}
        {fit && (
          <line
            clipPath={`url(#${clipId})`}
            x1={x(x.domain[0])}
            x2={x(x.domain[1])}
            y1={y(fit.intercept + fit.slope * x.domain[0])}
            y2={y(fit.intercept + fit.slope * x.domain[1])}
            stroke={AXIS_TEXT}
            strokeWidth={1.5}
            strokeOpacity={0.4}
            strokeDasharray="6 4"
          />
        )}

        {/* The unselected mass first, so highlights always paint on top. */}
        {usable
          .filter((d) => !d.highlighted)
          .map((d) => (
            <circle
              key={d.code}
              cx={x(project(d.x))}
              cy={y(d.y)}
              r={hover?.code === d.code ? 6 : 4.5}
              fill={NEUTRAL_MARK}
              fillOpacity={hover?.code === d.code ? 0.95 : 0.5}
              onPointerEnter={() => setHover(d)}
              onPointerLeave={() => setHover(null)}
            />
          ))}

        {labels.map((l) => (
          <g
            key={l.datum.code}
            onPointerEnter={() => setHover(l.datum)}
            onPointerLeave={() => setHover(null)}
          >
            {/* Leader line, drawn only where the label had to move off its dot. */}
            {Math.abs(l.labelY - l.cy) > 2 && (
              <line
                x1={l.cx + (l.anchor === 'start' ? 5 : -5)}
                y1={l.cy}
                x2={l.labelX - (l.anchor === 'start' ? 2 : -2)}
                y2={l.labelY}
                stroke={AXIS_TEXT}
                strokeWidth={0.75}
                strokeOpacity={0.45}
              />
            )}
            <circle
              cx={l.cx}
              cy={l.cy}
              r={7}
              fill={ACCENT_MARK}
              // Surface ring so overlapping highlights stay separable.
              className="stroke-white dark:stroke-gray-900"
              strokeWidth={2}
            />
            <text
              x={l.labelX}
              y={l.labelY}
              textAnchor={l.anchor}
              dominantBaseline="middle"
              fontSize={11}
              className="fill-gray-800 dark:fill-gray-100"
            >
              {l.datum.name}
            </text>
          </g>
        ))}

        {hover && (
          <Tooltip
            datum={hover}
            cx={x(project(hover.x))}
            cy={y(hover.y)}
            lines={[`${xLabel}: ${formatX(hover.x)}`, `${yLabel}: ${formatY(hover.y)}`]}
          />
        )}
      </svg>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {usable.length} countries plotted.
        {fit
          ? ` The dashed line is a least-squares fit; r = ${fit.r.toFixed(2)}.`
          : ' No consistent relationship to fit a line to.'}
      </p>
    </div>
  );
}

/** A readout anchored to the hovered point, flipped to stay inside the plot. */
function Tooltip({
  datum,
  cx,
  cy,
  lines,
}: {
  datum: ScatterDatum;
  cx: number;
  cy: number;
  lines: string[];
}) {
  const rows = [datum.name, ...lines];
  const width = Math.max(...rows.map((t) => t.length)) * CHAR_WIDTH + 16;
  const height = rows.length * 14 + 10;

  const left = cx + 12 + width > WIDTH - MARGIN.right ? cx - 12 - width : cx + 12;
  const top = Math.min(Math.max(cy - height / 2, MARGIN.top), HEIGHT - MARGIN.bottom - height);

  return (
    <g pointerEvents="none" transform={`translate(${left} ${top})`}>
      <rect
        width={width}
        height={height}
        rx={4}
        className="fill-white stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600"
        strokeWidth={1}
      />
      {rows.map((text, i) => (
        <text
          key={text}
          x={8}
          y={18 + i * 14}
          fontSize={11}
          className={
            i === 0
              ? 'fill-gray-900 font-medium dark:fill-white'
              : 'fill-gray-600 dark:fill-gray-300'
          }
        >
          {text}
        </text>
      ))}
    </g>
  );
}
