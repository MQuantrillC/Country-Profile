import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const indicator = searchParams.get('indicator');

  if (!country || !indicator) {
    return NextResponse.json({ error: 'Missing country or indicator parameter' }, { status: 400 });
  }

  try {
    const worldBankUrl = `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=5&date=2020:2024`;

    const response = await fetch(worldBankUrl);

    if (!response.ok) {
      throw new Error(`World Bank API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('World Bank API Response:', JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from World Bank:', error);
    return NextResponse.json({ error: 'Failed to fetch data from World Bank API' }, { status: 500 });
  }
} 