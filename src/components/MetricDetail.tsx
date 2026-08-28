'use client';

// The panel that opens under a metric row: how it has moved, and where the
// selected countries sit against every other country.
//
// All-country values come from /api/rankings, which is already built and cached for
// the rankings page. It is fetched lazily on first expand and then reused, so a
// reader who never opens a panel never pays for it.

import React, { useEffect, useMemo, useState } from 'react';
import type { Country } from '../utils/countries';
import type { MetricReading } from '../types/country';
import { rankingIdFor, type RankingsPayload } from '../lib/rankingMetrics';
import { TrendChart, type TrendSeries } from './charts/TrendChart';
import { DistributionStrip, type StripMark } from './charts/DistributionStrip';

/** Module-level so the payload is shared by every panel and fetched once. */
let rankingsPromise: Promise<RankingsPayload | null> | null = null;

function loadRankings(): Promise<RankingsPayload | null> {
  rankingsPromise ??= fetch('/api/rankings')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return rankingsPromise;
}

interface MetricDetailProps {
  metric: string;
  countries: Country[];
  getMetricValue: (metric: string, country: Country) => MetricReading;
  formatValue: (value: number) => string;
}

export function MetricDetail({
  metric,
  countries,
  getMetricValue,
  formatValue,
}: MetricDetailProps) {
  const [rankings, setRankings] = useState<RankingsPayload | null>(null);
  const [rankingsState, setRankingsState] = useState<'idle' | 'loading' | 'done'>('idle');

  // Only metrics that the rankings endpoint covers can show a distribution.
  const rankingId = useMemo(() => rankingIdFor(metric), [metric]);

  useEffect(() => {
    if (!rankingId) return;
    let cancelled = false;
    setRankingsState('loading');
    loadRankings().then((payload) => {
      if (cancelled) return;
      setRankings(payload);
      setRankingsState('done');
    });
    return () => {
      cancelled = true;
    };
  }, [rankingId]);

  const trends: TrendSeries[] = useMemo(
    () =>
      countries.map((country, index) => ({
        code: country.code,
        name: country.name,
        // Slot follows the country's position in the selection, so its colour is
        // stable as other countries come and go.
        colorIndex: index,
        points: getMetricValue(metric, country).series,
      })),
    [countries, metric, getMetricValue]
  );

  const hasTrend = trends.some((t) => t.points.length > 1);

  const distribution = useMemo(() => {
    if (!rankingId || !rankings) return null;
    const all = rankings.metrics[rankingId];
    if (!all?.length) return null;

    const selected: StripMark[] = countries
      .map((country, index) => {
        const entry = all.find((e) => e.code === country.code);
        return entry
          ? { code: country.code, name: country.name, value: entry.value, colorIndex: index }
          : null;
      })
      .filter((m): m is StripMark => m !== null);

    return { all, selected };
  }, [rankingId, rankings, countries]);

  return (
    <div className="space-y-6">
      {/* Sources that publish one snapshot get no trend section at all, and the
          row hides the chart button entirely when that leaves nothing to show. */}
      {hasTrend && (
        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {metric} over time
          </h4>
          <TrendChart series={trends} format={formatValue} />
        </section>
      )}

      {rankingId && (
        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Against every country
          </h4>
          {rankingsState === 'loading' && (
            <p className="py-4 text-sm text-gray-500 dark:text-gray-400">Loading comparison…</p>
          )}
          {rankingsState === 'done' && distribution && (
            <DistributionStrip
              all={distribution.all}
              selected={distribution.selected}
              format={formatValue}
            />
          )}
          {rankingsState === 'done' && !distribution && (
            <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
              Cross-country values could not be loaded for this metric.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
