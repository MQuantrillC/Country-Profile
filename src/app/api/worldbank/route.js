// src/app/api/worldbank/route.js
import { NextResponse } from 'next/server';
import { fetchCountryStats } from '../../../utils/worldBank';

// World Development Indicators are revised a few times a year, so a day-long cache
// costs nothing in freshness and removes the upstream call from the common path.
export const revalidate = 86400;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  if (!country) {
    return NextResponse.json({ error: 'Missing country parameter' }, { status: 400 });
  }

  const stats = await fetchCountryStats(country);

  return NextResponse.json(stats, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  });
}
