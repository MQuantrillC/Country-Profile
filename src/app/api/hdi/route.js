import { NextResponse } from 'next/server';
import { findOwidEntity, owidCountryName } from '../../../lib/owidEntity';

// Reference data changes at most a few times a year; cache for a day and serve
// stale for a week while revalidating, so upstream outages stay invisible.
export const revalidate = 86400;

// OWID HDI endpoint
const OWID_HDI_ENDPOINT = 'https://api.ourworldindata.org/v1/indicators/1032439.data.json';


// Reverse mapping: 2-letter code to country name

async function fetchOWIDHDIData(countryCode) {
  try {
    
    // Fetch both data and metadata (same pattern as working OWID APIs)
    const [dataResponse, metadataResponse] = await Promise.all([
      // Without an explicit revalidate these are uncached in Next 15, so every
      // request re-downloaded the whole indicator file.
      fetch(OWID_HDI_ENDPOINT, { next: { revalidate: 86400 } }),
      fetch(OWID_HDI_ENDPOINT.replace('.data.json', '.metadata.json'), {
        next: { revalidate: 86400 },
      })
    ]);

    if (!dataResponse.ok) {
      throw new Error(`OWID API error: ${dataResponse.status} ${dataResponse.statusText}`);
    }

    const data = await dataResponse.json();
    const metadata = await metadataResponse.json();


    // The OWID API returns flat arrays where each index corresponds to one data point
    if (!data.entities || !data.years || !data.values) {
      throw new Error('Invalid OWID API response structure');
    }

    // Matched on ISO3 against OWID's own entity list rather than through a
    // hand-maintained name table - see src/lib/owidEntity.ts.
    const targetEntity = findOwidEntity(metadata, countryCode);
    const countryName = targetEntity?.name ?? owidCountryName(countryCode);

    if (!targetEntity) {
      console.warn(`Country not found in OWID HDI metadata: ${countryCode}`);
      return null;
    }


    // Find all data points for this entity and get the latest
    let latestValue = null;
    let latestYear = null;

    // Go through all data points to find matches for this entity
    for (let i = data.entities.length - 1; i >= 0; i--) {
      if (data.entities[i] === targetEntity.id) {
        const value = data.values[i];
        const year = data.years[i];
        
        if (value !== null && value !== undefined) {
          // If this is the first valid value we found, or it's from a more recent year
          if (latestValue === null || year > latestYear) {
            latestValue = value;
            latestYear = year;
          }
        }
      }
    }


    return {
      value: latestValue,
      year: latestYear ? latestYear.toString() : null,
      country: countryName,
      entityId: targetEntity.id
    };

  } catch (error) {
    console.error('Error fetching OWID HDI data:', error);
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  try {
    if (country) {
      // Return data for specific country
      const hdiData = await fetchOWIDHDIData(country);
      
      if (hdiData && hdiData.value !== null) {
        return NextResponse.json({
          country: country.toUpperCase(),
          countryName: hdiData.country,
          hdi: hdiData.value,
          source: 'UNDP, Human Development Report',
          year: hdiData.year,
          sourceOrganization: 'United Nations Development Programme',
          description: 'The Human Development Index (HDI) is a summary measure of key dimensions of human development: a long and healthy life, a good education, and a decent standard of living.',
          scale: '0-1 (higher values indicate higher human development)',
          dataSource: 'Our World in Data API'
        });
      } else {
        // Return null for countries not in OWID dataset
        return NextResponse.json({
          country: country.toUpperCase(),
          hdi: null,
          source: 'UNDP, Human Development Report',
          year: null,
          sourceOrganization: 'United Nations Development Programme',
          note: 'HDI data not available for this country',
          dataSource: 'Our World in Data API'
        });
      }
    } else {
      // Return error for bulk requests since OWID doesn't support that efficiently
      return NextResponse.json({
        error: 'Country parameter required',
        message: 'Please specify a country code (e.g., ?country=US)',
        source: 'UNDP, Human Development Report',
        sourceOrganization: 'United Nations Development Programme',
        dataSource: 'Our World in Data API'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in HDI API:', error);
    return NextResponse.json({
      error: 'Failed to fetch HDI data',
      details: error.message,
      country: country,
      dataSource: 'Our World in Data API'
    }, { status: 500 });
  }
} 