import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { CountryFeature } from "@/types";

let cached: CountryFeature[] | null = null;

// FIPS codes from 60 up are territories, which the US map projection can't draw
const MAX_STATE_FIPS = 56;

// The 50 states plus DC, from us-atlas's 1:10M boundaries
export async function loadStates(): Promise<CountryFeature[]> {
  if (cached) return cached;

  const res = await fetch("/states-10m.json");
  const topology = (await res.json()) as Topology<{
    states: GeometryCollection<{ name: string }>;
  }>;

  const collection = topojson.feature(topology, topology.objects.states);

  cached = collection.features
    .filter((f) => f.geometry !== null && Number(f.id) <= MAX_STATE_FIPS)
    .map((f) => ({
      id: Number(f.id),
      name: f.properties.name,
      feature: f as CountryFeature["feature"],
    }));
  return cached;
}
