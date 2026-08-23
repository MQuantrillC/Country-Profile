// Converts the UNODC crime spreadsheet into one compact JSON file per country.
//
// This used to emit two pretty-printed monoliths - a 39 MB "full" file that nothing
// ever read, and a 31 MB grouped file that the API route parsed in its entirety on
// every cold start. Splitting by country means a request reads ~200 kB instead of
// 31 MB, and the output is small enough to be generated at build time rather than
// committed.
//
// Run with: npm run convert-crime-data

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const SOURCE_XLSX = path.join(__dirname, '../data-sources/Crime Data.xlsx');
const OUTPUT_DIR = path.join(__dirname, '../src/data/crime');

function convertCrimeDataToJson() {
  if (!fs.existsSync(SOURCE_XLSX)) {
    console.error(`Source spreadsheet not found at ${SOURCE_XLSX}`);
    process.exitCode = 1;
    return { success: false };
  }

  const workbook = XLSX.readFile(SOURCE_XLSX);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  const processed = rows
    .map((row) => ({
      iso3_code: row['Iso3_code'] || row['iso3_code'],
      country: row['Country'] || row['country'],
      region: row['Region'] || row['region'],
      subregion: row['Subregion'] || row['subregion'],
      indicator: row['Indicator'] || row['indicator'],
      dimension: row['Dimension'] || row['dimension'],
      category: row['Category'] || row['category'],
      sex: row['Sex'] || row['sex'],
      age: row['Age'] || row['age'],
      year: parseInt(row['Year'] || row['year'], 10),
      unit: row['Unit of measurement'] || row['unit'],
      value: parseFloat(row['VALUE'] || row['value']),
      source: row['Source'] || row['source'],
    }))
    .filter((row) => row.iso3_code && row.value !== null && !Number.isNaN(row.value));

  const grouped = {};
  for (const row of processed) {
    if (!grouped[row.iso3_code]) {
      grouped[row.iso3_code] = {
        country: row.country,
        region: row.region,
        subregion: row.subregion,
        data: [],
      };
    }
    grouped[row.iso3_code].data.push({
      indicator: row.indicator,
      dimension: row.dimension,
      category: row.category,
      sex: row.sex,
      age: row.age,
      year: row.year,
      unit: row.unit,
      value: row.value,
      source: row.source,
    });
  }

  // Start from a clean directory so codes dropped upstream do not linger.
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const codes = Object.keys(grouped).sort();
  let largest = 0;

  for (const code of codes) {
    const file = path.join(OUTPUT_DIR, `${code}.json`);
    // No indentation: this is machine-read only, and the whitespace was most of
    // the old file size.
    fs.writeFileSync(file, JSON.stringify(grouped[code]));
    largest = Math.max(largest, fs.statSync(file).size);
  }

  // The index lets the route answer "which countries are covered?" and validate a
  // requested code without touching any of the per-country files.
  const index = {
    generatedAt: new Date().toISOString(),
    totalRecords: processed.length,
    yearRange: {
      min: Math.min(...processed.map((r) => r.year)),
      max: Math.max(...processed.map((r) => r.year)),
    },
    countries: codes.map((code) => ({
      code,
      name: grouped[code].country,
      region: grouped[code].region,
      subregion: grouped[code].subregion,
      records: grouped[code].data.length,
    })),
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.json'), JSON.stringify(index));

  console.log('Crime data conversion complete.');
  console.log(`  ${processed.length.toLocaleString()} records across ${codes.length} countries`);
  console.log(`  years ${index.yearRange.min}-${index.yearRange.max}`);
  console.log(`  largest country file: ${(largest / 1024).toFixed(0)} kB`);
  console.log(`  written to ${OUTPUT_DIR}`);

  return { success: true, countries: codes.length };
}

convertCrimeDataToJson();
