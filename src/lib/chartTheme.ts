// Chart colour and scale primitives.
//
// The palette is the validated reference instance, not a taste call. It was run
// through the dataviz validator in both modes:
//
//   adjacent pairs (lines, bars, strips), 5 slots  -> ALL CHECKS PASS
//     light: worst CVD dE 9.1, worst normal-vision dE 19.6
//     dark:  worst CVD dE 8.4, worst normal-vision dE 19.3
//
//   all pairs (scatter, choropleth), 5 slots       -> FAIL
//     worst normal-vision dE 12.9, below the 15 floor
//
// A search over every 5-of-8 combination of the documented hues found no ordering
// that clears all-pairs in both modes. So the all-pairs forms do not encode five
// identities in colour at all: the scatter draws every country in a neutral and
// highlights the selection in a single accent with direct labels, and the
// choropleth uses a sequential single-hue ramp because its job is magnitude.
//
// The light mode contrast warning ("relief required") is discharged by direct
// labels on the charts and by the metric table itself, which is the table view.

export const SERIES_COUNT = 5;

/**
 * Categorical slots, in fixed order. Assigned by the country's position in the
 * selection and never cycled or reassigned - a country keeps its colour when
 * others are added or removed.
 */
export const seriesVar = (index: number): string => `var(--series-${(index % SERIES_COUNT) + 1})`;

/** Neutral for the unselected mass of countries in scatter and distribution plots. */
export const NEUTRAL_MARK = 'var(--chart-neutral)';

/** The single accent used where colour cannot carry identity. */
export const ACCENT_MARK = 'var(--series-1)';

export const GRID_LINE = 'var(--chart-grid)';
export const AXIS_TEXT = 'var(--chart-axis-text)';

/** A linear scale from a data domain to a pixel range. */
export interface Scale {
  (value: number): number;
  domain: [number, number];
  range: [number, number];
}

export function linearScale(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  // A zero-width domain would divide by zero; centre the mark instead.
  const span = d1 - d0;

  const scale = ((value: number) =>
    span === 0 ? (r0 + r1) / 2 : r0 + ((value - d0) / span) * (r1 - r0)) as Scale;

  scale.domain = domain;
  scale.range = range;
  return scale;
}

/**
 * Extend a domain to round numbers so gridlines land on readable values.
 *
 * Returns the domain unchanged when it is degenerate, so callers never have to
 * special-case a single data point.
 */
export function niceDomain(min: number, max: number): [number, number] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) return min === 0 ? [0, 1] : [Math.min(0, min), Math.max(0, max * 1.1)];

  const span = max - min;
  const step = Math.pow(10, Math.floor(Math.log10(span))) / 2;
  return [Math.floor(min / step) * step, Math.ceil(max / step) * step];
}

/** Evenly spaced tick values across a domain, inclusive of both ends. */
export function ticks([min, max]: [number, number], count = 4): number[] {
  if (min === max) return [min];
  return Array.from({ length: count + 1 }, (_, i) => min + ((max - min) * i) / count);
}

/** An SVG path through points already projected into pixel space. */
export function linePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');
}

/** Compact axis labels: 1.2M, 45.3k, 0.87. */
export function compactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
  if (abs >= 10) return value.toFixed(0);
  if (abs >= 1) return value.toFixed(1);
  return value.toFixed(2);
}
