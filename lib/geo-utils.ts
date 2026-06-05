import { geoContains, geoCentroid } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import type { CountryFeature } from "@/types";

export function getCountryCentroid(feature: Feature<Geometry>): [number, number] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return geoCentroid(feature as any) as [number, number];
}

export function isPointInCountry(
  lngLat: [number, number],
  feature: Feature<Geometry>
): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return geoContains(feature as any, lngLat);
}

export function getDistanceMilesToCountry(
  lngLat: [number, number],
  feature: Feature<Geometry>
): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const centroid = geoCentroid(feature as any) as [number, number];
  return haversineDistanceMiles(lngLat, centroid);
}

export function findCountryAtPoint(
  lngLat: [number, number],
  countries: CountryFeature[]
): CountryFeature | null {
  return countries.find((c) => isPointInCountry(lngLat, c.feature)) ?? null;
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
