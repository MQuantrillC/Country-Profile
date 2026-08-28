'use client';

// The context blocks that sit above the statistics: what the place is, what its
// money is worth, its weather through the year, where its economy is heading, how
// its power is generated, who it sells to, and when it stops for holidays.
//
// Every block is optional. The route returns null for anything its upstream could
// not supply, and each section simply does not render rather than showing an empty
// shell - a country with no earthquake history should not be told it has none.

import React, { useEffect, useState } from 'react';
import { AXIS_TEXT, GRID_LINE, compactNumber, linePath, linearScale, niceDomain, seriesVar } from '../lib/chartTheme';

interface ContextPayload {
  summary: { extract: string; url: string } | null;
  money: { code: string; name: string; symbol: string; perUsd: number; asOf: string } | null;
  holidays: Array<{ date: string; localName: string; name: string }> | null;
  climate: { place: string; monthlyMeanC: (number | null)[]; monthlyRainMm: (number | null)[]; years: string } | null;
  outlook: { indicator: string; unit: string; points: Array<{ year: number; value: number; projected: boolean }> } | null;
  energy: { year: string; sources: Array<{ label: string; percent: number }> } | null;
  hazards: { quakes: Array<{ date: string; magnitude: number; place: string }>; windowYears: number } | null;
  trade: {
    year: string;
    totalExportsUsd: number;
    partners: Array<{ code: string | null; name: string; valueUsd: number; share: number }>;
  } | null;
}

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h5 className="font-semibold text-gray-900 dark:text-white">{title}</h5>
      {children}
      {note && <p className="text-[11px] text-gray-400 dark:text-gray-500">{note}</p>}
    </section>
  );
}

/** Mean temperature through the year, with rainfall behind it. */
function ClimateChart({ climate }: { climate: NonNullable<ContextPayload['climate']> }) {
  const temps = climate.monthlyMeanC;
  const rain = climate.monthlyRainMm;
  const width = 320;
  const height = 96;

  const known = temps.filter((t): t is number => t !== null);
  if (known.length === 0) return null;

  const tScale = linearScale(niceDomain(Math.min(...known), Math.max(...known)), [height - 18, 8]);
  const xAt = (i: number) => 16 + (i / 11) * (width - 32);
  const maxRain = Math.max(...rain.filter((r): r is number => r !== null), 1);

  const points = temps
    .map((t, i) => (t === null ? null : { x: xAt(i), y: tScale(t) }))
    .filter((p): p is { x: number; y: number } => p !== null);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-sm"
      role="img"
      aria-label={`Average monthly temperature in ${climate.place}, ${climate.years}`}
    >
      {/* Rainfall as a recessive backdrop; temperature is the subject. */}
      {rain.map((mm, i) =>
        mm === null ? null : (
          <rect
            key={i}
            x={xAt(i) - 8}
            y={height - 18 - (mm / maxRain) * (height - 34)}
            width={16}
            height={(mm / maxRain) * (height - 34)}
            rx={3}
            fill={GRID_LINE}
          />
        )
      )}

      <path d={linePath(points)} fill="none" stroke={seriesVar(1)} strokeWidth={2} strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2} fill={seriesVar(1)} />
      ))}

      {MONTHS.map((m, i) => (
        <text key={i} x={xAt(i)} y={height - 4} textAnchor="middle" fontSize={9} fill={AXIS_TEXT}>
          {m}
        </text>
      ))}
      <text x={2} y={12} fontSize={9} fill={AXIS_TEXT}>
        {Math.round(Math.max(...known))}°C
      </text>
      <text x={2} y={height - 22} fontSize={9} fill={AXIS_TEXT}>
        {Math.round(Math.min(...known))}°C
      </text>
    </svg>
  );
}

/** Past and projected growth on one axis, with the projection dashed. */
function OutlookChart({ outlook }: { outlook: NonNullable<ContextPayload['outlook']> }) {
  const width = 320;
  const height = 96;
  const pts = outlook.points;
  if (pts.length < 2) return null;

  const x = linearScale([pts[0].year, pts[pts.length - 1].year], [24, width - 8]);
  const y = linearScale(
    niceDomain(Math.min(...pts.map((p) => p.value)), Math.max(...pts.map((p) => p.value))),
    [height - 18, 8]
  );

  const project = (p: (typeof pts)[number]) => ({ x: x(p.year), y: y(p.value) });
  const historic = pts.filter((p) => !p.projected).map(project);
  // Repeat the join point so the dashed run starts where the solid one ends.
  const firstProjected = pts.findIndex((p) => p.projected);
  const projected = (firstProjected > 0 ? pts.slice(firstProjected - 1) : pts.filter((p) => p.projected)).map(project);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-sm"
      role="img"
      aria-label={`${outlook.indicator}, actual and IMF projection`}
    >
      <line x1={24} x2={width - 8} y1={y(0)} y2={y(0)} stroke={GRID_LINE} strokeWidth={1} />
      <path d={linePath(historic)} fill="none" stroke={seriesVar(0)} strokeWidth={2} strokeLinecap="round" />
      <path
        d={linePath(projected)}
        fill="none"
        stroke={seriesVar(0)}
        strokeWidth={2}
        strokeDasharray="4 3"
        strokeLinecap="round"
        opacity={0.75}
      />
      <text x={2} y={12} fontSize={9} fill={AXIS_TEXT}>
        {compactNumber(y.domain[1])}%
      </text>
      <text x={2} y={height - 22} fontSize={9} fill={AXIS_TEXT}>
        {compactNumber(y.domain[0])}%
      </text>
      <text x={24} y={height - 4} fontSize={9} fill={AXIS_TEXT}>
        {pts[0].year}
      </text>
      <text x={width - 8} y={height - 4} textAnchor="end" fontSize={9} fill={AXIS_TEXT}>
        {pts[pts.length - 1].year}
      </text>
    </svg>
  );
}

export function CountryContext({ code, name }: { code: string; name: string }) {
  const [data, setData] = useState<ContextPayload | null>(null);
  const [state, setState] = useState<'loading' | 'done' | 'failed'>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');

    fetch(`/api/context?country=${code}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setState('done');
      })
      .catch(() => !cancelled && setState('failed'));

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (state === 'loading') {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading country context…</p>;
  }
  if (state === 'failed' || !data) return null;

  const { summary, money, holidays, climate, outlook, energy, hazards, trade } = data;
  const nothing = !summary && !money && !holidays && !climate && !outlook && !energy && !hazards && !trade;
  if (nothing) return null;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {summary && (
        <div className="md:col-span-2">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{summary.extract}</p>
          <a
            href={summary.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            Wikipedia
          </a>
        </div>
      )}

      {money && (
        <Section title="Currency" note={money.asOf ? `Rate as of ${money.asOf}` : undefined}>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {money.name} ({money.code}
            {money.symbol ? `, ${money.symbol}` : ''})
          </p>
          <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
            {money.perUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })} {money.code}
            <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">per US$1</span>
          </p>
        </Section>
      )}

      {climate && (
        <Section title={`Weather in ${climate.place}`} note={`Monthly averages, ${climate.years}. Bars show rainfall.`}>
          <ClimateChart climate={climate} />
        </Section>
      )}

      {outlook && (
        <Section
          title={outlook.indicator}
          note={`Solid is recorded, dashed is the IMF projection.`}
        >
          <OutlookChart outlook={outlook} />
        </Section>
      )}

      {energy && (
        <Section title="Electricity generation" note={`World Bank, ${energy.year}`}>
          <ul className="space-y-1">
            {energy.sources.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-sm">
                <span className="w-28 shrink-0 text-gray-700 dark:text-gray-300">{s.label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${s.percent}%`, backgroundColor: seriesVar(2) }}
                  />
                </span>
                <span className="w-12 shrink-0 text-right tabular-nums text-gray-600 dark:text-gray-400">
                  {s.percent}%
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {trade && (
        <Section
          title="Top export partners"
          note={`UN Comtrade, ${trade.year}. Total exports $${(trade.totalExportsUsd / 1e9).toFixed(1)}B.`}
        >
          <ul className="space-y-1">
            {trade.partners.slice(0, 6).map((p) => (
              <li key={p.name} className="flex items-center gap-2 text-sm">
                <span className="w-28 shrink-0 truncate text-gray-700 dark:text-gray-300">{p.name}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${p.share}%`, backgroundColor: seriesVar(0) }}
                  />
                </span>
                <span className="w-12 shrink-0 text-right tabular-nums text-gray-600 dark:text-gray-400">
                  {p.share}%
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {holidays && holidays.length > 0 && (
        <Section title="Next public holidays">
          <ul className="space-y-1 text-sm">
            {holidays.map((h) => (
              <li key={h.date} className="flex justify-between gap-3">
                <span className="text-gray-700 dark:text-gray-300">{h.localName}</span>
                <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
                  {new Date(`${h.date}T00:00:00Z`).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    timeZone: 'UTC',
                  })}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {hazards && (
        <Section
          title="Major earthquakes nearby"
          note={`Magnitude 6+ within 800 km of the capital, past ${hazards.windowYears} years. USGS.`}
        >
          <ul className="space-y-1 text-sm">
            {hazards.quakes.slice(0, 4).map((q) => (
              <li key={`${q.date}-${q.magnitude}`} className="flex justify-between gap-3">
                <span className="truncate text-gray-700 dark:text-gray-300">{q.place}</span>
                <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
                  M{q.magnitude.toFixed(1)} · {q.date.slice(0, 4)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="md:col-span-2 text-[11px] text-gray-400 dark:text-gray-500">
        Context for {name}. Blocks are omitted where the source publishes nothing for
        this country.
      </p>
    </div>
  );
}
