import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  if (!country) {
    return NextResponse.json({ error: 'Country code is required' }, { status: 400 });
  }

  try {
    console.log(`Fetching REST Countries data for: ${country}`);
    
    const response = await fetch(`https://restcountries.com/v3.1/alpha/${country}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`REST Countries API error: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: 'Failed to fetch country data' }, { status: response.status });
    }

    const data = await response.json();
    console.log('REST Countries API Response:', JSON.stringify(data, null, 2));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('REST Countries API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 