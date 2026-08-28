// Pre-projects world country boundaries into SVG path strings.
//
// Doing this at build time means the browser needs no TopoJSON decoder and no
// projection library: the choropleth just renders <path d="...">. d3-geo is a
// devDependency for the same reason - it runs here and never ships. The output is
// keyed by ISO 3166-1 alpha-3 numeric (M49) so it joins straight onto the country
// table.
//
// Run with: npm run generate-map
//
// The first version of this script projected the coordinates by hand:
//
//   x = (lon + 180) / 360 * WIDTH, y = (90 - lat) / 180 * HEIGHT
//
// which is right for a single point and wrong for a ring. Two things broke.
//
// Countries that cross the antimeridian - Russia and Fiji - hold vertices at both
// +179 and -179 degrees. Those project to opposite edges of the map, and the
// segment between them was drawn as a straight line across all 800 pixels. That
// was the thick band over Eurasia and the thin one through the Pacific: four
// full-width chords from Russia and two from Fiji.
//
// Latitudes past 84 degrees were dropped with `continue`, which does not clip a
// polygon - it deletes a vertex and joins its neighbours. Greenland's and
// Antarctica's northern and southern coasts were stitched into long horizontal
// chords the same way.
//
// d3-geo cuts geometry at the antimeridian and clips it against the sphere as part
// of projecting, so both classes of artefact are gone. The projection is Natural
// Earth rather than equirectangular, which is the usual choice for a world
// choropleth: equirectangular stretches everything near the poles east-west, which
// is what made Greenland and Antarctica look torn.

const fs = require('fs');
const path = require('path');
const topojson = require('topojson-client');
const { geoNaturalEarth1, geoPath } = require('d3-geo');

const SOURCE = 'https://unpkg.com/world-atlas@2/countries-110m.json';
const OUTPUT = path.join(__dirname, '../public/world-countries.json');

const WIDTH = 800;

/**
 * Antarctica has no entry in the country table, so it can never be shaded and only
 * ever renders as a grey band along the bottom of the map.
 */
const ANTARCTICA = '010';

async function main() {
  console.log('Fetching world boundaries...');
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`world-atlas responded ${response.status}`);

  const topology = await response.json();
  const collection = topojson.feature(topology, topology.objects.countries);

  const features = collection.features.filter(
    (f) => String(f.id ?? '').padStart(3, '0') !== ANTARCTICA
  );

  const land = { type: 'FeatureCollection', features };

  // Fit to the width, then measure what that gives vertically and shift the
  // drawing flush to the top. Natural Earth's outline is curved, so fitting a
  // fixed box would leave a band of dead space above and below the land.
  const projection = geoNaturalEarth1().fitWidth(WIDTH, land);

  // One decimal place in pixel space is a tenth of a pixel - finer than anything
  // that can be displayed, and it roughly halves the file.
  const render = geoPath(projection).digits(1);

  const [[, top], [, bottom]] = render.bounds(land);
  const [tx, ty] = projection.translate();
  projection.translate([tx, ty - top]);
  const HEIGHT = Math.ceil(bottom - top);

  // world-atlas identifies countries by M49 numeric code; the app's table carries
  // the same code as `ccn3`, which is how these join up.
  const paths = {};
  let skipped = 0;

  for (const feature of features) {
    const numeric = String(feature.id ?? '').padStart(3, '0');
    const d = render(feature);
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
