'use client';

// The map and scatter views of the rankings data.
//
// Both read the payload the list view already loaded, so switching views costs no
// extra request. They answer questions a top-ten list cannot: where in the world
// the high values are, and whether two measures move together.

import React, { useMemo, useState } from 'react';
import { getCountry } from '../lib/countryList';
import { rankingMetrics, type RankingMetric, type RankingsPayload } from '../lib/rankingMetrics';
import { Choropleth } from './charts/Choropleth';
import { ScatterPlot, type ScatterDatum } from './charts/ScatterPlot';

interface RankingsExplorerProps {
  view: 'map' | 'scatter';
  payload: RankingsPayload;
  metric: RankingMetric;
  formatValue: (value: number, unit: string) => string;
}

/** Measures spanning several orders of magnitude read better on a log axis. */
const LOG_SCALE_METRICS = new Set(['gdp', 'population', 'gdpPerCapita', 'gniPerCapita']);

export function RankingsExplorer({ view, payload, metric, formatValue }: RankingsExplorerProps) {
  const [xMetricId, setXMetricId] = useState('gdpPerCapita');
  const [yMetricId, setYMetricId] = useState('lifeExpectancy');

  const format = (m: RankingMetric) => (v: number) => formatValue(v, m.unit);

  const mapValues = useMemo(() => {
    const values = new Map<string, number>();
    for (const entry of payload.metrics[metric.id] ?? []) values.set(entry.code, entry.value);
    return values;
  }, [payload, metric.id]);

  const xMetric = rankingMetrics.find((m) => m.id === xMetricId) ?? rankingMetrics[0];
  const yMetric = rankingMetrics.find((m) => m.id === yMetricId) ?? rankingMetrics[1];

  const scatterData = useMemo((): ScatterDatum[] => {
    const xs = new Map((payload.metrics[xMetric.id] ?? []).map((e) => [e.code, e.value]));
    const ys = new Map((payload.metrics[yMetric.id] ?? []).map((e) => [e.code, e.value]));

    // Only countries reporting both measures can be placed.
    return [...xs.entries()]
      .filter(([code]) => ys.has(code))
      .map(([code, x]) => ({
        code,
        name: getCountry(code)?.name ?? code,
        x,
        y: ys.get(code) as number,
        // The currently selected ranking metric's top ten get highlighted, which
        // ties the scatter back to the list the reader just came from.
        highlighted: (payload.metrics[metric.id] ?? []).slice(0, 10).some((e) => e.code === code),
      }));
  }, [payload, xMetric.id, yMetric.id, metric.id]);

  if (view === 'map') {
    return (
      <div className="p-4 sm:p-6">
        <Choropleth
          values={mapValues}
          format={format(metric)}
          lowerIsBetter={!metric.higherIsBetter}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap gap-3">
        {[
          { label: 'Horizontal', value: xMetricId, onChange: setXMetricId },
          { label: 'Vertical', value: yMetricId, onChange: setYMetricId },
        ].map((axis) => (
          <label key={axis.label} className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-300">{axis.label} axis</span>
            <select
              value={axis.value}
              onChange={(e) => axis.onChange(e.target.value)}
              className="min-h-9 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {rankingMetrics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <ScatterPlot
        data={scatterData}
        xLabel={xMetric.title}
        yLabel={yMetric.title}
        formatX={format(xMetric)}
        formatY={format(yMetric)}
        logX={LOG_SCALE_METRICS.has(xMetric.id)}
      />
      <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
        Highlighted points are the current top ten for {metric.title}.
      </p>
    </div>
  );
}
