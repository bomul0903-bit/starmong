import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const URLS = {
  lines: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json',
  names: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.json',
  stars: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/stars.6.json',
  starnames: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/starnames.json',
};

async function fetchJSON(url) {
  const filename = url.split('/').pop();
  console.log(`  Fetching ${filename}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${filename}: ${res.status}`);
  return res.json();
}

async function main() {
  console.log('Downloading d3-celestial data...');
  const [linesData, namesData, starsData, starnamesData] = await Promise.all([
    fetchJSON(URLS.lines),
    fetchJSON(URLS.names),
    fetchJSON(URLS.stars),
    fetchJSON(URLS.starnames),
  ]);
  console.log(`  Stars catalog: ${starsData.features.length} stars`);
  console.log(`  Star names: ${Object.keys(starnamesData).length} entries`);

  // Build star catalog for matching
  const starCatalog = starsData.features.map(f => ({
    hip: String(f.id),
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    mag: f.properties.mag,
  }));

  // Build constellation name lookup (Korean + English)
  const nameMap = {};
  namesData.features.forEach(f => {
    nameMap[f.id] = {
      ko: f.properties.ko || f.properties.name,
      en: f.properties.en || f.properties.name,
    };
  });

  console.log('\nProcessing 88 constellations...');
  const constellations = [];

  for (const feature of linesData.features) {
    const abbr = feature.id;
    const rank = parseInt(feature.properties.rank) || 2;
    const multiLines = feature.geometry.coordinates;

    // -- Extract unique vertices and edges from MultiLineString --
    const vertexMap = new Map();
    const edges = [];

    for (const line of multiLines) {
      for (let i = 0; i < line.length; i++) {
        const [lon, lat] = line[i];
        const key = `${lon.toFixed(4)},${lat.toFixed(4)}`;
        if (!vertexMap.has(key)) {
          vertexMap.set(key, { lon, lat });
        }
        if (i > 0) {
          const prevKey = `${line[i - 1][0].toFixed(4)},${line[i - 1][1].toFixed(4)}`;
          edges.push([prevKey, key]);
        }
      }
    }

    // -- Assign sequential IDs --
    const vertices = Array.from(vertexMap.entries());
    const keyToId = new Map();
    vertices.forEach(([key], i) => keyToId.set(key, i + 1));

    // -- Build path (deduplicate edges) --
    const edgeSet = new Set();
    const path = [];
    for (const [k1, k2] of edges) {
      const id1 = keyToId.get(k1);
      const id2 = keyToId.get(k2);
      const edgeKey = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        path.push([id1, id2]);
      }
    }

    // -- Match each vertex to nearest star in catalog --
    const stars = vertices.map(([, { lon, lat }], i) => {
      let nearest = null;
      let minDist = Infinity;

      for (const star of starCatalog) {
        const dlon = star.lon - lon;
        const dlat = star.lat - lat;
        const dist = dlon * dlon + dlat * dlat;
        if (dist < minDist) {
          minDist = dist;
          nearest = star;
        }
      }

      // Accept match within ~2 degrees
      const matched = nearest && minDist < 4;
      const mag = matched ? nearest.mag : 4;
      const starInfo = matched ? starnamesData[nearest.hip] : null;
      const name = starInfo?.ko || starInfo?.name || null;

      return { id: i + 1, lon, lat, mag, name };
    });

    // -- Normalize coordinates to 10-90 range --
    let lons = stars.map(s => s.lon);
    const lats = stars.map(s => s.lat);

    // Handle longitude wrapping (constellations crossing RA 12h boundary)
    const lonSpread = Math.max(...lons) - Math.min(...lons);
    if (lonSpread > 180) {
      lons = lons.map(l => (l < 0 ? l + 360 : l));
    }

    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const lonRange = maxLon - minLon || 1;
    const latRange = maxLat - minLat || 1;

    const PAD = 10;
    const SPAN = 80; // 10..90

    const normalizedStars = stars.map((s, idx) => {
      const normLon = lons[idx];
      const result = {
        id: s.id,
        x: Math.round(PAD + ((normLon - minLon) / lonRange) * SPAN),
        y: Math.round(PAD + ((maxLat - s.lat) / latRange) * SPAN), // flip Y
        r: Math.max(2, Math.min(6, Math.round(7 - s.mag))),
      };
      if (s.name) result.name = s.name;
      return result;
    });

    const names = nameMap[abbr] || { ko: abbr, en: abbr };
    const difficulty = rank === 1 ? '쉬움' : rank === 2 ? '보통' : '어려움';

    constellations.push({
      id: abbr,
      name: names.ko,
      nameEn: names.en,
      difficulty,
      stars: normalizedStars,
      path,
      desc: `${names.ko}(${names.en})`,
    });
  }

  // -- Graph simplification --
  // Remove degree-2 unnamed nodes (pass-through points) and connect their neighbors.
  // Keeps: named stars, endpoints (degree 1), junctions (degree 3+).
  function simplify(stars, path) {
    let nodeIds = new Set(stars.map(s => s.id));
    let edges = path.map(e => [...e]);

    function getDegree(id) {
      return edges.filter(([a, b]) => a === id || b === id).length;
    }
    function getNeighbors(id) {
      const neighbors = [];
      for (const [a, b] of edges) {
        if (a === id) neighbors.push(b);
        else if (b === id) neighbors.push(a);
      }
      return neighbors;
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const id of nodeIds) {
        const star = stars.find(s => s.id === id);
        if (star?.name) continue; // keep named stars
        if (getDegree(id) !== 2) continue; // keep endpoints and junctions

        const [n1, n2] = getNeighbors(id);
        // Remove edges touching this node
        edges = edges.filter(([a, b]) => a !== id && b !== id);
        // Add direct edge between neighbors (if not already present)
        const exists = edges.some(([a, b]) =>
          (a === n1 && b === n2) || (a === n2 && b === n1)
        );
        if (!exists) edges.push([n1, n2]);
        nodeIds.delete(id);
        changed = true;
        break; // restart iteration after mutation
      }
    }

    // Rebuild with sequential IDs
    const keptStars = stars.filter(s => nodeIds.has(s.id));
    const oldToNew = new Map();
    keptStars.forEach((s, i) => oldToNew.set(s.id, i + 1));

    return {
      stars: keptStars.map((s, i) => ({ ...s, id: i + 1 })),
      path: edges.map(([a, b]) => [oldToNew.get(a), oldToNew.get(b)]),
    };
  }

  // Merge Serpens (Ser) — the only constellation split into two parts
  const serIndices = [];
  constellations.forEach((c, i) => { if (c.id === 'Ser') serIndices.push(i); });
  if (serIndices.length === 2) {
    const [a, b] = serIndices.map(i => constellations[i]);
    // Re-ID second part's stars to continue after first part
    const offset = a.stars.length;
    const mergedStars = [
      ...a.stars,
      ...b.stars.map(s => ({ ...s, id: s.id + offset })),
    ];
    const mergedPath = [
      ...a.path,
      ...b.path.map(([s1, s2]) => [s1 + offset, s2 + offset]),
    ];
    constellations[serIndices[0]] = { ...a, stars: mergedStars, path: mergedPath };
    constellations.splice(serIndices[1], 1);
  }

  // Merge close stars — collapse stars within `threshold` distance into a representative star
  function mergeCloseStars(stars, path, threshold = 5) {
    let currentStars = stars.map(s => ({ ...s }));
    let currentPath = path.map(e => [...e]);

    let merged = true;
    while (merged) {
      merged = false;
      for (let i = 0; i < currentStars.length && !merged; i++) {
        for (let j = i + 1; j < currentStars.length && !merged; j++) {
          const a = currentStars[i];
          const b = currentStars[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= threshold) continue;

          // Pick representative: prefer named star, then larger radius
          let keep, remove;
          if (a.name && !b.name) { keep = a; remove = b; }
          else if (!a.name && b.name) { keep = b; remove = a; }
          else if (a.r >= b.r) { keep = a; remove = b; }
          else { keep = b; remove = a; }

          // Transfer edges from removed star to kept star
          currentPath = currentPath.map(([s, e]) => [
            s === remove.id ? keep.id : s,
            e === remove.id ? keep.id : e,
          ]);
          // Remove self-loops
          currentPath = currentPath.filter(([s, e]) => s !== e);
          // Remove duplicate edges
          const edgeSet = new Set();
          currentPath = currentPath.filter(([s, e]) => {
            const key = Math.min(s, e) + '-' + Math.max(s, e);
            if (edgeSet.has(key)) return false;
            edgeSet.add(key);
            return true;
          });
          // Remove the star
          currentStars = currentStars.filter(s => s.id !== remove.id);
          merged = true;
        }
      }
    }

    // Re-assign sequential IDs
    const oldToNew = new Map();
    currentStars.forEach((s, i) => oldToNew.set(s.id, i + 1));
    return {
      stars: currentStars.map((s, i) => ({ ...s, id: i + 1 })),
      path: currentPath.map(([a, b]) => [oldToNew.get(a), oldToNew.get(b)]),
    };
  }

  // Merge close stars only (no simplify)
  let mergedTotal = 0;
  for (const c of constellations) {
    const beforeMerge = c.stars.length;
    const merged = mergeCloseStars(c.stars, c.path);
    c.stars = merged.stars;
    c.path = merged.path;
    mergedTotal += beforeMerge - c.stars.length;
  }
  console.log(`  Merged: removed ${mergedTotal} close stars (threshold < 5)`);

  // Assign difficulty by star count (9-tier system)
  constellations.forEach((c) => {
    const n = c.stars.length;
    if (n <= 2)      c.difficulty = '2별';
    else if (n <= 3) c.difficulty = '3별';
    else if (n <= 4) c.difficulty = '4별';
    else if (n <= 5) c.difficulty = '5별';
    else if (n <= 6) c.difficulty = '6별';
    else if (n <= 8) c.difficulty = '7~8별';
    else if (n <= 11) c.difficulty = '9~11별';
    else if (n <= 14) c.difficulty = '12~14별';
    else              c.difficulty = '15~23별';
  });
  constellations.sort((a, b) => a.stars.length - b.stars.length);
  const tiers = ['2별','3별','4별','5별','6별','7~8별','9~11별','12~14별','15~23별'];
  console.log(`  Difficulty distribution: ${tiers.map(t => `${t}=${constellations.filter(c=>c.difficulty===t).length}`).join(', ')}`);

  // Write output
  const outputDir = join(__dirname, '..', 'src', 'data');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, 'constellations.json');
  writeFileSync(outputPath, JSON.stringify(constellations, null, 2));

  // Stats
  const totalStars = constellations.reduce((sum, c) => sum + c.stars.length, 0);
  const totalEdges = constellations.reduce((sum, c) => sum + c.path.length, 0);
  const namedStars = constellations.reduce((sum, c) => sum + c.stars.filter(s => s.name).length, 0);

  console.log(`\nDone! Generated ${constellations.length} constellations`);
  console.log(`  Total stars: ${totalStars}`);
  console.log(`  Total edges: ${totalEdges}`);
  console.log(`  Named stars: ${namedStars}`);
  console.log(`  Output: ${outputPath}`);

  // File size
  const { size } = await import('node:fs').then(fs => fs.statSync(outputPath));
  console.log(`  File size: ${(size / 1024).toFixed(1)}KB`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
