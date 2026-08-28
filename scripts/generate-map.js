// Pre-projects world country boundaries into SVG path strings.
//
// Doing this at build time means the browser needs no TopoJSON decoder and no
// projection library: the choropleth just renders <path d="...">. The output is
// keyed by ISO 3166-1 alpha-3 so it joins straight onto the country table.
//
// Run with: npm run generate-map

const fs = require('fs');
const path = require('path');
const topojson = require('topojson-client');

const SOURCE = 'https://unpkg.com/world-atlas@2/countries-110m.json';
const OUTPUT = path.join(__dirname, '../public/world-countries.json');

// Equirectangular, which keeps the projection maths to two lines and is honest
// about being a reference map rather than an area-accurate one.
const WIDTH = 800;
const HEIGHT = 400;
// Latitudes beyond this are clipped; it drops most of Antarctica's empty bulk.
const MAX_LAT = 84;

const projectX = (lon) => ((lon + 180) / 360) * WIDTH;
const projectY = (lat) => ((90 - lat) / 180) * HEIGHT;

/** Round to one decimal - about 40 m at the equator, far finer than one pixel. */
const round = (n) => Math.round(n * 10) / 10;

function ringToPath(ring) {
  let d = '';
  let last = null;
  for (const [lon, lat] of ring) {
    if (Math.abs(lat) > MAX_LAT) continue;
    const x = round(projectX(lon));
    const y = round(projectY(lat));
    // Drop points that round to the same pixel as the previous one.
    if (last && last[0] === x && last[1] === y) continue;
    d += `${d === '' ? 'M' : 'L'}${x},${y}`;
    last = [x, y];
  }
  return d === '' ? '' : `${d}Z`;
}

function geometryToPath(geometry) {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ringToPath).join('');
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flat().map(ringToPath).join('');
  }
  return '';
}

async function main() {
  console.log('Fetching world boundaries...');
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`world-atlas responded ${response.status}`);

  const topology = await response.json();
  const collection = topojson.feature(topology, topology.objects.countries);

  // world-atlas identifies countries by M49 numeric code; the app's table carries
  // the same code as `ccn3`, which is how these join up.
  const paths = {};
  let skipped = 0;

  for (const feature of collection.features) {
    const numeric = String(feature.id ?? '').padStart(3, '0');
    const d = geometryToPath(feature.geometry);
    if (!numeric || !d) {
      skipped += 1;
      continue;
    }
    paths[numeric] = d;
  }

  fs.writeFileSync(OUTPUT, JSON.stringify({ width: WIDTH, height: HEIGHT, paths }));

  const bytes = fs.statSync(OUTPUT).size;
  console.log(`Wrote ${Object.keys(paths).length} country outlines to ${OUTPUT}`);
  console.log(`  ${(bytes / 1024).toFixed(0)} kB${skipped ? `, ${skipped} features skipped` : ''}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
