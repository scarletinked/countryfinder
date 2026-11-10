import type { FeatureCollection, Geometry } from "geojson";
import type { CountryFeature } from "@/types";

let cached: CountryFeature[] | null = null;

// Canada's 10 provinces and 3 territories, from Natural Earth's 1:50M admin-1 boundaries
export async function loadProvinces(): Promise<CountryFeature[]> {
  if (cached) return cached;

  const res = await fetch("/provinces-50m.json");
  const collection = (await res.json()) as FeatureCollection<Geometry, { name: string }>;

  cached = collection.features.map((f) => ({
    id: Number(f.id),
    name: f.properties.name,
    feature: f,
  }));
  return cached;
}
