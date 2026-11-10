import type { GameMode, MapKind } from "@/types";
import { PROVINCE_CAPITALS } from "./provinceCapitals";

export const MODES: GameMode[] = ["standard", "blind", "polly", "birds", "states", "statehouse", "provinces", "provcapitals"];

// The "standard" key is kept so existing leaderboard scores carry over; only its display name changed
export const MODE_LABELS: Record<GameMode, string> = {
  standard: "International Flight",
  blind: "Flying Blind",
  polly: "Polly Wants a Capital",
  birds: "What Type of Bird Is That?!",
  states: "United Squawks of America",
  statehouse: "Polly Wants a Statehouse",
  provinces: "True North Flyover",
  provcapitals: "Polly Wants a Parliament",
};

export const POINTS_PER_ROUND = 100;
const DEFAULT_ROUNDS = 10;
// The Canada games ask about every province and territory once (13 rounds)
const PROVINCE_COUNT = Object.keys(PROVINCE_CAPITALS).length;

export interface ModeInfo {
  map: MapKind;
  // Prompt with the capital instead of the place's own name
  capitals: boolean;
  // Prompt with a fact about the place instead of its name
  hints: boolean;
  // Draw the lines between places; off, the land is one unbroken colour until the answer is shown
  borders: boolean;
  // Climb easy → hard tiers; otherwise every pick is random
  tiers: boolean;
  noun: "country" | "state" | "province";
  // How many rounds a game lasts; never more than the places it can ask about
  rounds: number;
  // One line for the game picker
  blurb: string;
}

export const MODE_INFO: Record<GameMode, ModeInfo> = {
  standard: {
    map: "world", capitals: false, hints: false, borders: true, tiers: true, noun: "country", rounds: DEFAULT_ROUNDS,
    blurb: "Countries of the world",
  },
  blind: {
    map: "world", capitals: false, hints: false, borders: false, tiers: true, noun: "country", rounds: DEFAULT_ROUNDS,
    blurb: "Countries of the world, without borders",
  },
  polly: {
    map: "world", capitals: true, hints: false, borders: true, tiers: true, noun: "country", rounds: DEFAULT_ROUNDS,
    blurb: "From capital to country",
  },
  birds: {
    map: "world", capitals: false, hints: true, borders: true, tiers: true, noun: "country", rounds: DEFAULT_ROUNDS,
    blurb: "From a curious fact to country",
  },
  states: {
    map: "us", capitals: false, hints: false, borders: true, tiers: false, noun: "state", rounds: DEFAULT_ROUNDS,
    blurb: "All fifty states",
  },
  statehouse: {
    map: "us", capitals: true, hints: false, borders: true, tiers: false, noun: "state", rounds: DEFAULT_ROUNDS,
    blurb: "From state capital to state",
  },
  provinces: {
    map: "ca", capitals: false, hints: false, borders: true, tiers: false, noun: "province", rounds: PROVINCE_COUNT,
    blurb: "All 13 provinces and territories",
  },
  provcapitals: {
    map: "ca", capitals: true, hints: false, borders: true, tiers: false, noun: "province", rounds: PROVINCE_COUNT,
    blurb: "From capital to province or territory",
  },
};

export const maxScore = (mode: GameMode) => MODE_INFO[mode].rounds * POINTS_PER_ROUND;

export function isGameMode(value: unknown): value is GameMode {
  return typeof value === "string" && (MODES as string[]).includes(value);
}
