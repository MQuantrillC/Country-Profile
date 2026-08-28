import { describe, expect, it } from 'vitest';
import { compactNumber, linePath, linearScale, niceDomain, seriesVar, ticks } from './chartTheme';

describe('linearScale', () => {
  it('maps the domain onto the range', () => {
    const s = linearScale([0, 10], [0, 100]);
    expect(s(0)).toBe(0);
    expect(s(5)).toBe(50);
    expect(s(10)).toBe(100);
  });

  it('handles an inverted range, which is how SVG y-axes work', () => {
    const s = linearScale([0, 10], [100, 0]);
    expect(s(0)).toBe(100);
    expect(s(10)).toBe(0);
  });

  it('centres the mark for a zero-width domain instead of dividing by zero', () => {
    const s = linearScale([5, 5], [0, 100]);
    expect(Number.isFinite(s(5))).toBe(true);
    expect(s(5)).toBe(50);
  });

  it('extrapolates outside the domain rather than clamping', () => {
    expect(linearScale([0, 10], [0, 100])(20)).toBe(200);
  });
});

describe('niceDomain', () => {
  it('widens to rounder bounds', () => {
    const [min, max] = niceDomain(2.3, 9.7);
    expect(min).toBeLessThanOrEqual(2.3);
    expect(max).toBeGreaterThanOrEqual(9.7);
  });

  it('gives a single data point a usable span', () => {
    const [min, max] = niceDomain(42, 42);
    expect(max).toBeGreaterThan(min);
  });

  it('handles an all-zero series', () => {
    expect(niceDomain(0, 0)).toEqual([0, 1]);
  });

  it('falls back for non-finite input rather than producing NaN bounds', () => {
    expect(niceDomain(Number.NaN, 5)).toEqual([0, 1]);
    expect(niceDomain(-Infinity, Infinity)).toEqual([0, 1]);
  });

  it('keeps negative values inside the domain', () => {
    const [min, max] = niceDomain(-8, 3);
    expect(min).toBeLessThanOrEqual(-8);
    expect(max).toBeGreaterThanOrEqual(3);
  });
});

describe('ticks', () => {
  it('spans the domain inclusively', () => {
    const t = ticks([0, 100], 4);
    expect(t[0]).toBe(0);
    expect(t[t.length - 1]).toBe(100);
    expect(t).toHaveLength(5);
  });

  it('returns a single tick for a zero-width domain', () => {
    expect(ticks([7, 7])).toEqual([7]);
  });
});

describe('linePath', () => {
  it('starts with a move and continues with lines', () => {
    const d = linePath([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
    ]);
    expect(d.startsWith('M0.00,0.00')).toBe(true);
    expect(d).toContain('L10.00,5.00');
  });

  it('returns an empty path for no points, so nothing is drawn', () => {
    expect(linePath([])).toBe('');
  });
});

describe('compactNumber', () => {
  it('abbreviates by magnitude', () => {
    expect(compactNumber(30_769_700_000_000)).toBe('30.8T');
    expect(compactNumber(2_279_900_000_000)).toBe('2.3T');
    expect(compactNumber(341_784_857)).toBe('341.8M');
    expect(compactNumber(45_300)).toBe('45.3k');
  });

  it('keeps small numbers readable', () => {
    expect(compactNumber(87)).toBe('87');
    expect(compactNumber(8.7)).toBe('8.7');
    expect(compactNumber(0.87)).toBe('0.87');
  });

  it('handles zero and negatives', () => {
    expect(compactNumber(0)).toBe('0.00');
    expect(compactNumber(-341_784_857)).toBe('-341.8M');
  });
});

describe('seriesVar', () => {
  it('assigns slots in fixed order', () => {
    expect(seriesVar(0)).toBe('var(--series-1)');
    expect(seriesVar(4)).toBe('var(--series-5)');
  });

  it('wraps rather than producing an undefined slot past the palette', () => {
    // The comparison caps at five countries, so this is a guard, not a code path
    // the UI reaches.
    expect(seriesVar(5)).toBe('var(--series-1)');
  });
});
