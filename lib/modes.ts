import type { GameMode, MapKind } from "@/types";
import { PROVINCE_CAPITALS } from "./provinceCapitals";

export const MODES: GameMode[] = ["standard", "polly", "states", "statehouse", "provinces", "provcapitals"];

// The "standard" key is kept so existing leaderboard scores carry over; only its display name changed
export const MODE_LABELS: Record<GameMode, string> = {
  standard: "International Flight",
  polly: "Polly Wants a Capital",
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
  // Climb easy → hard tiers; otherwise every pick is random
  tiers: boolean;
  noun: "country" | "state" | "province";
  // How many rounds a game lasts; never more than the places it can ask about
  rounds: number;
  // One line for the game picker
  blurb: string;
  // Chapter numeral on the home screen
  numeral: string;
  // Ink color for this mode's numeral: red for the world, blue for the US, green for Canada
  ink: string;
}

export const MODE_INFO: Record<GameMode, ModeInfo> = {
  standard: {
    map: "world", capitals: false, tiers: true, noun: "country", numeral: "I", rounds: DEFAULT_ROUNDS,
    blurb: "Countries of the world, easy to hard",
    ink: "#b23a2e",
  },
  polly: {
    map: "world", capitals: true, tiers: true, noun: "country", numeral: "II", rounds: DEFAULT_ROUNDS,
    blurb: "From capital to country",
    ink: "#b23a2e",
  },
  states: {
    map: "us", capitals: false, tiers: false, noun: "state", numeral: "III", rounds: DEFAULT_ROUNDS,
    blurb: "All fifty states",
    ink: "#2e5d7a",
  },
  statehouse: {
    map: "us", capitals: true, tiers: false, noun: "state", numeral: "IV", rounds: DEFAULT_ROUNDS,
    blurb: "From state capital to state",
    ink: "#2e5d7a",
  },
  provinces: {
    map: "ca", capitals: false, tiers: false, noun: "province", numeral: "V", rounds: PROVINCE_COUNT,
    blurb: "All 13 provinces and territories",
    ink: "#3f6b2f",
  },
  provcapitals: {
    map: "ca", capitals: true, tiers: false, noun: "province", numeral: "VI", rounds: PROVINCE_COUNT,
    blurb: "From capital to province or territory",
    ink: "#3f6b2f",
  },
};

export const maxScore = (mode: GameMode) => MODE_INFO[mode].rounds * POINTS_PER_ROUND;

export function isGameMode(value: unknown): value is GameMode {
  return typeof value === "string" && (MODES as string[]).includes(value);
}
