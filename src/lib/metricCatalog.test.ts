import { describe, expect, it } from 'vitest';
import { formatMetricValue, getMetricTooltip, sectionMetrics, sections } from './metricCatalog';

describe('formatMetricValue', () => {
  it('shows N/A for missing values', () => {
    expect(formatMetricValue('GDP', null)).toBe('N/A');
  });

  it('shows N/A for NaN rather than the string "NaN"', () => {
    expect(formatMetricValue('GDP', Number.NaN)).toBe('N/A');
  });

  it('renders a genuine zero as zero, not as missing data', () => {
    // Most countries record zero terrorism deaths and zero prison deaths; a
    // truthiness check here would have hidden every one of them.
    expect(formatMetricValue('Terrorism Deaths', 0)).not.toBe('N/A');
    expect(formatMetricValue('Terrorism Deaths', 0)).toContain('0');
    expect(formatMetricValue('Cold Days (<0°C)', 0)).toContain('0');
    expect(formatMetricValue('Extreme Poverty Rate', 0)).toBe('0.0%');
  });

  it('scales GDP to billions', () => {
    expect(formatMetricValue('GDP', 29_298_013_000_000)).toBe('$29,298.0B');
  });

  it('falls back to millions for a GDP below a billion', () => {
    expect(formatMetricValue('GDP', 57_350_000)).toBe('$57.4M');
  });

  it('rounds per-capita figures to whole dollars', () => {
    // This used to render as "$86,169.664" because toLocaleString defaults to
    // three decimal places.
    expect(formatMetricValue('GDP Per Capita', 86169.6641581917)).toBe('$86,170');
    expect(formatMetricValue('GNI Per Capita', 82910)).toBe('$82,910');
  });

  it('gives percentages one decimal place', () => {
    expect(formatMetricValue('Urban Population %', 80.14159)).toBe('80.1%');
    expect(formatMetricValue('Internet Users %', 94.7)).toBe('94.7%');
  });

  it('gives HDI three decimal places', () => {
    expect(formatMetricValue('Human Development Index (HDI)', 0.9271)).toBe('0.927');
  });

  it('abbreviates large populations', () => {
    expect(formatMetricValue('Total Population', 341_784_857)).toBe('341.8M');
  });

  it('keeps small populations unabbreviated', () => {
    expect(formatMetricValue('Total Population', 9_816)).toBe('9,816');
  });

  it('appends units where the metric has one', () => {
    expect(formatMetricValue('Area', 9_831_510)).toBe('9,831,510 km²');
    expect(formatMetricValue('Railways (km)', 250_000)).toBe('250,000 km');
  });

  it('handles negative values, which net migration can be', () => {
    expect(formatMetricValue('Net Migration Rate (per 1,000 people)', -2.5)).toBe('-2.5/1000');
  });

  it('falls back to a plain number for an unknown metric', () => {
    expect(formatMetricValue('Something Unlisted', 1234)).toBe('1,234');
  });
});

describe('the metric catalogue', () => {
  it('assigns every section in the nav a metric list', () => {
    for (const section of sections) {
      expect(sectionMetrics[section.id], section.id).toBeDefined();
    }
  });

  it('does not list the same metric in two sections', () => {
    const seen = new Map<string, string>();
    for (const [sectionId, metrics] of Object.entries(sectionMetrics)) {
      for (const metric of metrics) {
        expect(seen.has(metric), `${metric} in ${seen.get(metric)} and ${sectionId}`).toBe(false);
        seen.set(metric, sectionId);
      }
    }
  });

  it('formats every catalogued metric without throwing', () => {
    for (const metrics of Object.values(sectionMetrics)) {
      for (const metric of metrics) {
        expect(() => formatMetricValue(metric, 42), metric).not.toThrow();
        expect(() => formatMetricValue(metric, 0), metric).not.toThrow();
        expect(formatMetricValue(metric, null), metric).toBe('N/A');
      }
    }
  });

  it('returns a tooltip string for any metric, described or not', () => {
    expect(getMetricTooltip('GDP')).toBeTruthy();
    expect(typeof getMetricTooltip('Not A Real Metric')).toBe('string');
  });
});
