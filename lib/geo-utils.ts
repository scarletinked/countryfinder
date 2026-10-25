import { geoCentroid } from "d3-geo";
import type { Feature, Geometry } from "geojson";

export function getCountryCentroid(feature: Feature<Geometry>): [number, number] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return geoCentroid(feature as any) as [number, number];
}

export function getDistanceMilesToCountry(
  lngLat: [number, number],
  feature: Feature<Geometry>
): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const centroid = geoCentroid(feature as any) as [number, number];
  return haversineDistanceMiles(lngLat, centroid);
}

// Shortest distance, in projected map units, from a projected point to a country's outline
export function distanceToOutline(
  point: [number, number],
  feature: Feature<Geometry>,
  project: (lngLat: [number, number]) => [number, number] | null
): number {
  const geom = feature.geometry;
  const polygons =
    geom.type === "Polygon" ? [geom.coordinates] : geom.type === "MultiPolygon" ? geom.coordinates : [];
  let best = Infinity;
  for (const polygon of polygons) {
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
