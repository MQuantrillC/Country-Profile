import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const variable = searchParams.get('variable'); // tas, tasmax, tasmin, hd30, hd35, fd, etc.

  if (!country || !variable) {
    return NextResponse.json({ error: 'Missing country or variable parameter' }, { status: 400 });
  }

  try {
    console.log(`Fetching climate data for ${country}: ${variable}`);
    
    // World Bank Climate API endpoint
    // Using historical climatology data from CRU (Climate Research Unit)
    const climateUrl = `https://cckpapi.worldbank.org/cckp/v1/cru-x0.5_climatology_${variable}_climatology_annual_1991-2020_median_historical_cru-ensemble_all_mean/${country}?_format=json`;
    
    console.log('Fetching from Climate API:', climateUrl);
    
    const response = await fetch(climateUrl);
    
    if (!response.ok) {
      console.error(`Climate API error: ${response.status} ${response.statusText}`);
      // Try alternative format if first request fails
      const alternativeUrl = `https://cckpapi.worldbank.org/cckp/v1/era5-x0.25_climatology_${variable}_climatology_annual_1991-2020_median_historical_era5-ensemble_all_mean/${country}?_format=json`;
      console.log('Trying alternative URL:', alternativeUrl);
      
      const altResponse = await fetch(alternativeUrl);
      if (!altResponse.ok) {
        throw new Error(`Climate API error: ${response.status}`);
      }
      
      const altData = await altResponse.json();
      console.log('Climate API Response (alternative):', JSON.stringify(altData, null, 2));
      return NextResponse.json(altData);
    }
    
    const data = await response.json();
    console.log('Climate API Response:', JSON.stringify(data, null, 2));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Climate API:', error);
    return NextResponse.json({ error: 'Failed to fetch data from Climate API' }, { status: 500 });
  }
} 