import { NextResponse } from 'next/server';

// Helper function to format trade value
function formatTradeValue(value) {
  if (!value || value === 0) return 'N/A';
  
  const num = Math.abs(value);
  if (num >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (num >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

// Helper function to parse partners string into structured data
function parsePartners(partnersString) {
  if (!partnersString) return [];
  
  try {
    // Parse patterns like "China 18.4%, Mexico 15.8%, Canada 13.2%, Japan 6.3%, Germany 4.3% (2022 est.)"
    const matches = partnersString.match(/([^,]+?)\s+([0-9.]+)%/g);
    if (matches) {
      return matches.map(match => {
        const [, country, percentage] = match.match(/([^,]+?)\s+([0-9.]+)%/);
        return {
          country: country.trim(),
          percentage: parseFloat(percentage),
          formatted: `${percentage}%`
        };
      }).slice(0, 5); // Top 5 partners
    }
  } catch (error) {
    console.warn('Error parsing partners:', error);
  }
  
  // Fallback: split by comma and return basic structure
  return partnersString.split(',').slice(0, 5).map((partner) => ({
    country: partner.trim(),
    percentage: null,
    formatted: 'N/A'
  }));
}

// Helper function to parse commodities string into structured data  
function parseCommodities(commoditiesString) {
  if (!commoditiesString) return [];
  
  try {
    // Parse patterns like "refined petroleum, cars, vehicle parts, crude petroleum, integrated circuits (2022)"
    const commodities = commoditiesString.split(',').slice(0, 5).map(commodity => {
      const cleaned = commodity.trim().replace(/\([^)]*\)$/, '').trim(); // Remove year info
    return {
        commodity: cleaned,
        description: cleaned
      };
    });
    
    return commodities;
  } catch (error) {
    console.warn('Error parsing commodities:', error);
    return [];
  }
}

// Helper function to extract year from text
function extractYear(text) {
  if (!text) return '2024';
  const yearMatch = text.match(/\((\d{4})/);
  return yearMatch ? yearMatch[1] : '2024';
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country');
    
    if (!countryCode) {
    return NextResponse.json({ error: 'Country parameter is required' }, { status: 400 });
  }

  try {
    console.log(`Fetching trade data from CIA World Factbook for ${countryCode}`);
    
    // Fetch factbook data
    const factbookResponse = await fetch(`${request.nextUrl.origin}/api/factbook?country=${countryCode}`);
    
    if (!factbookResponse.ok) {
      throw new Error(`Factbook API failed: ${factbookResponse.status}`);
    }
    
    const factbookData = await factbookResponse.json();
    
    // Extract trade data from factbook
    const exportsValue = factbookData.exports || 0;
    const importsValue = factbookData.imports || 0;
    const exportPartnersRaw = factbookData.exportPartners || '';
    const importPartnersRaw = factbookData.importPartners || ''; // Import partners from factbook
    const exportCommoditiesRaw = factbookData.exportCommodities || '';
    const importCommoditiesRaw = factbookData.importCommodities || '';
    
    // Extract year from the data
    const dataYear = extractYear(exportPartnersRaw) || extractYear(exportCommoditiesRaw) || '2024';
    
    // Parse structured data
    const exportPartners = parsePartners(exportPartnersRaw);
    const importPartners = parsePartners(importPartnersRaw);
    const exportCommodities = parseCommodities(exportCommoditiesRaw);
    const importCommodities = parseCommodities(importCommoditiesRaw);

    // Calculate trade balance
    const tradeBalance = exportsValue - importsValue;
    const tradeBalanceStatus = tradeBalance >= 0 ? 'surplus' : 'deficit';

    // Structure the response data
    const tradeData = {
      country: countryCode,
      year: dataYear,
      source: 'CIA World Factbook',
      note: 'Trade data from CIA World Factbook - Real government data',
      
      // Core trade metrics
      totalExports: {
        value: exportsValue,
        formatted: formatTradeValue(exportsValue)
      },
      totalImports: {
        value: importsValue,
        formatted: formatTradeValue(importsValue)
      },
      tradeBalance: {
        value: tradeBalance,
        formatted: formatTradeValue(Math.abs(tradeBalance)),
        status: tradeBalanceStatus
      },
      
      // Trading partners
      topExportPartners: exportPartners,
      topImportPartners: importPartners,
      
      // Trade commodities
      topExportCommodities: exportCommodities,
      topImportCommodities: importCommodities,
      
      // Raw data for reference
      rawData: {
        exportPartnersText: exportPartnersRaw,
        exportCommoditiesText: exportCommoditiesRaw,
        importCommoditiesText: importCommoditiesRaw
      }
    };
    
    console.log(`✅ Successfully fetched factbook trade data for ${countryCode}`);
    console.log(`Exports: ${formatTradeValue(exportsValue)}, Imports: ${formatTradeValue(importsValue)}`);
    
    return NextResponse.json(tradeData);

  } catch (error) {
    console.error(`❌ Failed to fetch trade data for ${countryCode}:`, error);
    
    // Return minimal fallback data
    return NextResponse.json({
      country: countryCode,
      year: '2024',
      source: 'Fallback Data',
      note: 'No trade data available',
      
      totalExports: { value: 0, formatted: 'N/A' },
      totalImports: { value: 0, formatted: 'N/A' },
      tradeBalance: { value: 0, formatted: 'N/A', status: 'unknown' },
      
      topExportPartners: [],
      topImportPartners: [],
      topExportCommodities: [],
      topImportCommodities: [],
      
      rawData: {
        exportPartnersText: '',
        exportCommoditiesText: '',
        importCommoditiesText: ''
      }
    });
  }
} 