// app/api/worldbank/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  // Enable CORS
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const indicator = searchParams.get('indicator');

  if (!country || !indicator) {
    return NextResponse.json(
      { error: 'Missing country or indicator parameter' }, 
      { status: 400, headers }
    );
  }

  try {
    // Fetch data for the last 5 years to get the most recent available data
    const worldBankUrl = `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=10&date=2019:2023`;
    
    console.log('Fetching from World Bank:', worldBankUrl);
    
    const response = await fetch(worldBankUrl);
    
    if (!response.ok) {
      throw new Error(`World Bank API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('World Bank API Response:', JSON.stringify(data, null, 2));
    
    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error('Error fetching from World Bank:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from World Bank API', details: error.message }, 
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}