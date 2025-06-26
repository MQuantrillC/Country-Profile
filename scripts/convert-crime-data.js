const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Function to convert Excel to JSON
function convertCrimeDataToJson() {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(path.join(__dirname, '../public/Crime Data.xlsx'));
    
    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];
    
    // Convert sheet to JSON
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // Process and clean the data
    const processedData = jsonData.map(row => ({
      iso3_code: row['Iso3_code'] || row['iso3_code'],
      country: row['Country'] || row['country'],
      region: row['Region'] || row['region'],
      subregion: row['Subregion'] || row['subregion'],
      indicator: row['Indicator'] || row['indicator'],
      dimension: row['Dimension'] || row['dimension'],
      category: row['Category'] || row['category'],
      sex: row['Sex'] || row['sex'],
      age: row['Age'] || row['age'],
      year: parseInt(row['Year'] || row['year']),
      unit: row['Unit of measurement'] || row['unit'],
      value: parseFloat(row['VALUE'] || row['value']),
      source: row['Source'] || row['source']
    })).filter(row => row.iso3_code && row.value !== null && !isNaN(row.value));
    
    // Group data by country for easier access
    const groupedData = {};
    processedData.forEach(row => {
      if (!groupedData[row.iso3_code]) {
        groupedData[row.iso3_code] = {
          country: row.country,
          region: row.region,
          subregion: row.subregion,
          data: []
        };
      }
      groupedData[row.iso3_code].data.push({
        indicator: row.indicator,
        dimension: row.dimension,
        category: row.category,
        sex: row.sex,
        age: row.age,
        year: row.year,
        unit: row.unit,
        value: row.value,
        source: row.source
      });
    });
    
    // Write to JSON files
    const outputDir = path.join(__dirname, '../src/data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write full dataset
    fs.writeFileSync(
      path.join(outputDir, 'crime-data-full.json'),
      JSON.stringify(processedData, null, 2)
    );
    
    // Write grouped dataset
    fs.writeFileSync(
      path.join(outputDir, 'crime-data-grouped.json'),
      JSON.stringify(groupedData, null, 2)
    );
    
    // Generate summary statistics
    const summary = {
      totalRecords: processedData.length,
      countries: Object.keys(groupedData).length,
      yearRange: {
        min: Math.min(...processedData.map(r => r.year)),
        max: Math.max(...processedData.map(r => r.year))
      },
      indicators: [...new Set(processedData.map(r => r.indicator))],
      regions: [...new Set(processedData.map(r => r.region))],
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'crime-data-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('✅ Crime data conversion completed!');
    console.log(`📊 Processed ${summary.totalRecords} records from ${summary.countries} countries`);
    console.log(`📅 Data spans from ${summary.yearRange.min} to ${summary.yearRange.max}`);
    console.log(`🗂️ Files created in: ${outputDir}`);
    
    return { success: true, summary };
    
  } catch (error) {
    console.error('❌ Error converting crime data:', error);
    return { success: false, error: error.message };
  }
}

// Run the conversion if called directly
if (require.main === module) {
  convertCrimeDataToJson();
}

module.exports = { convertCrimeDataToJson }; 