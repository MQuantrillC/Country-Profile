import { describe, expect, it } from 'vitest';
import { fitLine, logTicks, spreadLabels } from './ScatterPlot';

describe('logTicks', () => {
  it('lands on decade steps rather than evenly spaced log values', () => {
    // A GDP-per-capita span, roughly $230 to $290k.
    const values = logTicks(Math.log10(233), Math.log10(288_000)).map((v) => 10 ** v);
    for (const v of values) {
      const mantissa = v / 10 ** Math.floor(Math.log10(v) + 1e-9);
      expect([1, 3].some((m) => Math.abs(mantissa - m) < 0.001)).toBe(true);
    }
  });

  it('stays inside the domain, so no tick sits off the axis', () => {
    const [min, max] = [Math.log10(233), Math.log10(288_000)];
    for (const v of logTicks(min, max)) {
      expect(v).toBeGreaterThanOrEqual(min);
      expect(v).toBeLessThanOrEqual(max);
    }
  });

  it('falls back to even spacing when a decade split would give too few ticks', () => {
    // Less than half a decade of range.
    expect(logTicks(Math.log10(1000), Math.log10(1400)).length).toBeGreaterThanOrEqual(3);
  });
});

describe('spreadLabels', () => {
  const GAP = 13;

  it('leaves labels alone when they already clear each other', () => {
    expect(spreadLabels([10, 60, 120], 0, 400)).toEqual([10, 60, 120]);
  });

  it('opens a minimum gap between stacked labels', () => {
    // The top ten on one measure usually share a corner, which is the case that
    // made the labels unreadable.
    const out = spreadLabels([100, 101, 102, 103, 104], 0, 400);
    const sorted = [...out].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i += 1) {
      expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(GAP - 0.001);
    }
  });

  it('keeps each label with its own point rather than reordering them', () => {
    const anchors = [300, 100, 200];
    const out = spreadLabels(anchors, 0, 400);
    // The label for the highest point stays the highest.
    expect(out[1]).toBeLessThan(out[2]);
    expect(out[2]).toBeLessThan(out[0]);
  });

  it('pulls back inside the plot when the stack would run off the bottom', () => {
    const out = spreadLabels([395, 396, 397, 398, 399], 0, 400);
    expect(Math.max(...out)).toBeLessThanOrEqual(400);
    expect(Math.min(...out)).toBeGreaterThanOrEqual(0);
  });

  it('handles no labels at all', () => {
    expect(spreadLabels([], 0, 400)).toEqual([]);
  });
});

describe('fitLine', () => {
  const line = (n: number, slope: number) =>
    Array.from({ length: n }, (_, i) => ({ x: i, y: slope * i + 3 }));

  it('recovers the slope of a clean relationship', () => {
    const fit = fitLine(line(20, 2));
    expect(fit?.slope).toBeCloseTo(2, 6);
    expect(fit?.intercept).toBeCloseTo(3, 6);
    expect(fit?.r).toBeCloseTo(1, 6);
  });

  it('handles a negative relationship', () => {
    expect(fitLine(line(20, -1.5))?.r).toBeCloseTo(-1, 6);
  });

  it('declines to fit a weak relationship, so the line never invents a trend', () => {
    // Alternating values: no consistent direction.
    const noise = Array.from({ length: 40 }, (_, i) => ({ x: i, y: i % 2 === 0 ? 0 : 1 }));
    expect(fitLine(noise)).toBeNull();
  });

  it('declines to fit too few points', () => {
    expect(fitLine(line(9, 2))).toBeNull();
  });

  it('declines when a measure does not vary, instead of dividing by zero', () => {
    expect(fitLine(line(20, 0))).toBeNull();
  });
});
