import { geoArea, geoBounds, geoCentroid, geoContains } from "d3-geo";
import type { Feature, Geometry, Polygon, Position } from "geojson";

function polygonsOf(feature: Feature<Geometry>): Position[][][] {
  const geom = feature.geometry;
  return geom.type === "Polygon" ? [geom.coordinates] : geom.type === "MultiPolygon" ? geom.coordinates : [];
}

// A point on the country's main landmass, so overseas territories and island
// spreads don't drag it into the sea (France's plain centroid lands off Spain)
export function getLandmarkPoint(feature: Feature<Geometry>): [number, number] {
  const pieces = polygonsOf(feature).map((coordinates): Polygon => ({ type: "Polygon", coordinates }));
  if (pieces.length === 0) return geoCentroid(feature) as [number, number];
  const main = pieces.reduce((a, b) => (geoArea(b) > geoArea(a) ? b : a));

  const centroid = geoCentroid(main) as [number, number];
  if (geoContains(main, centroid)) return centroid;

  // Crescent-shaped pieces (e.g. Vietnam) have their centroid outside, so pick
  // the inside point on a coarse grid that sits farthest from the coast
  const [[x0, y0], [x1raw, y1]] = geoBounds(main);
  const x1 = x1raw < x0 ? x1raw + 360 : x1raw;
  const coast = main.coordinates.flat();
  let best = centroid;
  let bestDepth = -1;
  const N = 24;
  for (let i = 1; i < N; i++) {
    for (let j = 1; j < N; j++) {
      const lng = ((x0 + ((x1 - x0) * i) / N + 540) % 360) - 180;
      const p: [number, number] = [lng, y0 + ((y1 - y0) * j) / N];
      if (!geoContains(main, p)) continue;
      const depth = Math.min(...coast.map((c) => haversineDistanceMiles(p, c as [number, number])));
      if (depth > bestDepth) {
        bestDepth = depth;
        best = p;
      }
    }
  }
  return best;
}

// Distance in miles from a point to the nearest edge of a country
export function getDistanceMilesToCountry(
  lngLat: [number, number],
  feature: Feature<Geometry>
): number {
  const [lng0, lat0] = lngLat;
  const cosLat = Math.cos((lat0 * Math.PI) / 180);
  // Flatten around the click so we can find each edge's closest point cheaply
  const toLocal = ([lng, lat]: Position): [number, number] => [
    ((((lng - lng0 + 540) % 360) - 180) * cosLat),
    lat - lat0,
  ];
  let best = Infinity;
  for (const polygon of polygonsOf(feature)) {
    for (const ring of polygon) {
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1];
        const b = ring[i];
        const [ax, ay] = toLocal(a);
        const [bx, by] = toLocal(b);
        const dx = bx - ax;
        const dy = by - ay;
        const lenSq = dx * dx + dy * dy;
        const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lenSq));
        let dLng = b[0] - a[0];
        dLng = ((dLng + 540) % 360) - 180;
        const closest: [number, number] = [a[0] + dLng * t, a[1] + (b[1] - a[1]) * t];
        best = Math.min(best, haversineDistanceMiles(lngLat, closest));
      }
    }
  }
  return best;
}

// Shortest distance, in projected map units, from a projected point to a country's outline
export function distanceToOutline(
  point: [number, number],
  feature: Feature<Geometry>,
  project: (lngLat: [number, number]) => [number, number] | null
): number {
  let best = Infinity;
  for (const polygon of polygonsOf(feature)) {
    for (const ring of polygon) {
      let prev: [number, number] | null = null;
      for (const coord of ring) {
        const cur = project(coord as [number, number]);
        // Skip the long jump a ring makes when it wraps around the antimeridian
        if (prev && cur && Math.abs(cur[0] - prev[0]) < 100) {
          best = Math.min(best, distanceToSegment(point, prev, cur));
        }
        prev = cur;
      }
    }
  }
  return best;
}

function distanceToSegment(
  [px, py]: [number, number],
  [ax, ay]: [number, number],
  [bx, by]: [number, number]
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function haversineDistanceMiles(
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number]
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
