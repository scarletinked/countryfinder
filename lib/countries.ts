import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { CountryFeature } from "@/types";
import { COUNTRY_NAMES } from "./countryNames";

let cached: CountryFeature[] | null = null;

export async function loadCountries(): Promise<CountryFeature[]> {
  if (cached) return cached;

  const res = await fetch("/countries-50m.json");
  const topology = (await res.json()) as Topology<{
    countries: GeometryCollection<Record<string, never>>;
  }>;

  const collection = topojson.feature(topology, topology.objects.countries);

  const countries: CountryFeature[] = collection.features
    .filter((f) => f.id !== undefined && f.id !== null && f.geometry !== null)
    .map((f) => ({
      id: Number(f.id),
      name: COUNTRY_NAMES[Number(f.id)],
      feature: f as CountryFeature["feature"],
    }))
    .filter((c) => c.name !== undefined);

  cached = countries;
  return countries;
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
