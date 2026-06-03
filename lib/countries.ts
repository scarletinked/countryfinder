import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, Geometry, MultiPolygon } from "geojson";
import type { CountryFeature } from "@/types";
import { COUNTRY_NAMES } from "./countryNames";

let cached: CountryFeature[] | null = null;

function toMultiPolygonCoords(geometry: Geometry): number[][][][] {
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  if (geometry.type === "Polygon") return [geometry.coordinates];
  return [];
}

function mergeFeatures(a: CountryFeature, b: CountryFeature): CountryFeature {
  const merged: MultiPolygon = {
    type: "MultiPolygon",
    coordinates: [
      ...toMultiPolygonCoords(a.feature.geometry),
      ...toMultiPolygonCoords(b.feature.geometry),
    ],
  };
  return { ...a, feature: { ...a.feature, geometry: merged } as Feature<Geometry> };
}

export async function loadCountries(): Promise<CountryFeature[]> {
  if (cached) return cached;

  const res = await fetch("/countries-50m.json");
  const topology = (await res.json()) as Topology<{
    countries: GeometryCollection<Record<string, never>>;
  }>;

  const collection = topojson.feature(topology, topology.objects.countries);

  const raw: CountryFeature[] = collection.features
    .filter((f) => f.id !== undefined && f.id !== null && f.geometry !== null)
    .map((f) => ({
      id: Number(f.id),
      name: COUNTRY_NAMES[Number(f.id)],
      feature: f as CountryFeature["feature"],
    }))
    .filter((c) => c.name !== undefined);

  // Merge duplicate IDs (e.g. Australia has two separate features in the dataset)
  const byId = new Map<number, CountryFeature>();
  for (const c of raw) {
    byId.set(c.id, byId.has(c.id) ? mergeFeatures(byId.get(c.id)!, c) : c);
  }

  cached = Array.from(byId.values());
  return cached;
}

export function pickRandomCountries(
  countries: CountryFeature[],
  n: number
): CountryFeature[] {
  const arr = [...countries];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}
